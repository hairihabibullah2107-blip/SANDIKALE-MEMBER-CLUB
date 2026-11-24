import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const sha=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,"0")).join("");
const randomToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(18))).map(b=>b.toString(16).padStart(2,"0")).join("");
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 try{
  const body=await req.json(),db=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const ip=req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")?.split(",")[0]||"unknown";
  const limit=body.action==="create_order"?3:20;
  const {data:allowed,error:rateError}=await db.rpc("showroom_take_rate_limit",{p_ip_hash:await sha(ip),p_max_hits:limit});
  if(rateError)throw rateError;
  if(!allowed)return json({error:"Terlalu banyak permintaan. Silakan tunggu beberapa menit lalu coba kembali."},429);
  if(body.action==="track_order"){
   const code=String(body.tracking_code||"").trim();if(code.length<20||code.length>100)return json({error:"Kode tracking tidak valid."},400);
   const{data:order,error}=await db.from("showroom_orders").select("id,order_number,spk_number,status,created_at").eq("access_token_hash",await sha(code)).maybeSingle();
   if(error||!order)return json({error:"Pesanan tidak ditemukan. Periksa kembali kode tracking."},404);
   const{data:history}=await db.from("showroom_order_status_history").select("new_status,created_at,notes").eq("order_id",order.id).order("created_at",{ascending:true});
   const{data:items}=await db.from("showroom_order_items").select("id,product_name_snapshot,showroom_order_designs(id,approval_status,design_version,original_storage_path,design_configuration)").eq("order_id",order.id);const designs=[];for(const item of items||[]){for(const d of item.showroom_order_designs||[]){let preview_url=null;if(d.original_storage_path){const{data:signed}=await db.storage.from("showroom-customer-designs").createSignedUrl(d.original_storage_path,600);preview_url=signed?.signedUrl||null}designs.push({id:d.id,product_name:item.product_name_snapshot,approval_status:d.approval_status,design_version:d.design_version,design_configuration:d.design_configuration,preview_url})}}return json({...order,history:history||[],designs});
  }
  if(body.action==="design_decision"){
   const code=String(body.tracking_code||"").trim(),designId=String(body.design_id||""),decision=String(body.decision||""),notes=String(body.notes||"").slice(0,1000);
   if(!["approved","revision_requested"].includes(decision))return json({error:"Keputusan desain tidak valid."},400);
   const{data:order,error:orderError}=await db.from("showroom_orders").select("id,status").eq("access_token_hash",await sha(code)).maybeSingle();
   if(orderError||!order)return json({error:"Pesanan tidak ditemukan."},404);
   if(order.status!=="waiting_customer_approval")return json({error:"Persetujuan desain belum dibuka oleh admin."},409);
   const{data:design,error:designError}=await db.from("showroom_order_designs").select("id,design_version,showroom_order_items!inner(order_id)").eq("id",designId).eq("showroom_order_items.order_id",order.id).maybeSingle();
   if(designError||!design)return json({error:"Desain tidak ditemukan pada pesanan ini."},404);
   const now=new Date().toISOString(),{error:updateError}=await db.from("showroom_order_designs").update({approval_status:decision}).eq("id",design.id);
   if(updateError)throw updateError;
   const{error:approvalError}=await db.from("showroom_design_approvals").upsert({order_id:order.id,order_design_id:design.id,revision_number:design.design_version,approval_status:decision,approved_by_customer:decision==="approved",approved_at:decision==="approved"?now:null,notes}, {onConflict:"order_design_id,revision_number"});
   if(approvalError)throw approvalError;
   const{data:allDesigns}=await db.from("showroom_order_designs").select("approval_status,showroom_order_items!inner(order_id)").eq("showroom_order_items.order_id",order.id);
   const nextStatus=decision==="revision_requested"?"revision_requested":(allDesigns||[]).every(d=>d.approval_status==="approved")?"approved":"waiting_customer_approval";
   if(nextStatus!==order.status){const{error:statusError}=await db.from("showroom_orders").update({status:nextStatus,updated_at:now}).eq("id",order.id);if(statusError)throw statusError;}
   return json({success:true,status:nextStatus});
  }
  if(body.action==="save_spk"){
   const code=String(body.tracking_code||"").trim(),encoded=String(body.pdf_base64||"");
   if(code.length<20||code.length>100||encoded.length>9000000)return json({error:"Data SPK tidak valid atau terlalu besar."},400);
   const{data:order,error:orderError}=await db.from("showroom_orders").select("id,spk_number,order_number").eq("access_token_hash",await sha(code)).maybeSingle();
   if(orderError||!order)return json({error:"Pesanan tidak ditemukan."},404);
   const raw=atob(encoded),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
   if(new TextDecoder().decode(bytes.slice(0,5))!=="%PDF-")return json({error:"Dokumen bukan PDF yang valid."},415);
   const{count}=await db.from("showroom_spk_documents").select("id",{count:"exact",head:true}).eq("order_id",order.id).eq("document_type","customer_draft");
   const revision=(count||0)+1,path="orders/"+order.order_number+"/"+order.spk_number+"-draft-r"+revision+".pdf";
   const{error:uploadError}=await db.storage.from("showroom-spk-documents").upload(path,bytes,{contentType:"application/pdf",upsert:false});
   if(uploadError)throw uploadError;
   const{error:docError}=await db.from("showroom_spk_documents").insert({order_id:order.id,spk_number:order.spk_number,document_type:"customer_draft",revision_number:revision,storage_path:path,document_status:"active"});
   if(docError)throw docError;
   return json({saved:true,revision});
  }
  if(body.action!=="create_order")return json({error:"Aksi tidak dikenal."},400);
  const c=body.customer||{},items=Array.isArray(body.items)?body.items:[],name=String(c.name||"").trim(),phone=String(c.phone||"").replace(/[^0-9+]/g,"");
  if(name.length<2||name.length>120||phone.length<9||phone.length>18||items.length<1||items.length>10)return json({error:"Nama, WhatsApp, atau daftar produk tidak valid."},400);
  if(body.design_base64&&String(body.design_base64).length>12000000)return json({error:"File desain terlalu besar. Maksimal sekitar 8 MB."},413);
  const normalized=[];let subtotal=0,totalQty=0;
  const validPositions=["Depan - Tengah","Depan - Dada kiri","Depan - Dada kanan","Belakang - Tengah","Lengan kiri","Lengan kanan"];
  for(const it of items){
   const{data:p,error}=await db.from("showroom_products").select("id,name,base_price,model,is_published,available_colors").eq("id",it.product_id).eq("is_published",true).maybeSingle();
   if(error||!p)return json({error:"Produk tidak tersedia atau sudah tidak diterbitkan."},400);
   const qty=Math.max(1,Math.min(1000,Math.floor(Number(it.quantity)||1))),sizeRows=Array.isArray(it.sizes)?it.sizes:[],sizeTotal=sizeRows.reduce((sum,x)=>sum+Math.max(0,Math.floor(Number(x.quantity)||0)),0);
   if(sizeTotal!==qty)return json({error:"Jumlah tiap ukuran harus sama dengan total kuantitas produk."},400);
   const garment=it.garment_type==="long"?"long":it.garment_type==="short"?"short":null,color=String(it.color||"").trim(),available=Array.isArray(p.available_colors)?p.available_colors.map((x:any)=>typeof x==="string"?x:x?.name):[];
   if(!garment||!color||!available.includes(color))return json({error:"Model dan warna kaos wajib dipilih dari katalog."},400);
   const prints=Array.isArray(it.prints)?it.prints:[];if(!prints.length||prints.length>6)return json({error:"Setiap pesanan harus memiliki 1 sampai 6 posisi sablon."},400);
   const seen=new Set();let dtfUnit=0;const uploadedPrints=[];
   for(const pr of prints){
    const position=String(pr.position||"");if(!validPositions.includes(position)||seen.has(position))return json({error:"Posisi sablon tidak valid atau terduplikasi."},400);seen.add(position);
    const code=String(pr.size_code||"");const{data:rate,error:rateError}=await db.from("showroom_dtf_prices").select("size_code,label,price").eq("size_code",code).eq("is_active",true).maybeSingle();
    if(rateError||!rate||Number(rate.price)<=0)return json({error:"Tarif ukuran cetak "+code+" belum diatur admin."},400);
    const encoded=String(pr.design_base64||"");if(!encoded||encoded.length>12000000)return json({error:"File desain untuk "+position+" wajib diunggah dan maksimal sekitar 8 MB."},413);
    const raw=atob(encoded),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    const filename=String(pr.design_name||"").toLowerCase(),ext=filename.endsWith(".pdf")?"pdf":filename.endsWith(".png")?"png":filename.endsWith(".webp")?"webp":filename.endsWith(".jpg")||filename.endsWith(".jpeg")?"jpg":"";
    if(!ext)return json({error:"File desain "+position+" harus JPG, PNG, WEBP, atau PDF."},415);
    const signature=Array.from(bytes.slice(0,12)).map(x=>x.toString(16).padStart(2,"0")).join("");
    const valid=ext==="png"?signature.startsWith("89504e470d0a1a0a"):ext==="jpg"?signature.startsWith("ffd8ff"):ext==="webp"?new TextDecoder().decode(bytes.slice(8,12))==="WEBP":new TextDecoder().decode(bytes.slice(0,5))==="%PDF-";
    if(!valid)return json({error:"Isi file "+position+" tidak cocok dengan format yang diizinkan."},415);
    const mime=ext==="pdf"?"application/pdf":ext==="png"?"image/png":ext==="webp"?"image/webp":"image/jpeg",path="orders/pending/"+crypto.randomUUID()+"-"+ext;
    const{error:uploadError}=await db.storage.from("showroom-customer-designs").upload(path,bytes,{contentType:mime,upsert:false});if(uploadError)throw uploadError;
    dtfUnit+=Number(rate.price);uploadedPrints.push({position,size_code:code,size_label:rate.label,price:Number(rate.price),storage_path:path});
   }
   const unit=Number(p.base_price||0)+dtfUnit,line=unit*qty;normalized.push({product:p,qty,unit,line,dtfUnit,color,garment,prints:uploadedPrints,sizes:sizeRows});subtotal+=line;totalQty+=qty;
  }
  const tracking=randomToken(),orderNumber="ORD-"+new Date().toISOString().slice(0,10).replaceAll("-","")+"-"+crypto.randomUUID().slice(0,6).toUpperCase(),spkNumber="SPK-"+crypto.randomUUID().slice(0,6).toUpperCase();
  let customerId:string|null=null;const{data:existing}=await db.from("showroom_customers").select("id").eq("whatsapp",phone).maybeSingle();
  if(existing)customerId=existing.id;else{const{data:customer,error}=await db.from("showroom_customers").insert({name,whatsapp:phone,organization:String(c.organization||"").slice(0,120)||null,notes:String(c.notes||"").slice(0,1000)||null}).select("id").single();if(error)throw error;customerId=customer.id;}
  let designPath:string|null=null;
  if(body.design_base64){const raw=atob(body.design_base64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);const filename=String(body.design_name||"artwork").toLowerCase(),ext=filename.endsWith(".pdf")?"pdf":filename.endsWith(".png")?"png":filename.endsWith(".jpg")||filename.endsWith(".jpeg")?"jpg":"";if(!ext)return json({error:"Format artwork harus JPG, PNG, atau PDF."},415);const mime=ext==="pdf"?"application/pdf":ext==="png"?"image/png":"image/jpeg";const signature=Array.from(bytes.slice(0,8)).map(b=>b.toString(16).padStart(2,"0")).join("");const valid=ext==="png"?signature.startsWith("89504e470d0a1a0a"):ext==="jpg"?signature.startsWith("ffd8ff"):new TextDecoder().decode(bytes.slice(0,5))==="%PDF-";if(!valid)return json({error:"Isi file tidak cocok dengan format yang diizinkan."},415);designPath="orders/"+orderNumber+"/"+crypto.randomUUID()+"."+ext;const{error}=await db.storage.from("showroom-customer-designs").upload(designPath,bytes,{contentType:mime,upsert:false});if(error)throw error;}
  const{data:order,error:oe}=await db.from("showroom_orders").insert({order_number:orderNumber,spk_number:spkNumber,customer_id:customerId,status:"customer_submitted",payment_status:"unpaid",subtotal,discount:0,additional_cost:0,delivery_cost:0,total_amount:subtotal,access_token_hash:await sha(tracking),idempotency_key:crypto.randomUUID(),notes:String(c.notes||"").slice(0,1000),pricing_snapshot:{source:"published_product_and_dtf_rate",currency:"IDR",dtf_printing:true}}).select("id").single();if(oe)throw oe;
  for(const row of normalized){const{data:item,error:ie}=await db.from("showroom_order_items").insert({order_id:order.id,product_id:row.product.id,product_name_snapshot:row.product.name,model_snapshot:row.product.model,quantity:row.qty,unit_price:row.unit,subtotal:row.line,specification:{placement:row.prints.map(x=>x.position).join(", "),printing_method:"DTF",garment_type:row.garment,color:row.color,dtf_prints:row.prints.map(x=>({position:x.position,size_code:x.size_code,size_label:x.size_label,price:x.price}))}}).select("id").single();if(ie)throw ie;for(const s of Array.isArray(row.sizes)?row.sizes:[]){const q=Math.max(0,Math.min(1000,Math.floor(Number(s.quantity)||0)));if(q){const{error}=await db.from("showroom_order_variants").insert({order_item_id:item.id,size:String(s.size).slice(0,12),color:row.color.slice(0,40),quantity:q,unit_price:row.unit,subtotal:row.unit*q});if(error)throw error;}}for(const print of row.prints){const{error}=await db.from("showroom_order_designs").insert({order_item_id:item.id,original_storage_path:print.storage_path,design_configuration:{placement:print.position,printing_method:"DTF",garment_type:row.garment,color:row.color,size_code:print.size_code,size_label:print.size_label,dtf_price:print.price}});if(error)throw error;}}
  const{error:he}=await db.from("showroom_order_status_history").insert({order_id:order.id,new_status:"customer_submitted",notes:"Pesanan dibuat melalui Digital Showroom."});if(he)throw he;
  return json({order_number:orderNumber,spk_number:spkNumber,tracking_code:tracking,total_amount:subtotal,total_quantity:totalQty,customer_name:name,items:normalized.map(x=>({product_name_snapshot:x.product.name,quantity:x.qty,unit_price:x.unit,subtotal:x.line,sizes:x.sizes||[],placement:x.prints.map(p=>p.position).join(", "),prints:x.prints.map(p=>({position:p.position,size_code:p.size_code,price:p.price})),color:x.color,garment_type:x.garment,printing_method:"DTF"})),design_received:normalized.some(x=>x.prints.length>0)});
 }catch(e){console.error(e);return json({error:"Pesanan belum dapat diproses. Silakan coba kembali atau hubungi admin SANDIKALE."},500)}
});