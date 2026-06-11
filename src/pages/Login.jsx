import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const saveUser = async (user) => {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: user.displayName || form.name || user.email,
      email: user.email,
      photoURL: user.photoURL || "",
      bio: "",
      createdAt: serverTimestamp()
    }, { merge: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (isRegister) {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.name });
        await saveUser({ ...cred.user, displayName: form.name });
      } else {
        const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
        await saveUser(cred.user);
      }
      navigate("/");
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").replace(/\(.*\)/, "").trim());
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await saveUser(cred.user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.box}>
        <h1 className={styles.logo}>BoysGadget</h1>
        <p className={styles.sub}>Komunitas gadget para tech enthusiast</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {isRegister && (
            <input
              placeholder="Nama lengkap"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className="btn-primary" style={{width:"100%"}} disabled={loading}>
            {loading ? "Loading..." : isRegister ? "Daftar" : "Masuk"}
          </button>
        </form>

        <div className={styles.dividerRow}>
          <hr className="divider" style={{flex:1}}/>
          <span style={{fontSize:12, color:"var(--text2)", padding:"0 10px"}}>atau</span>
          <hr className="divider" style={{flex:1}}/>
        </div>

        <button className={styles.googleBtn} onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Masuk dengan Google
        </button>

        <p className={styles.toggle}>
          {isRegister ? "Sudah punya akun? " : "Belum punya akun? "}
          <button className="btn-ghost" style={{padding:"0",color:"var(--accent)"}} onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Masuk" : "Daftar"}
          </button>
        </p>
      </div>
    </div>
  );
}
