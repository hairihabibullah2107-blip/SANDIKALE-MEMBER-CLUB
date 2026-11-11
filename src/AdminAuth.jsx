import React, { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

function Brand() {
  return <div className="brand"><span className="brand-mark">S</span><span><b>SANDIKALE</b><small>MEMBER CLUB</small></span></div>;
}

export default function AdminAuth({ children }) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) { setSession(data.session); setChecking(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (alive) { setSession(nextSession); setProfile(null); }
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let alive = true;
    async function loadStaffProfile() {
      if (!session?.user?.id) { setProfile(null); return; }
      const { data, error: queryError } = await supabase.from("mc_staff_profiles")
        .select("auth_user_id, role, full_name, is_active").eq("auth_user_id", session.user.id).maybeSingle();
      if (!alive) return;
      if (queryError) { setError("Hak akses Owner belum dapat diperiksa. Muat ulang halaman."); setProfile(null); return; }
      if (!data || data.is_active !== true || !["owner", "admin", "cashier"].includes(String(data.role).toLowerCase())) {
        setError("Akun berhasil masuk, tetapi belum memiliki hak akses staf aktif. Hubungi Owner SANDIKALE."); setProfile(null); return;
      }
      setError(""); setProfile(data);
    }
    loadStaffProfile();
    return () => { alive = false; };
  }, [session]);

  async function signIn(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) {
        setError(`Autentikasi gagal: ${signInError.message}`);
      }
    } catch (err) {
      setError(`Tidak dapat menghubungi layanan login: ${err?.message || "Periksa koneksi internet lalu coba lagi."}`);
    } finally {
      setBusy(false);
      setPassword("");
    }
  }

  async function signOut() {
    await supabase.auth.signOut(); setSession(null); setProfile(null); setError("");
  }

  if (checking) return <div className="owner-screen"><section className="owner-visual"><div className="owner-brand"><Brand /></div><div className="owner-copy"><span className="eyebrow">PRIVATE WORKSPACE</span><h1>Good work.<br/>Lasting loyalty.</h1></div></section><section className="owner-login-side"><div className="owner-login-card"><b>Memeriksa sesi Owner…</b></div></section></div>;
  if (session && profile) return <>{React.cloneElement(children, { ownerProfile: profile, onOwnerSignOut: signOut })}</>;
  return <div className="owner-screen">
    <section className="owner-visual">
      <div className="owner-brand"><Brand /></div>
      <div className="owner-copy"><span className="eyebrow">PRIVATE WORKSPACE</span><h1>Good work.<br/>Lasting loyalty.</h1><p>Kelola hubungan pelanggan, program stamp, dan reward SANDIKALE dalam satu ruang kerja.</p></div>
      <div className="owner-visual-foot">SANDIKALE MEMBER CLUB · OWNER ACCESS</div>
    </section>
    <section className="owner-login-side">
      <div className="owner-login-card">
        <div className="owner-mobile-brand"><Brand /></div>
        <span className="eyebrow">ADMINISTRATOR PORTAL</span>
        <h2>Selamat datang.</h2>
        <p>Masuk menggunakan akun Owner untuk melanjutkan ke dashboard pengelolaan.</p>
        <form onSubmit={signIn}>
          <label htmlFor="owner-email">EMAIL OWNER</label>
          <input id="owner-email" autoComplete="username" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email akun staf" />
          <label htmlFor="owner-password">PIN / PASSWORD</label>
          <input id="owner-password" autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Masukkan PIN atau password" />
          {error && <div className="owner-error" role="alert">{error}</div>}
          <button className="owner-submit" disabled={busy}>{busy ? "MEMERIKSA AKUN…" : "MASUK KE DASHBOARD"}</button>
        </form>
        <div className="owner-notice">Akses ini khusus Owner dan Admin terdaftar. Pendaftaran akun publik dinonaktifkan.</div>
        <p className="owner-security">Jangan bagikan PIN atau password kepada siapa pun. Gunakan perangkat pribadi dan keluar setelah selesai.</p>
      </div>
    </section>
  </div>;
}
