import React,{useEffect,useMemo,useState}from"react";
import{supabase}from"./supabase.js";

const money=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
const KEY="sandikalefav_v1",RECENT="sandikalerecent_v1";
function imageFor(p){const img=(p.showroom_product_images||[]).find(x=>x.is_primary)||(p.showroom_product_images||[])[0];return img?.storage_path?supabase.storage.from("showroom-product-images").getPublicUrl(img.storage_path).data.publicUrl:""}
export default function ShowroomExperience({products=[],onSelect=()=>{}}){
 const[favs,setFavs]=useState(()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}});
 const[recent,setRecent]=useState(()=>{try{return JSON.parse(localStorage.getItem(RECENT)||"[]")}catch{return[]}});
 const[mode,setMode]=useState("favorites");
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(favs)),[favs]);
 useEffect(()=>localStorage.setItem(RECENT,JSON.stringify(recent.slice(0,8))),[recent]);
 const favorites=useMemo(()=>favs.map(id=>products.find(p=>p.id===id)).filter(Boolean),[favs,products]);
 const viewed=useMemo(()=>recent.map(id=>products.find(p=>p.id===id)).filter(Boolean),[recent,products]);
 const list=mode==="favorites"?favorites:viewed;
 function open(p){setRecent(old=>[p.id,...old.filter(id=>id!==p.id)].slice(0,8));supabase.from("showroom_product_events").insert({product_id:p.id,event_type:"click",session_reference:"web"}).then(()=>{});onSelect(p)}
 function toggle(id){setFavs(old=>old.includes(id)?old.filter(x=>x!==id):[id,...old])}
 return <section className="discovery" aria-label="Koleksi tersimpan">
  <div className="discovery-head"><div><small>YOUR PERSONAL COLLECTION</small><h2>Simpan inspirasi<span>.</span></h2><p>Produk favorit dan koleksi yang terakhir kamu lihat tersimpan di perangkat ini.</p></div>
   <div className="discovery-tabs"><button className={mode==="favorites"?"active":""} onClick={()=>setMode("favorites")}>Favorit ({favorites.length})</button><button className={mode==="recent"?"active":""} onClick={()=>setMode("recent")}>Terakhir dilihat ({viewed.length})</button></div>
  </div>
  {list.length? <div className="discovery-grid">{list.slice(0,4).map(p=><article key={p.id}><button className="discovery-photo" onClick={()=>open(p)}>{imageFor(p)?<img src={imageFor(p)} alt={p.name}/>:<span className="tee">S.</span>}</button><div className="discovery-meta"><div><b>{p.name}</b><small>{money(p.base_price)}</small></div><button aria-label={favs.includes(p.id)?"Hapus dari favorit":"Simpan ke favorit"} onClick={()=>toggle(p.id)}>{favs.includes(p.id)?"♥":"♡"}</button></div><button className="linkbtn" onClick={()=>open(p)}>Lihat produk ↗</button></article>)}</div>:<div className="discovery-empty">{mode==="favorites"?"Belum ada produk favorit. Simpan produk dari katalog untuk menemukannya lagi.":"Produk yang kamu lihat akan muncul di sini."}</div>}
 </section>
}
