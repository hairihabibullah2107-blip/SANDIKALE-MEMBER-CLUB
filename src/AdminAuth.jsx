import React, { useEffect, useState } from "react";
import { supabase } from "./supabase.js";

const OWNER_EMAIL = "hairihabibullah2107@gmail.com";

export default function AdminAuth({ children }) {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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
        .select("user_id, role, display_name, is_active").eq("user_id", session.user.id).maybeSingle();
      if (!alive) return;
      if (queryError) { setError("Tidak dapat memeriksa hak akses Owner. Coba muat ulang."); setProfile(null); return; }
      if (!data || data.is_active !== true || !["owner", "admin"].includes(String(data.role).toLowerCase())) {
        setError("Akun masuk, tetapi belum memiliki hak Owner/Admin aktif."); setProfile(null); return;
      }
      setError(""); setProfile(data);
    }
    loadStaffProfile();
    return () => { alive = false; };
  }, [session]);

  async function signIn(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    if (email.trim().toLowerCase() !== OWNER_EMAIL) {
      setBusy(false); setError("Gunakan email Owner yang telah ditetapkan."); return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password });
    setBusy(false);
    if (signInError) setError("Login gagal. Jika ini pertama kali, pilih Buat Akun Owner terlebih dahulu. Pastikan email sudah diverifikasi.");
    setPassword("");
  }

  async function signOut() {
    await supabase.auth.signOut(); setSession(null); setProfile(null); setError(""); setNotice("");
  }

  if (checking) return <div style={screen}><div style={panel}><b>SANDIKALE</b><p>Memeriksa sesi Owner…</p></div></div>;
  if (session && profile) return <>{React.cloneElement(children, { ownerProfile: profile, onOwnerSignOut: signOut })}</>;
  return <div style={screen}><div style={panel}>
    <div style={{fontSize:12,letterSpacing:3,color:"#888"}}>SANDIKALE</div>
    <h1 style={{fontSize:27,margin:"10px 0 4px"}}>Owner Access</h1>
    <p style={{color:"#777",fontSize:14,lineHeight:1.6,marginBottom:26}}>Panel pengelolaan SANDIKALE MEMBER CLUB.</p>
    <form onSubmit={signIn}>
      <label style={label}>EMAIL OWNER</label>
      <input autoComplete="username" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email Owner" style={field}/>
      <label style={label}>PIN / PASSWORD</label>
      <input autoComplete="current-password" type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Masukkan PIN" style={field}/>
      {error && <div style={errorBox}>{error}</div>}
      {notice && <div style={noticeBox}>{notice}</div>}
      <button disabled={busy} style={submit}>{busy ? "Memproses…" : "Masuk sebagai Owner"}</button>
    </form>
    <div style={noticeBox}>Pembuatan akun Owner sedang dikunci sementara agar tidak membuat akun kasir pada database POS lama. Akun Owner harus dibuat melalui jalur autentikasi yang terpisah.</div>
    <p style={{fontSize:11,color:"#999",lineHeight:1.6,marginTop:20}}>Pendaftaran dibatasi hanya untuk alamat email Owner yang telah ditetapkan. Gunakan PIN rahasia dan ganti setelah login pertama.</p>
  </div></div>;
}
const screen={minHeight:"100vh",display:"grid",placeItems:"center",padding:20,background:"#f2f2ef",fontFamily:"Arial,sans-serif",color:"#171717"};
const panel={width:"min(100%,430px)",background:"#fff",padding:32,border:"1px solid #e5e5df",boxShadow:"0 20px 60px #0000000d"};
const label={display:"block",fontSize:10,letterSpacing:1.5,fontWeight:700,color:"#666",margin:"16px 0 7px"};
const field={width:"100%",boxSizing:"border-box",padding:"14px 13px",border:"1px solid #ddd",fontSize:15,background:"#fff",color:"#111",outlineColor:"#222"};
const submit={width:"100%",marginTop:22,padding:15,background:"#171717",color:"#fff",border:0,fontWeight:700,fontSize:13,cursor:"pointer"};
const errorBox={marginTop:16,padding:12,background:"#fff1ef",border:"1px solid #efc7c1",color:"#8c3028",fontSize:12,lineHeight:1.5};
const noticeBox={marginTop:16,padding:12,background:"#eff8f0",border:"1px solid #cce4d0",color:"#245b31",fontSize:12,lineHeight:1.5};
