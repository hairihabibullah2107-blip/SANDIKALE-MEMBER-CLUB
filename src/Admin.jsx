import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "./supabase.js";

const NAV = ["Ringkasan", "Member", "QR Pendaftaran", "Transaksi", "Scan QR", "Aturan Stamp", "Reward", "Penukaran", "Laporan", "Pengaturan"];
const money = value => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));
const dateText = value => value ? new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function Icon({ name }) {
  const paths = {
    grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,\n    qr:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v2M14 20h2M20 19v2"/></>,
    users:<><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5"/></>,
    receipt:<><path d="M5 3h14v18l-3-2-4 2-4-2-3 2zM8 8h8M8 12h8M8 16h4"/></>,
    gift:<><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8H7.5a2.5 2.5 0 1 1 2.4-3.2L12 8Zm0 0h4.5a2.5 2.5 0 1 0-2.4-3.2L12 8Z"/></>,
    chart:<><path d="M4 19V5M4 19h17M8 15l4-4 3 2 5-7"/></>,
    settings:<><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4-1.4 1.1a8 8 0 0 1 0 2Z"/></>,
    arrow:<path d="M5 12h14m-6-6 6 6-6 6"/>,
    search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    plus:<path d="M12 5v14M5 12h14"/>,
    logout:<><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></>
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.grid}</svg>;
}
function Brand(){return <div className="brand"><span className="brand-mark">S</span><span><b>SANDIKALE</b><small>MEMBER CLUB</small></span></div>}

