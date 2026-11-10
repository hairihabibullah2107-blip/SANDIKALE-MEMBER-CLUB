import { useMemo, useState } from "react";

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
  return <div className={`brand ${compact ? "brand-compact" : ""}`}><span className="brand-mark">S</span><span><b>SANDIKALE</b><small>MEMBER CLUB</small></span></div>;
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

export default function App() {
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