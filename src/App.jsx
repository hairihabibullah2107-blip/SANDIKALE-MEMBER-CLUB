import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase.js";

const initialHistory = [
  { id: "TRX-1024", date: "08 Nov 2026", detail: "Custom Kaos • 1 pcs", stamp: "+1 stamp", status: "Terverifikasi" },
  { id: "TRX-1018", date: "02 Nov 2026", detail: "DTF A4 • 2 lembar", stamp: "+1 stamp", status: "Terverifikasi" },
  { id: "TRX-1009", date: "27 Okt 2026", detail: "Custom Kaos • 2 pcs", stamp: "+1 stamp", status: "Terverifikasi" }
];

const rewards = [
  { id: "logo", name: "Gratis DTF Logo", detail: "Gratis cetak DTF ukuran logo untuk pesanan berikutnya.", target: 6, type: "Hadiah member", mark: "01" },
  { id: "discount", name: "Diskon Custom Kaos", detail: "Potongan harga untuk satu pesanan custom kaos.", target: 10, type: "Voucher diskon", mark: "02" },
  { id: "voucher", name: "Voucher Member", detail: "Voucher spesial untuk transaksi pilihan.", target: 15, type: "Exclusive reward", mark: "03" }
];

function Icon({ name }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    gift: <><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13M3 12h18M12 8H7.5a2.5 2.5 0 1 1 2.4-3.2L12 8Zm0 0h4.5a2.5 2.5 0 1 0-2.4-3.2L12 8Z" /></>,
    history: <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    qr: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v2M14 20h2M20 19v2M18 17h3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Brand({ compact = false }) {
  return <div className={`brand ${compact ? "brand-compact" : ""}`}><span className="brand-mark"><svg className="brand-emblem" viewBox="0 0 1365 2048" aria-hidden="true" role="img"><path d="M465,0 L342,124 L558,341 L341,558 L124,342 L0,465 L558,1023 L404,1179 L527,1302 L682,1147 L900,1365 L682,1582 L341,1241 L0,1582 L124,1705 L341,1489 L558,1706 L342,1924 L465,2047 L682,1830 L899,2047 L1023,1923 L806,1706 L1023,1489 L1240,1705 L1364,1582 L806,1024 L961,868 L837,745 L682,900 L465,682 L683,465 L1024,805 L1364,465 L1240,342 L1023,558 L806,341 L1023,124 L899,0 L682,217 Z" fill="currentColor"/></svg></span><span className="brand-wordmark"><b>SANDIKALE</b><small>MEMBER CLUB</small></span></div>;
}

function MemberCard({ stamps, onShowQr }) {
  return (
    <section className="member-card">
      <div className="card-glow" />
      <div className="member-card-top"><Brand compact /><span className="member-chip">MEMBER</span></div>
      <div className="card-middle"><span className="eyebrow light">DIGITAL MEMBERSHIP CARD</span><h2>Belanja lebih dekat.<br />Reward lebih berarti.</h2></div>
      <div className="member-card-bottom">
        <div><span className="eyebrow light">MEMBER NAME</span><strong>Ko Abee</strong><span className="member-number">SK-000001</span></div>
        <button className="qr-button" onClick={onShowQr} aria-label="Tampilkan QR member"><Icon name="qr" /></button>
      </div>
      <div className="card-watermark">SK</div>
    </section>
  );
}

function StampPanel({ stamps, target }) {
  return (
    <section className="panel stamp-panel">
      <div className="section-heading"><div><span className="eyebrow">YOUR COLLECTION</span><h3>Koleksi stamp</h3></div><span className="stamp-count">{stamps}<i> / {target}</i></span></div>
      <p className="muted small-copy">Setiap transaksi valid membawa kamu lebih dekat ke reward berikutnya.</p>
      <div className="stamp-grid" aria-label={`${stamps} dari ${target} stamp terkumpul`}>
        {Array.from({ length: target }, (_, index) => <div className={`stamp-slot ${index < stamps ? "earned" : ""}`} key={index}>{index < stamps ? <span> S </span> : <small>{String(index + 1).padStart(2, "0")}</small>}</div>)}
      </div>
      <div className="progress-meta"><span>Progress reward</span><strong>{Math.round(stamps / target * 100)}%</strong></div>
      <div className="progress-track"><span style={{ width: `${Math.min(100, stamps / target * 100)}%` }} /></div>
      <div className="next-reward"><span className="reward-icon"><Icon name="gift" /></span><div><b>{stamps >= target ? "Reward berhasil dibuka" : `${target - stamps} stamp lagi menuju reward`}</b><small>Gratis DTF Logo</small></div><span className="next-arrow"><Icon name="chevron" /></span></div>
    </section>
  );
}

function RewardCard({ reward, stamps, onClaim }) {
  const unlocked = stamps >= reward.target;
  return <article className={`reward-card ${unlocked ? "unlocked" : ""}`}><div className="reward-card-top"><span className="reward-index">{reward.mark}</span><span className={`reward-state ${unlocked ? "ready" : ""}`}>{unlocked ? "TERBUKA" : `${reward.target} STAMP`}</span></div><div className="reward-art"><Icon name="gift" /></div><span className="eyebrow">{reward.type}</span><h3>{reward.name}</h3><p>{reward.detail}</p><button className={unlocked ? "button-dark" : "button-outline"} disabled={!unlocked} onClick={() => onClaim(reward)}>{unlocked ? "Klaim reward" : "Belum tersedia"} <Icon name="arrow" /></button></article>;
}

function Modal({ title, children, onClose }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={e => e.stopPropagation()}><div className="modal-head"><h3>{title}</h3><button className="icon-button" onClick={onClose} aria-label="Tutup"><Icon name="close" /></button></div>{children}</div></div>;
}

function PublicMemberCard({token}) {
  const [dashboard,setDashboard]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [claiming,setClaiming]=useState("");
  const memberUrl=window.location.origin+import.meta.env.BASE_URL+"?token="+encodeURIComponent(token);
  const loadDashboard=async()=>{
    setLoading(true);setError("");
    const {data,error:rpcError}=await supabase.rpc("mc_get_member_dashboard",{p_token:token});
    if(rpcError){setError(rpcError.message||"Dashboard member belum dapat dimuat.");setDashboard(null);}
    else setDashboard(data);
    setLoading(false);
  };
  useEffect(()=>{loadDashboard();},[token]);
  async function claim(reward){
    if(!window.confirm("Ajukan penukaran "+reward.name+"? Permintaan akan menunggu verifikasi kasir SANDIKALE."))return;
    setClaiming(reward.id);setNotice("");setError("");
    const {error:claimError}=await supabase.rpc("mc_member_claim_reward",{p_token:token,p_reward_id:reward.id});
    setClaiming("");
    if(claimError){setError(claimError.message||"Permintaan reward gagal dikirim.");return;}
    setNotice("Permintaan reward berhasil dikirim. Tunggu verifikasi dari SANDIKALE.");
    await loadDashboard();
  }
  const fmtDate=value=>value?new Date(value).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}):"—";
  const fmtMoney=value=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(value||0));
  const statusLabel=value=>({pending:"Menunggu",approved:"Disetujui",fulfilled:"Selesai",cancelled:"Dibatalkan"}[value]||value);
  const panel={background:"#fff",border:"1px solid #e7e6df",padding:20,marginTop:16};
  const metric={background:"#292929",padding:18,flex:1,minWidth:110};
  return <main className="public-member-page"><div style={{width:"100%",maxWidth:760,margin:"0 auto",padding:"24px 14px 48px",fontFamily:"'DM Sans',sans-serif"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}><Brand/><span style={{fontSize:10,letterSpacing:2,color:"#777"}}>MEMBER DASHBOARD</span></div>
    {loading?<section style={panel}><p>Memuat dashboard member…</p></section>:error&&!dashboard?<section style={panel}><h2>Dashboard belum dapat dibuka</h2><p>{error}</p><button onClick={loadDashboard}>Coba lagi</button></section>:dashboard&&<>
      <section style={{...panel,background:"#191919",color:"#fff",padding:24,marginTop:24}}>
        <span style={{fontSize:10,letterSpacing:2,color:"#aaa"}}>SANDIKALE DIGITAL MEMBER CARD</span>
        <h1 style={{fontSize:28,margin:"12px 0 4px"}}>{dashboard.member.full_name}</h1>
        <b style={{color:"#ddd"}}>{dashboard.member.member_code}</b>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:22}}>
          <div style={metric}><b style={{fontSize:30}}>{dashboard.member.total_stamps}</b><small style={{display:"block",color:"#bbb"}}>TOTAL STAMP</small></div>
          <div style={metric}><b style={{fontSize:30}}>{dashboard.member.total_points}</b><small style={{display:"block",color:"#bbb"}}>TOTAL POIN</small></div>
          <div style={metric}><b style={{fontSize:30}}>{dashboard.available_points}</b><small style={{display:"block",color:"#bbb"}}>POIN TERSEDIA</small></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:18,marginTop:20,flexWrap:"wrap"}}>
          <img alt="QR member SANDIKALE" style={{width:132,height:132,background:"#fff",padding:7}} src={"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data="+encodeURIComponent(memberUrl)}/>
          <div style={{fontSize:12,color:"#ccc",lineHeight:1.7,maxWidth:300}}>Tunjukkan QR ini kepada kasir setiap kali bertransaksi agar stamp dan poin kamu tercatat otomatis.<br/>Bergabung sejak {fmtDate(dashboard.member.joined_at)}.</div>
        </div>
      </section>
      {error&&<p role="alert" style={{...panel,color:"#9b2525",marginTop:12}}>{error}</p>}
      {notice&&<p role="status" style={{...panel,color:"#23633b",marginTop:12}}>{notice}</p>}
      <section style={panel}><h2 style={{marginTop:0}}>Reward tersedia</h2><p style={{fontSize:13,color:"#777"}}>Gunakan poin tersedia untuk mengajukan penukaran. Kasir akan memproses permintaan kamu.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}>
          {(dashboard.rewards||[]).map(reward=><article key={reward.id} style={{border:"1px solid #e8e7e1",padding:16,display:"flex",flexDirection:"column",gap:8}}>
            <b>{reward.name}</b><span style={{fontSize:12,color:"#777"}}>{reward.description||"Reward khusus member SANDIKALE"}</span>
            <strong>{reward.points_cost} poin</strong><small style={{color:"#777"}}>Stok: {reward.stock===null?"Tersedia":reward.stock}</small>
            <button disabled={claiming===reward.id||dashboard.available_points<reward.points_cost||(reward.stock!==null&&reward.stock<1)} onClick={()=>claim(reward)} style={{marginTop:"auto",padding:12,background:"#191919",color:"#fff",border:0,opacity:(dashboard.available_points<reward.points_cost||(reward.stock!==null&&reward.stock<1))?0.45:1}}>
              {claiming===reward.id?"Mengirim…":dashboard.available_points<reward.points_cost?"Poin belum cukup":reward.stock===0?"Stok habis":"Ajukan reward"}
            </button>
          </article>)}
          {!dashboard.rewards?.length&&<p>Belum ada reward aktif.</p>}
        </div>
      </section>
      <section style={panel}><h2 style={{marginTop:0}}>Riwayat transaksi</h2>{dashboard.transactions?.length?dashboard.transactions.map((item,index)=><div key={item.invoice_number||index} style={{display:"flex",justifyContent:"space-between",gap:12,padding:"12px 0",borderBottom:"1px solid #eee",fontSize:13}}><div><b>{item.invoice_number}</b><div style={{color:"#777"}}>{fmtDate(item.transaction_date)}</div></div><div style={{textAlign:"right"}}><b>{fmtMoney(item.total)}</b><div style={{color:"#47724c"}}>+{item.points_earned} poin</div></div></div>):<p style={{color:"#777"}}>Belum ada transaksi tercatat.</p>}</section>
      <section style={panel}><h2 style={{marginTop:0}}>Status penukaran reward</h2>{dashboard.claims?.length?dashboard.claims.map(item=><div key={item.id} style={{display:"flex",justifyContent:"space-between",gap:12,padding:"10px 0",borderBottom:"1px solid #eee",fontSize:13}}><div><b>{item.reward_name}</b><div style={{color:"#777"}}>{fmtDate(item.claimed_at)} • {item.points_spent} poin</div></div><strong>{statusLabel(item.status)}</strong></div>):<p style={{color:"#777"}}>Belum ada permintaan penukaran.</p>}</section>
      <p style={{textAlign:"center",fontSize:11,color:"#888",marginTop:24}}>SANDIKALE • MEMBER CLUB</p>
    </>}
  </div></main>;
}