export default function Admin({ ownerProfile, onOwnerSignOut }) {
  const [active,setActive] = useState("Ringkasan");
  const [query,setQuery] = useState("");
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [members,setMembers] = useState([]);
  const [transactions,setTransactions] = useState([]);
  const [counts,setCounts] = useState({members:0,transactions:0,stamps:0,rewards:0,claims:0});
  const [showAdd,setShowAdd] = useState(false);
  const [form,setForm] = useState({full_name:"",phone:"",email:""});
  const [minimum,setMinimum] = useState("85000");
  const [stampsPerTransaction,setStampsPerTransaction] = useState("1");
  const [rewards,setRewards]=useState([]);
  const [claims,setClaims]=useState([]);
  const [showRewardForm,setShowRewardForm]=useState(false);
  const [rewardForm,setRewardForm]=useState({name:"",description:"",points_cost:"10",stock:""});
  const [showClaimForm,setShowClaimForm]=useState(false);
  const [claimForm,setClaimForm]=useState({member_id:"",reward_id:""});
  const [reportMonth,setReportMonth]=useState(new Date().toISOString().slice(0,7));
  const [qrMember,setQrMember]=useState(null);\n  const [scanToken,setScanToken]=useState("");\n  const [scanMember,setScanMember]=useState(null);\n  const [scanTotal,setScanTotal]=useState("85000");\n  const [scanResult,setScanResult]=useState(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    const results = await Promise.all([
      supabase.from("mc_members").select("id,member_code,public_token,full_name,phone,email,status,total_stamps,total_points,joined_at").order("created_at",{ascending:false}).limit(500),
      supabase.from("mc_transactions").select("id,invoice_number,member_id,total,transaction_date,points_earned").order("transaction_date",{ascending:false}).limit(1000),
      supabase.from("mc_members").select("id",{count:"exact",head:true}),
      supabase.from("mc_transactions").select("id",{count:"exact",head:true}),
      supabase.from("mc_stamps").select("id",{count:"exact",head:true}),
      supabase.from("mc_rewards").select("id",{count:"exact",head:true}),
      supabase.from("mc_reward_claims").select("id",{count:"exact",head:true}),
      supabase.from("mc_rewards").select("id,name,description,points_cost,stock,is_active,created_at").order("created_at",{ascending:false}),
      supabase.from("mc_reward_claims").select("id,member_id,reward_id,points_spent,status,claimed_at,processed_at,notes,mc_members(full_name,member_code),mc_rewards(name)").order("claimed_at",{ascending:false}).limit(500)
    ]);
    const firstError = results.find(r => r.error)?.error;
    if (firstError) setError("Data belum dapat dimuat: " + firstError.message);
    const memberRows = results[0].data || [];
    const transactionRows = results[1].data || [];
    setMembers(memberRows); setTransactions(transactionRows);
    setRewards(results[7].data || []); setClaims(results[8].data || []);
    setCounts({
      members: results[2].count ?? memberRows.length,
      transactions: results[3].count ?? transactionRows.length,
      stamps: results[4].count || 0,
      rewards: results[5].count || 0,
      claims: results[6].count || 0
    });
    const { data: ruleData } = await supabase.from("mc_settings").select("value").eq("key","loyalty_rules").maybeSingle();
    if (ruleData?.value) {
      setMinimum(String(ruleData.value.minimum_transaction ?? 85000));
      setStampsPerTransaction(String(ruleData.value.stamps_per_transaction ?? 1));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const filtered = useMemo(() => members.filter(m => (m.full_name+" "+m.member_code+" "+m.phone).toLowerCase().includes(query.toLowerCase())),[members,query]);
  const memberById = useMemo(() => Object.fromEntries(members.map(m => [m.id,m])),[members]);
  const notify = message => { setNotice(message); window.setTimeout(() => setNotice(""),2800); };

  async function addMember(event) {
    event.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim()) { setError("Nama dan nomor WhatsApp wajib diisi."); return; }
    setSaving(true); setError("");
    const memberCode = "SK-" + Date.now().toString().slice(-8);
    const { error: insertError } = await supabase.from("mc_members").insert({
      member_code:memberCode, full_name:form.full_name.trim(), phone:form.phone.trim(),
      email:form.email.trim() || null, status:"active"
    });
    setSaving(false);
    if (insertError) { setError("Member belum tersimpan: " + insertError.message); return; }
    setForm({full_name:"",phone:"",email:""}); setShowAdd(false);
    notify("Member berhasil ditambahkan ke database.");
    await loadData();
  }

  async function saveReward(event) {
    event.preventDefault(); setSaving(true); setError("");
    const payload={name:rewardForm.name.trim(),description:rewardForm.description.trim()||null,points_cost:Number(rewardForm.points_cost),stock:rewardForm.stock===""?null:Number(rewardForm.stock),is_active:true};
    const {error:e}=await supabase.from("mc_rewards").insert(payload); setSaving(false);
    if(e){setError("Reward gagal disimpan: "+e.message);return;}
    setRewardForm({name:"",description:"",points_cost:"10",stock:""});setShowRewardForm(false);notify("Reward ditambahkan.");await loadData();
  }
  async function toggleReward(r) {
    const {error:e}=await supabase.from("mc_rewards").update({is_active:!r.is_active,updated_at:new Date().toISOString()}).eq("id",r.id);
    if(e){setError(e.message);return;} notify("Status reward diperbarui.");await loadData();
  }
  async function createClaim(event) {
    event.preventDefault();setSaving(true);setError("");
    const r=rewards.find(x=>x.id===claimForm.reward_id),m=members.find(x=>x.id===claimForm.member_id);
    if(!r||!m){setSaving(false);setError("Pilih member dan reward.");return;}
    if(Number(m.total_points||0)<r.points_cost){setSaving(false);setError("Poin member tidak mencukupi.");return;}
    if(r.stock!==null&&r.stock<1){setSaving(false);setError("Stok reward habis.");return;}
    const {error:e}=await supabase.from("mc_reward_claims").insert({member_id:m.id,reward_id:r.id,points_spent:r.points_cost,status:"pending"});
    setSaving(false);if(e){setError(e.message);return;}
    setShowClaimForm(false);setClaimForm({member_id:"",reward_id:""});notify("Penukaran dicatat.");await loadData();
  }
  async function processClaim(cl,status) {
    setSaving(true);setError("");
    const {error:e}=await supabase.rpc("mc_process_reward_claim",{p_claim_id:cl.id,p_status:status});
    setSaving(false);if(e){setError("Proses penukaran gagal: "+e.message);return;}
    notify(status==="fulfilled"?"Reward diserahkan; poin dipotong.":status==="approved"?"Penukaran disetujui.":"Penukaran dibatalkan.");await loadData();
  }
  function memberShareUrl(m){return window.location.origin+"/member?token="+encodeURIComponent(m.public_token);}
  async function shareMember(m){setQrMember(m);const url=memberShareUrl(m);try{await navigator.clipboard.writeText(url);notify("Link QR disalin. QR siap dibagikan.");}catch{notify("QR member siap ditampilkan.");}}


  async function handleScannedValue(raw) {
    let token=String(raw||"").trim();
    try { const parsed=new URL(token); token=parsed.searchParams.get("token")||token; } catch {}
    if(!token) { setError("QR tidak berisi token member yang valid."); return; }
    setScanToken(token);setScanMember(null);setScanResult(null);setError("");
    const {data,error:e}=await supabase.rpc("mc_get_public_member_card",{p_token:token});
    if(e||!data?.length){setError(e?.message||"QR member tidak valid atau tidak aktif.");return;}
    setScanMember(data[0]);setError("");
  }
  async function submitScannedTransaction(event) {
    event.preventDefault();if(!scanToken||!scanMember)return;
    setSaving(true);setError("");setScanResult(null);
    const {data,error:e}=await supabase.rpc("mc_record_scan_transaction",{
      p_token:scanToken,p_total:Number(scanTotal),p_invoice_number:null,p_notes:"Dicatat melalui Scan QR Member"
    });
    setSaving(false);
    if(e){setError("Transaksi gagal dicatat: "+e.message);return;}
    setScanResult(data);setScanMember(null);setScanToken("");await loadData();
  }

  async function saveRules(event) {
    event.preventDefault(); setSaving(true); setError("");
    const value = { minimum_transaction:Number(minimum), stamps_per_transaction:Number(stampsPerTransaction) };
    const { error: saveError } = await supabase.from("mc_settings").upsert({key:"loyalty_rules",value,updated_by:ownerProfile?.id || null,updated_at:new Date().toISOString()},{onConflict:"key"});
    setSaving(false);
    if (saveError) { setError("Aturan belum tersimpan: " + saveError.message); return; }
    notify("Aturan stamp tersimpan.");
  }

  const navIcons = ["grid","users","qr","receipt","qr","chart","gift","receipt","chart","settings"];
  return <div className="admin-shell">
    <aside className="admin-sidebar"><Brand/><div className="admin-workspace"><span className="admin-eyebrow">WORKSPACE</span><b>SANDIKALE Store</b><small>Member Club Management</small></div><span className="admin-eyebrow admin-menu-label">MENU UTAMA</span>{NAV.map((n,i)=><button key={n} className={active===n?"admin-nav active":"admin-nav"} onClick={()=>setActive(n)}><Icon name={navIcons[i]}/>{n}{active===n&&<i/>}</button>)}<div className="admin-sidebar-bottom"><span className="admin-live-dot"/> Terhubung ke database <small>SUPABASE • LIVE DATA</small></div></aside>
    <main className="admin-main">
      <header className="admin-topbar"><div><span className="admin-eyebrow">SANDIKALE / ADMIN</span><b>{active}</b></div><div className="admin-user"><span className="admin-avatar">{(ownerProfile?.full_name || "Owner").slice(0,2).toUpperCase()}</span><span><b>{ownerProfile?.full_name || "Owner"}</b><small>{ownerProfile?.role === "owner" ? "Owner" : "Administrator"}</small></span><button className="admin-logout" onClick={onOwnerSignOut} title="Keluar"><Icon name="logout"/></button></div></header>
      <div className="admin-content">
        <div className="admin-title-row"><div><span className="admin-eyebrow">SANDIKALE MEMBER CLUB</span><h1>{active==="Ringkasan"?"Ringkasan dashboard":active}</h1><p>Kelola program loyalti dan hubungan pelanggan SANDIKALE.</p></div><span className="admin-demo-pill admin-live-pill">DATA DATABASE</span></div>
        {error && <div className="admin-error" role="alert">{error}</div>}
        {active==="Ringkasan" && <>
          <div className="admin-stat-grid"><article><span>Total Member</span><b>{counts.members.toLocaleString("id-ID")}</b><small>Data member tersimpan</small></article><article><span>Stamp Diberikan</span><b>{counts.stamps.toLocaleString("id-ID")}</b><small>Akumulasi stamp</small></article><article><span>Transaksi Tercatat</span><b>{counts.transactions.toLocaleString("id-ID")}</b><small>Riwayat transaksi</small></article><article><span>Reward Tersedia</span><b>{counts.rewards.toLocaleString("id-ID")}</b><small>{counts.claims} permintaan penukaran</small></article></div>
          <section className="admin-panel admin-table-panel"><div className="admin-panel-head"><div><span className="admin-eyebrow">LATEST ACTIVITY</span><h2>Transaksi terbaru</h2></div><button className="admin-text-button" onClick={()=>setActive("Transaksi")}>Lihat semua <Icon name="arrow"/></button></div><TransactionTable transactions={transactions.slice(0,8)} memberById={memberById} loading={loading}/></section>
          <section className="admin-panel admin-table-panel"><div className="admin-panel-head"><div><span className="admin-eyebrow">MEMBER OVERVIEW</span><h2>Member terbaru</h2></div><button className="admin-text-button" onClick={()=>setActive("Member")}>Kelola member <Icon name="arrow"/></button></div><MemberTable members={members.slice(0,5)} loading={loading} onShare={shareMember}/></section>
        </>}
        {active==="Member" && <section className="admin-panel admin-table-panel"><div className="admin-panel-head"><div><span className="admin-eyebrow">CUSTOMER DATABASE</span><h2>Daftar member ({members.length})</h2></div><button className="admin-primary" onClick={()=>setShowAdd(v=>!v)}><Icon name="plus"/>{showAdd?"Tutup form":"Tambah member"}</button></div>
          {showAdd && <form className="admin-add-form" onSubmit={addMember}><label>Nama lengkap<input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder="Nama pelanggan" required/></label><label>Nomor WhatsApp<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="08xxxxxxxxxx" required/></label><label>Email (opsional)<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@contoh.com"/></label><button className="admin-primary" disabled={saving}>{saving?"Menyimpan…":"Simpan member"}</button></form>}
          <div className="admin-search"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari nama, ID, atau nomor WhatsApp…"/></div><MemberTable members={filtered} loading={loading} onShare={shareMember}/><p className="admin-footnote">Data dibaca langsung dari database Member Club. ID member dibuat otomatis saat pendaftaran.</p></section>}
        {active==="Transaksi" && <section className="admin-panel admin-table-panel"><div className="admin-panel-head"><div><span className="admin-eyebrow">TRANSACTION RECORDS</span><h2>Riwayat transaksi ({transactions.length})</h2></div></div><TransactionTable transactions={transactions} memberById={memberById} loading={loading}/><p className="admin-footnote">Transaksi akan muncul setelah dicatat oleh sistem kasir atau staf yang memiliki akses.</p></section>}

        {active==="QR Pendaftaran" && <section className="admin-panel admin-form-panel"><span className="admin-eyebrow">PUBLIC MEMBER REGISTRATION</span><h2>QR pendaftaran SANDIKALE</h2><p>QR ini berlaku untuk semua pelanggan. Cetak dan pasang di meja kasir atau area toko agar pelanggan dapat mendaftar sendiri.</p><div style={{maxWidth:320,margin:"24px auto",padding:24,border:"1px solid #e8e7e1",textAlign:"center",background:"#fff"}}><div style={{fontWeight:800,letterSpacing:2}}>SANDIKALE</div><div style={{fontSize:11,color:"#777",margin:"8px 0 16px"}}>SCAN • REGISTER • COLLECT STAMPS</div><img alt="QR pendaftaran member" style={{width:"100%",maxWidth:240}} src={"https://api.qrserver.com/v1/create-qr-code/?size=320x320&data="+encodeURIComponent(window.location.origin+"/?register=1")}/><b style={{display:"block",marginTop:12}}>DAFTAR MEMBER GRATIS</b></div><p className="admin-footnote" style={{textAlign:"center"}}>{window.location.origin+"/?register=1"}</p><div className="admin-report-actions"><button className="admin-primary" onClick={()=>window.print()}>Cetak QR Pendaftaran</button><button className="admin-small-button" onClick={()=>navigator.clipboard?.writeText(window.location.origin+"/?register=1").then(()=>notify("Link pendaftaran disalin."))}>Salin link pendaftaran</button></div></section>}
        {active==="Scan QR" && <section className="admin-panel admin-form-panel"><span className="admin-eyebrow">CASHIER SCANNER</span><h2>Scan QR Member</h2><p>Scan QR kartu anggota pelanggan. Setelah identitas ditemukan, masukkan total transaksi untuk mencatat stamp otomatis.</p><ScannerCamera active={active==="Scan QR"&&!scanMember&&!scanResult} onDetected={handleScannedValue}/><label>Atau masukkan link / token QR<input value={scanToken} onChange={e=>setScanToken(e.target.value)} placeholder="Tempel link kartu member atau token QR"/></label><button className="admin-primary" type="button" disabled={!scanToken} onClick={()=>handleScannedValue(scanToken)}>Periksa member</button>
          {scanMember&&<form onSubmit={submitScannedTransaction} style={{marginTop:22,padding:18,background:"#f6f5f1",display:"grid",gap:12}}><div><span className="admin-eyebrow">MEMBER TERVERIFIKASI</span><h3 style={{margin:"6px 0"}}>{scanMember.full_name}</h3><b>{scanMember.member_code}</b><p className="admin-footnote">Saldo saat ini: {scanMember.total_stamps} stamp • {scanMember.total_points} poin</p></div><label>Total transaksi (Rupiah)<input type="number" min="0" step="1000" required value={scanTotal} onChange={e=>setScanTotal(e.target.value)}/></label><button className="admin-primary" disabled={saving}>{saving?"Mencatat transaksi…":"Simpan transaksi & stamp"}</button></form>}
          {scanResult&&<div className="admin-panel" style={{marginTop:18,borderColor:"#9aa88b"}}><span className="admin-eyebrow">TRANSAKSI BERHASIL</span><h3>{scanResult.full_name}</h3><p>Invoice: {scanResult.invoice_number}</p><p>Stamp ditambahkan: <b>+{scanResult.stamps_added}</b></p><p>Poin ditambahkan: <b>+{scanResult.points_added}</b></p><p>Total stamp sekarang: <b>{scanResult.new_total_stamps}</b></p><button className="admin-primary" onClick={()=>setScanResult(null)}>Scan member berikutnya</button></div>}
        </section>}
        {active==="Aturan Stamp" && <section className="admin-panel admin-form-panel"><span className="admin-eyebrow">LOYALTY CONFIGURATION</span><h2>Aturan pemberian stamp</h2><form onSubmit={saveRules}><label>Minimum transaksi (Rupiah)<input type="number" min="0" value={minimum} onChange={e=>setMinimum(e.target.value)} required/></label><label>Stamp per transaksi<input type="number" min="1" max="100" value={stampsPerTransaction} onChange={e=>setStampsPerTransaction(e.target.value)} required/></label><button className="admin-primary" disabled={saving}>{saving?"Menyimpan…":"Simpan aturan"} <Icon name="arrow"/></button></form><p className="admin-footnote">Aturan ini langsung digunakan saat kasir mencatat transaksi melalui menu Scan QR. Stamp diberikan otomatis jika total transaksi memenuhi minimum.</p></section>}
        {active==="Reward" && <section className="admin-panel admin-table-panel"><div className="admin-panel-head"><div><span className="admin-eyebrow">REWARD CATALOG</span><h2>Daftar reward ({rewards.length})</h2></div><button className="admin-primary" onClick={()=>setShowRewardForm(v=>!v)}><Icon name="plus"/>Tambah reward</button></div>
          {showRewardForm&&<form className="admin-add-form" onSubmit={saveReward}><label>Nama reward<input required value={rewardForm.name} onChange={e=>setRewardForm({...rewardForm,name:e.target.value})}/></label><label>Biaya poin<input type="number" min="0" required value={rewardForm.points_cost} onChange={e=>setRewardForm({...rewardForm,points_cost:e.target.value})}/></label><label>Stok (kosong = tanpa batas)<input type="number" min="0" value={rewardForm.stock} onChange={e=>setRewardForm({...rewardForm,stock:e.target.value})}/></label><label className="admin-wide-field">Deskripsi<input value={rewardForm.description} onChange={e=>setRewardForm({...rewardForm,description:e.target.value})}/></label><button className="admin-primary" disabled={saving}>{saving?"Menyimpan…":"Simpan reward"}</button></form>}
          {!rewards.length&&!loading?<p className="admin-empty">Belum ada reward. Tambahkan hadiah pertama untuk member.</p>:<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>REWARD</th><th>POIN</th><th>STOK</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>{rewards.map(r=><tr key={r.id}><td><b>{r.name}</b><small>{r.description||"—"}</small></td><td>{r.points_cost}</td><td>{r.stock===null?"∞":r.stock}</td><td><span className={r.is_active?"admin-status":"admin-pending"}>{r.is_active?"Aktif":"Nonaktif"}</span></td><td><button className="admin-small-button" onClick={()=>toggleReward(r)}>{r.is_active?"Nonaktifkan":"Aktifkan"}</button></td></tr>)}</tbody></table></div>}
        </section>}
        {active==="Penukaran" && <section className="admin-panel admin-table-panel"><div className="admin-panel-head"><div><span className="admin-eyebrow">REDEMPTION MANAGEMENT</span><h2>Permintaan penukaran ({claims.length})</h2></div><button className="admin-primary" onClick={()=>setShowClaimForm(v=>!v)}><Icon name="plus"/>Catat penukaran</button></div>
          {showClaimForm&&<form className="admin-add-form" onSubmit={createClaim}><label>Member<select required value={claimForm.member_id} onChange={e=>setClaimForm({...claimForm,member_id:e.target.value})}><option value="">Pilih member</option>{members.map(m=><option key={m.id} value={m.id}>{m.full_name} — {m.member_code} ({m.total_points} poin)</option>)}</select></label><label>Reward<select required value={claimForm.reward_id} onChange={e=>setClaimForm({...claimForm,reward_id:e.target.value})}><option value="">Pilih reward</option>{rewards.filter(r=>r.is_active).map(r=><option key={r.id} value={r.id}>{r.name} — {r.points_cost} poin</option>)}</select></label><button className="admin-primary" disabled={saving}>{saving?"Menyimpan…":"Buat permintaan"}</button></form>}
          {!claims.length&&!loading?<p className="admin-empty">Belum ada permintaan penukaran.</p>:<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>MEMBER</th><th>REWARD</th><th>POIN</th><th>TANGGAL</th><th>STATUS / AKSI</th></tr></thead><tbody>{claims.map(cl=><tr key={cl.id}><td><b>{cl.mc_members?.full_name||"Member"}</b><small>{cl.mc_members?.member_code||"—"}</small></td><td>{cl.mc_rewards?.name||"Reward"}</td><td>{cl.points_spent}</td><td>{dateText(cl.claimed_at)}</td><td><span className={cl.status==="fulfilled"?"admin-status":cl.status==="cancelled"?"admin-pending":"admin-review"}>{cl.status==="pending"?"Menunggu":cl.status==="approved"?"Disetujui":cl.status==="fulfilled"?"Selesai":"Dibatalkan"}</span><div className="admin-action-row">{cl.status==="pending"&&<button className="admin-small-button" disabled={saving} onClick={()=>processClaim(cl,"approved")}>Setujui</button>}{["pending","approved"].includes(cl.status)&&<button className="admin-small-button" disabled={saving} onClick={()=>processClaim(cl,"fulfilled")}>Serahkan</button>}{["pending","approved"].includes(cl.status)&&<button className="admin-small-button danger" disabled={saving} onClick={()=>processClaim(cl,"cancelled")}>Batalkan</button>}</div></td></tr>)}</tbody></table></div>}
        </section>}
        {active==="Laporan" && <section className="admin-panel admin-table-panel"><div className="admin-panel-head"><div><span className="admin-eyebrow">BUSINESS REPORT</span><h2>Laporan aktivitas</h2></div><label className="admin-month-filter">Periode<input type="month" value={reportMonth} onChange={e=>setReportMonth(e.target.value)}/></label></div><ReportSummary transactions={transactions} members={members} claims={claims} month={reportMonth}/><div className="admin-report-actions"><button className="admin-primary" onClick={()=>window.print()}>Cetak / Simpan PDF</button><button className="admin-small-button" onClick={()=>{const rows=[["Invoice","Tanggal","Member","Total","Poin"],...transactions.filter(t=>(t.transaction_date||"").slice(0,7)===reportMonth).map(t=>[t.invoice_number,t.transaction_date,memberById[t.member_id]?.full_name||"Non-member",t.total,t.points_earned])];const csv=rows.map(row=>row.map(v=>'"'+String(v??"").replaceAll('"','""')+'"').join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));a.download="laporan-sandikale-"+reportMonth+".csv";a.click();URL.revokeObjectURL(a.href);}}>Unduh CSV transaksi</button></div></section>}
        {active==="Pengaturan" && <section className="admin-panel admin-placeholder"><span className="admin-eyebrow">WORKSPACE SETTINGS</span><h2>Pengaturan Member Club</h2><p>Pengaturan dasar loyalti saat ini berada pada menu Aturan Stamp. Pengaturan staf dan hak akses akan diaktifkan pada tahap berikutnya.</p><button className="admin-primary" onClick={()=>setActive("Aturan Stamp")}>Buka Aturan Stamp <Icon name="arrow"/></button></section>}
      </div>
      <footer className="admin-footer"><Brand/><span>© 2026 SANDIKALE MEMBER CLUB</span><span>OWNER WORKSPACE • LIVE DATABASE</span></footer>
    </main>
    {qrMember&&<div className="admin-modal-backdrop" onClick={()=>setQrMember(null)}><div className="admin-qr-modal" onClick={e=>e.stopPropagation()}><button className="admin-modal-close" onClick={()=>setQrMember(null)}>×</button><span className="admin-eyebrow">SHARE MEMBER QR</span><h2>{qrMember.full_name}</h2><img alt="QR member" src={"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data="+encodeURIComponent(memberShareUrl(qrMember))}/><p>{qrMember.member_code}</p><button className="admin-primary" onClick={()=>shareMember(qrMember)}>Salin link member</button></div></div>}
    {notice&&<div className="admin-toast">{notice}</div>}
  </div>;
}

function ReportSummary({transactions,members,claims,month}) {
  const rows=transactions.filter(t=>(t.transaction_date||"").slice(0,7)===month);
  const revenue=rows.reduce((sum,t)=>sum+Number(t.total||0),0);
  const points=rows.reduce((sum,t)=>sum+Number(t.points_earned||0),0);
  const completed=claims.filter(cl=>cl.status==="fulfilled"&&(cl.processed_at||cl.claimed_at).slice(0,7)===month).length;
  return <div className="admin-stat-grid admin-report-grid"><article><span>Omzet tercatat</span><b>{money(revenue)}</b><small>{rows.length} transaksi dalam data termuat</small></article><article><span>Total member</span><b>{members.length}</b><small>Data member termuat</small></article><article><span>Poin diberikan</span><b>{points}</b><small>Dari transaksi periode ini</small></article><article><span>Reward diserahkan</span><b>{completed}</b><small>Penukaran selesai</small></article></div>;
}
function MemberTable({members,loading,onShare}) {
  if (loading) return <p className="admin-empty">Memuat data member…</p>;
  if (!members.length) return <p className="admin-empty">Belum ada member tersimpan. Gunakan tombol “Tambah member” untuk membuat data pertama.</p>;
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>MEMBER</th><th>NOMOR WHATSAPP</th><th>STAMP</th><th>STATUS</th><th>TERDAFTAR</th><th>QR MEMBER</th></tr></thead><tbody>{members.map(m=><tr key={m.id}><td><b>{m.full_name}</b><small>{m.member_code}</small></td><td>{m.phone}</td><td><b>{m.total_stamps}</b></td><td><span className={m.status==="active"?"admin-status":"admin-pending"}>{m.status==="active"?"Aktif":m.status}</span></td><td>{dateText(m.joined_at)}</td><td><button className="admin-small-button" onClick={()=>onShare?.(m)}>Bagikan QR</button></td></tr>)}</tbody></table></div>;
}
function TransactionTable({transactions,memberById,loading}) {
  if (loading) return <p className="admin-empty">Memuat transaksi…</p>;
  if (!transactions.length) return <p className="admin-empty">Belum ada transaksi. Data transaksi akan tampil setelah dicatat melalui sistem.</p>;
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>INVOICE</th><th>MEMBER</th><th>NILAI</th><th>POIN</th><th>TANGGAL</th></tr></thead><tbody>{transactions.map(t=><tr key={t.id}><td><b>{t.invoice_number}</b></td><td>{memberById[t.member_id]?.full_name || "Non-member"}</td><td>{money(t.total)}</td><td>{t.points_earned}</td><td>{dateText(t.transaction_date)}</td></tr>)}</tbody></table></div>;
}

function ScannerCamera({active,onDetected}) {
  const videoRef=useRef(null);
  const [cameraError,setCameraError]=useState("");
  useEffect(()=>{
    if(!active)return;
    let stream=null,frame=0,stopped=false,locked=false;
    async function start(){
      try{
        if(!navigator.mediaDevices?.getUserMedia)throw new Error("Kamera memerlukan koneksi HTTPS dan izin browser.");
        if(!("BarcodeDetector" in window))throw new Error("Pemindai otomatis belum didukung browser ini. Gunakan kolom input token di bawah.");
        const detector=new window.BarcodeDetector({formats:["qr_code"]});
        stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
        if(stopped){stream.getTracks().forEach(t=>t.stop());return;}
        const video=videoRef.current;video.srcObject=stream;await video.play();
        const scan=async()=>{
          if(stopped||locked)return;
          try{const codes=await detector.detect(video);if(codes.length&&codes[0].rawValue){locked=true;onDetected(codes[0].rawValue);return;}}catch{}
          frame=requestAnimationFrame(scan);
        };
        scan();
      }catch(e){setCameraError(e.message||"Kamera tidak dapat dibuka.");}
    }
    start();
    return()=>{stopped=true;cancelAnimationFrame(frame);if(stream)stream.getTracks().forEach(t=>t.stop());};
  },[active,onDetected]);
  return <div style={{margin:"18px 0"}}><video ref={videoRef} muted playsInline style={{width:"100%",maxWidth:420,minHeight:180,background:"#171717",objectFit:"cover",borderRadius:4}}/><p className="admin-footnote">{cameraError||"Arahkan kamera belakang ke QR kartu member. Izinkan akses kamera jika diminta."}</p></div>;
}
