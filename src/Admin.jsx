import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase.js";

const NAV = ["Ringkasan", "Member", "Transaksi", "Aturan Stamp", "Reward", "Penukaran", "Laporan", "Pengaturan"];
const money = value => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));
const dateText = value => value ? new Date(value).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function Icon({ name }) {
  const paths = {
    grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
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

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    const results = await Promise.all([
      supabase.from("mc_members").select("id,member_code,full_name,phone,email,status,total_stamps,total_points,joined_at").order("created_at",{ascending:false}).limit(500),
      supabase.from("mc_transactions").select("id,invoice_number,member_id,total,transaction_date,points_earned").order("transaction_date",{ascending:false}).limit(100),
      supabase.from("mc_stamps").select("id",{count:"exact",head:true}),
      supabase.from("mc_rewards").select("id",{count:"exact",head:true}),
      supabase.from("mc_reward_claims").select("id",{count:"exact",head:true})
    ]);
    const firstError = results.find(r => r.error)?.error;
    if (firstError) setError("Data belum dapat dimuat: " + firstError.message);
    const memberRows = results[0].data || [];
    const transactionRows = results[1].data || [];
    setMembers(memberRows); setTransactions(transactionRows);
    setCounts({
      members: memberRows.length,
      transactions: transactionRows.length,
      stamps: results[2].count || 0,
      rewards: results[3].count || 0,
      claims: results[4].count || 0
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

  async function saveRules(event) {
    event.preventDefault(); setSaving(true); setError("");
    const value = { minimum_transaction:Number(minimum), stamps_per_transaction:Number(stampsPerTransaction) };
    const { data: userData } = await supabase.auth.getUser();
    const { error: saveError } = await supabase.from("mc_settings").upsert({key:"loyalty_rules",value,updated_by:userData.user?.id || null,updated_at:new Date().toISOString()},{onConflict:"key"});
    setSaving(false);
    if (saveError) { setError("Aturan belum tersimpan: " + saveError.message); return; }
    notify("Aturan stamp tersimpan.");
  }

  const navIcons = ["grid","users","receipt","chart","gift","receipt","chart","settings"];
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
          <section className="admin-panel admin-table-panel"><div className="admin-panel-head"><div><span className="admin-eyebrow">MEMBER OVERVIEW</span><h2>Member terbaru</h2></div><button className="admin-text-button" onClick={()=>setActive("Member")}>Kelola member <Icon name="arrow"/></button></div><MemberTable members={members.slice(0,5)} loading={loading}/></section>
        </>}
        {active==="Member" && <section className="admin-panel admin-table-panel"><div className="admin-panel-head"><div><span className="admin-eyebrow">CUSTOMER DATABASE</span><h2>Daftar member ({members.length})</h2></div><button className="admin-primary" onClick={()=>setShowAdd(v=>!v)}><Icon name="plus"/>{showAdd?"Tutup form":"Tambah member"}</button></div>
          {showAdd && <form className="admin-add-form" onSubmit={addMember}><label>Nama lengkap<input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder="Nama pelanggan" required/></label><label>Nomor WhatsApp<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="08xxxxxxxxxx" required/></label><label>Email (opsional)<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@contoh.com"/></label><button className="admin-primary" disabled={saving}>{saving?"Menyimpan…":"Simpan member"}</button></form>}
          <div className="admin-search"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari nama, ID, atau nomor WhatsApp…"/></div><MemberTable members={filtered} loading={loading}/><p className="admin-footnote">Data dibaca langsung dari database Member Club. ID member dibuat otomatis saat pendaftaran.</p></section>}
        {active==="Transaksi" && <section className="admin-panel admin-table-panel"><div className="admin-panel-head"><div><span className="admin-eyebrow">TRANSACTION RECORDS</span><h2>Riwayat transaksi ({transactions.length})</h2></div></div><TransactionTable transactions={transactions} memberById={memberById} loading={loading}/><p className="admin-footnote">Transaksi akan muncul setelah dicatat oleh sistem kasir atau staf yang memiliki akses.</p></section>}
        {active==="Aturan Stamp" && <section className="admin-panel admin-form-panel"><span className="admin-eyebrow">LOYALTY CONFIGURATION</span><h2>Aturan pemberian stamp</h2><form onSubmit={saveRules}><label>Minimum transaksi (Rupiah)<input type="number" min="0" value={minimum} onChange={e=>setMinimum(e.target.value)} required/></label><label>Stamp per transaksi<input type="number" min="1" max="100" value={stampsPerTransaction} onChange={e=>setStampsPerTransaction(e.target.value)} required/></label><button className="admin-primary" disabled={saving}>{saving?"Menyimpan…":"Simpan aturan"} <Icon name="arrow"/></button></form><p className="admin-footnote">Aturan disimpan ke tabel pengaturan. Penerapan otomatis pada transaksi kasir akan disambungkan pada tahap integrasi berikutnya.</p></section>}
        {["Reward","Penukaran","Laporan","Pengaturan"].includes(active) && <section className="admin-panel admin-placeholder"><span className="admin-eyebrow">MODUL BERIKUTNYA</span><div className="admin-placeholder-mark"><Icon name={active==="Reward"?"gift":active==="Laporan"?"chart":"grid"}/></div><h2>Modul {active}</h2><p>Struktur database sudah tersedia. Modul ini akan diaktifkan setelah alur member, transaksi, dan aturan stamp stabil.</p><button className="admin-primary" onClick={()=>loadData()}>Perbarui data <Icon name="arrow"/></button></section>}
      </div>
      <footer className="admin-footer"><Brand/><span>© 2026 SANDIKALE MEMBER CLUB</span><span>OWNER WORKSPACE • LIVE DATABASE</span></footer>
    </main>
    {notice&&<div className="admin-toast">{notice}</div>}
  </div>;
}

function MemberTable({members,loading}) {
  if (loading) return <p className="admin-empty">Memuat data member…</p>;
  if (!members.length) return <p className="admin-empty">Belum ada member tersimpan. Gunakan tombol “Tambah member” untuk membuat data pertama.</p>;
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>MEMBER</th><th>NOMOR WHATSAPP</th><th>STAMP</th><th>STATUS</th><th>TERDAFTAR</th></tr></thead><tbody>{members.map(m=><tr key={m.id}><td><b>{m.full_name}</b><small>{m.member_code}</small></td><td>{m.phone}</td><td><b>{m.total_stamps}</b></td><td><span className={m.status==="active"?"admin-status":"admin-pending"}>{m.status==="active"?"Aktif":m.status}</span></td><td>{dateText(m.joined_at)}</td></tr>)}</tbody></table></div>;
}
function TransactionTable({transactions,memberById,loading}) {
  if (loading) return <p className="admin-empty">Memuat transaksi…</p>;
  if (!transactions.length) return <p className="admin-empty">Belum ada transaksi. Data transaksi akan tampil setelah dicatat melalui sistem.</p>;
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>INVOICE</th><th>MEMBER</th><th>NILAI</th><th>POIN</th><th>TANGGAL</th></tr></thead><tbody>{transactions.map(t=><tr key={t.id}><td><b>{t.invoice_number}</b></td><td>{memberById[t.member_id]?.full_name || "Non-member"}</td><td>{money(t.total)}</td><td>{t.points_earned}</td><td>{dateText(t.transaction_date)}</td></tr>)}</tbody></table></div>;
}