function RegistrationPage() {
  const [form,setForm]=useState({full_name:"",phone:"",email:""});
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [member,setMember]=useState(null);
  const [copied,setCopied]=useState(false);
  const memberUrl=member ? window.location.origin+import.meta.env.BASE_URL+"?token="+encodeURIComponent(member.public_token) : "";
  async function submit(e){
    e.preventDefault();setSaving(true);setError("");
    const {data,error:rpcError}=await supabase.rpc("mc_register_member",{
      p_full_name:form.full_name.trim(),p_phone:form.phone.trim(),p_email:form.email.trim()||null
    });
    setSaving(false);
    if(rpcError){setError(rpcError.message||"Pendaftaran belum berhasil.");return;}
    if(!data?.public_token){setError("Pendaftaran berhasil diproses, tetapi tautan dashboard tidak tersedia. Hubungi SANDIKALE.");return;}
    window.location.replace(window.location.origin+import.meta.env.BASE_URL+"?token="+encodeURIComponent(data.public_token));
  }
  async function copyLink(){
    try{await navigator.clipboard.writeText(memberUrl);setCopied(true);}catch{setError("Browser tidak mengizinkan salin otomatis. Salin tautan secara manual.");}
  }
  const field={width:"100%",padding:"13px 14px",border:"1px solid #deded7",borderRadius:3,fontSize:14,background:"#fff"};
  return <main style={{minHeight:"100vh",background:"#f4f3ef",padding:"32px 18px",display:"grid",placeItems:"center",fontFamily:"'DM Sans',sans-serif"}}>
    <section style={{width:"100%",maxWidth:460,background:"#fff",padding:28,border:"1px solid #e7e6df",boxShadow:"0 18px 50px #0000000a"}}>
      <Brand/><div style={{marginTop:30,fontSize:10,letterSpacing:2,color:"#96968e",fontWeight:700}}>JOIN THE COMMUNITY</div>
      {member ? <div style={{textAlign:"center",paddingTop:18}}>
        <div style={{fontSize:30,fontWeight:800}}>Selamat bergabung.</div>
        <p style={{color:"#777",lineHeight:1.6}}>Keanggotaan SANDIKALE berhasil dibuat.</p>
        <div style={{background:"#191919",color:"#fff",padding:22,margin:"22px 0"}}>
          <div style={{fontSize:10,letterSpacing:2,color:"#aaa"}}>MEMBER ID</div><h2 style={{margin:"8px 0"}}>{member.member_code}</h2>
          <img alt="QR kartu member" style={{width:190,height:190,background:"#fff",padding:9,margin:"8px auto"}} src={"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data="+encodeURIComponent(memberUrl)}/>
          <div style={{fontSize:12,color:"#ddd"}}>{member.full_name}</div>
        </div>
        <button onClick={copyLink} style={{width:"100%",padding:14,background:"#191919",color:"#fff",border:0}}>{copied?"Link berhasil disalin":"Salin link kartu member"}</button>
        <p style={{fontSize:12,color:"#888",lineHeight:1.6}}>Simpan tautan ini. Tunjukkan QR tersebut kepada kasir setiap kali bertransaksi agar stamp tercatat.</p>
      </div> : <form onSubmit={submit} style={{display:"grid",gap:13,marginTop:22}}>
        <h1 style={{fontSize:28,lineHeight:1.15,margin:"0 0 4px",letterSpacing:-1}}>Daftar Member Club</h1>
        <p style={{fontSize:13,color:"#777",lineHeight:1.6,margin:"0 0 8px"}}>Gabung gratis dan kumpulkan stamp setiap transaksi yang memenuhi ketentuan SANDIKALE.</p>
        <label style={{fontSize:12,fontWeight:600}}>Nama lengkap<input required minLength={2} autoComplete="name" style={{...field,display:"block",marginTop:7}} value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder="Nama sesuai identitas"/></label>
        <label style={{fontSize:12,fontWeight:600}}>Nomor WhatsApp<input required type="tel" autoComplete="tel" style={{...field,display:"block",marginTop:7}} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="08xxxxxxxxxx"/></label>
        <label style={{fontSize:12,fontWeight:600}}>Email (opsional)<input type="email" autoComplete="email" style={{...field,display:"block",marginTop:7}} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@contoh.com"/></label>
        {error&&<p style={{color:"#a33",fontSize:12,background:"#fff1f0",padding:10}}>{error}</p>}
        <button disabled={saving} style={{padding:15,background:"#191919",color:"#fff",border:0,fontWeight:700,marginTop:5}}>{saving?"Mendaftarkan…":"Daftar sebagai member"}</button>
        <small style={{color:"#999",lineHeight:1.5}}>Dengan mendaftar, kamu menyetujui data nama dan nomor WhatsApp digunakan untuk administrasi keanggotaan SANDIKALE.</small>
      </form>}
    </section>
  </main>;
}

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const publicToken = params.get("token");
  if (params.get("register") === "1" || window.location.pathname.replace(/\/$/,"") === "/daftar") return <RegistrationPage/>;
  if (publicToken) return <PublicMemberCard token={publicToken}/>;
  const [tab, setTab] = useState("home");
  const [stamps] = useState(6);
  const [modal, setModal] = useState(null);
  const [claimed, setClaimed] = useState([]);
  const [name, setName] = useState("Ko Abee");
  const [phone, setPhone] = useState("0822 6641 2844");
  const [whatsapp, setWhatsapp] = useState(true);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState("");
  const target = 10;
  const availableRewards = useMemo(() => rewards.filter(r => !claimed.includes(r.id)), [claimed]);

  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(""), 2600); };
  const claimReward = (reward) => { setModal({ type: "claim", reward }); };
  const confirmClaim = () => {
    const reward = modal.reward;
    setClaimed(current => [...current, reward.id]);
    setModal(null);
    notify("Permintaan klaim dicatat pada demo ini.");
  };

  const navItems = [{ id: "home", label: "Home", icon: "home" }, { id: "rewards", label: "Reward", icon: "gift" }, { id: "history", label: "History", icon: "history" }, { id: "profile", label: "Profile", icon: "user" }];

  return (
    <div className="app-shell">
      <header className="topbar"><Brand /><div className="topbar-right"><span className="online-dot" /> <span>MEMBER AREA</span><button className="avatar" onClick={() => setTab("profile")}>KA</button></div></header>
      <main className="main-layout">
        <aside className="sidebar"><div className="sidebar-label">MEMBER MENU</div>{navItems.map(item => <button key={item.id} className={`nav-link ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{tab === item.id && <i />}</button>)}<div className="sidebar-note"><span className="eyebrow">SANDIKALE</span><p>Terima kasih sudah menjadi bagian dari perjalanan kreatif kami.</p><span className="sidebar-version">MEMBER CLUB • V1.0</span></div></aside>
        <div className="content-area">
          <div className="welcome-row"><div><span className="eyebrow">TUESDAY, 10 NOVEMBER 2026</span><h1>{tab === "home" ? <>Halo, {name.split(" ")[0]}.</> : tab === "rewards" ? "Reward kamu." : tab === "history" ? "Riwayat transaksi." : "Profil member."}</h1><p className="muted">{tab === "home" ? "Senang melihatmu kembali di SANDIKALE MEMBER CLUB." : "Kelola aktivitas keanggotaan SANDIKALE kamu."}</p></div><div className="member-status"><span className="status-dot" /> ACTIVE MEMBER</div></div>

          {tab === "home" && <>
            <div className="home-grid"><div className="home-main"><MemberCard stamps={stamps} onShowQr={() => setModal({ type: "qr" })} /><StampPanel stamps={stamps} target={target} /></div><div className="home-side"><section className="welcome-card"><span className="eyebrow light">A LITTLE THANK YOU</span><h2>Setiap karya,<br />ada apresiasi.</h2><p>Kumpulkan stamp dari transaksi valid dan tukarkan dengan reward spesial dari SANDIKALE.</p><button onClick={() => setTab("rewards")}>Jelajahi reward <Icon name="arrow" /></button><div className="welcome-number">01</div></section><section className="quick-info"><span className="eyebrow">MEMBER SINCE</span><strong>Oktober 2026</strong><div className="quick-divider" /><span className="eyebrow">MEMBER ID</span><strong>SK-000001</strong></section></div></div>
            <div className="section-heading lower-heading"><div><span className="eyebrow">MEMBER PRIVILEGES</span><h2>Reward pilihan</h2></div><button className="text-link" onClick={() => setTab("rewards")}>Lihat semua <Icon name="arrow" /></button></div>
            <div className="reward-grid">{availableRewards.slice(0, 2).map(reward => <RewardCard key={reward.id} reward={reward} stamps={stamps} onClaim={claimReward} />)}</div>
          </>}

          {tab === "rewards" && <><div className="page-intro"><span className="eyebrow">YOUR BENEFITS</span><h2>Apresiasi untuk setiap transaksi.</h2><p className="muted">Reward terbuka otomatis setelah jumlah stamp memenuhi target yang ditentukan.</p></div><div className="reward-grid full-reward-grid">{availableRewards.map(reward => <RewardCard key={reward.id} reward={reward} stamps={stamps} onClaim={claimReward} />)}</div>{claimed.length > 0 && <p className="muted small-copy">Reward yang sudah diklaim: {claimed.length}. Data ini hanya tersimpan sementara di browser demo.</p>}</>}

          {tab === "history" && <div className="panel history-panel"><div className="section-heading"><div><span className="eyebrow">TRANSACTION LOG</span><h3>Aktivitas member</h3></div><span className="history-total">03 RECORDS</span></div>{initialHistory.map(item => <div className="history-row" key={item.id}><div className="history-icon"><Icon name="check" /></div><div className="history-detail"><b>{item.detail}</b><span>{item.date} • {item.id}</span></div><div className="history-result"><b>{item.stamp}</b><span>{item.status}</span></div><Icon name="chevron" /></div>)}<div className="demo-notice">Riwayat di atas adalah data contoh untuk pratinjau UI, bukan transaksi asli.</div></div>}

          {tab === "profile" && <div className="profile-grid"><section className="panel profile-panel"><span className="eyebrow">PERSONAL INFORMATION</span><h3>Informasi member</h3><label>Nama lengkap<input value={name} onChange={e => setName(e.target.value)} /></label><label>Nomor WhatsApp<input value={phone} onChange={e => setPhone(e.target.value)} /></label><label className="consent-row"><input type="checkbox" checked={whatsapp} onChange={e => setWhatsapp(e.target.checked)} /><span><b>Terima informasi melalui WhatsApp</b><small>Persetujuan komunikasi dapat diubah kapan saja. Pesan promosi dan notifikasi transaksi akan dikelola terpisah.</small></span></label><button className="button-dark save-button" onClick={() => { setSaved(true); notify("Perubahan tersimpan sementara di demo."); }}>Simpan perubahan <Icon name="arrow" /></button>{saved && <p className="saved-note">Perubahan tersimpan sementara pada sesi demo.</p>}</section><section className="panel profile-member"><div className="profile-avatar">KA</div><h3>{name || "Member SANDIKALE"}</h3><p className="muted">SK-000001</p><span className="member-state">ACTIVE MEMBER</span><div className="profile-stats"><div><b>{stamps}</b><small>Stamp</small></div><div><b>{claimed.length}</b><small>Reward diklaim</small></div></div></section></div>}
          <footer className="footer"><Brand compact /><span>© 2026 SANDIKALE. Crafted with purpose.</span><span>MEMBER CLUB V1.0</span></footer>
        </div>
      </main>
      <nav className="mobile-nav">{navItems.map(item => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav>
      {modal?.type === "qr" && <Modal title="QR member" onClose={() => setModal(null)}><div className="qr-modal-content"><div className="fake-qr"><Icon name="qr" /></div><h3>SK-000001</h3><p className="muted">Tunjukkan kartu member ini kepada kasir SANDIKALE.</p><div className="demo-notice">QR ini hanya ilustrasi. QR member asli akan dibuat dengan token aman dari server setelah integrasi backend.</div></div></Modal>}
      {modal?.type === "claim" && <Modal title="Konfirmasi reward" onClose={() => setModal(null)}><div className="claim-content"><div className="reward-art"><Icon name="gift" /></div><h3>{modal.reward.name}</h3><p className="muted">{modal.reward.detail}</p><div className="demo-notice">Pratinjau saja: proses klaim belum terhubung ke server dan belum menerbitkan kode penukaran.</div><button className="button-dark claim-confirm" onClick={confirmClaim}>Lanjutkan demo <Icon name="arrow" /></button></div></Modal>}
      {toast && <div className="toast">{toast}</div>}
      <div className="demo-ribbon">PREVIEW • SAMPLE DATA</div>
    </div>
  );
}