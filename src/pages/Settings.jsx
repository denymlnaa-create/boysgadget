import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import styles from "./Settings.module.css";

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", bio: "" });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then(d => {
      if (d.exists()) setForm({ name: d.data().name || "", bio: d.data().bio || "" });
    });
    setPreview(user.photoURL || null);
  }, [user]);

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    let photoURL = user.photoURL;

    if (avatar) {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, avatar);
      photoURL = await getDownloadURL(storageRef);
    }

    await updateProfile(auth.currentUser, { displayName: form.name, photoURL });
    await updateDoc(doc(db, "users", user.uid), {
      name: form.name,
      bio: form.bio,
      photoURL
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setLoading(false);
  };

  return (
    <div className="page">
      <div className={styles.header}>
        <button className="btn-ghost" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h2 style={{fontSize:16,fontWeight:500}}>Edit Profil</h2>
        <div style={{width:40}} />
      </div>

      <form onSubmit={handleSave} className={styles.form}>
        <div className={styles.avatarSection}>
          <img
            src={preview || `https://ui-avatars.com/api/?name=${form.name}&background=3b82f6&color=fff&size=80`}
            className={styles.avatarPreview}
            alt="avatar"
          />
          <label className="btn-outline" style={{cursor:"pointer",padding:"7px 16px",fontSize:13}}>
            Ganti Foto
            <input type="file" accept="image/*" onChange={handleAvatar} style={{display:"none"}} />
          </label>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Nama</label>
          <input
            placeholder="Nama kamu"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Bio</label>
          <textarea
            placeholder="Ceritain sedikit tentang kamu..."
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            rows={3}
            maxLength={150}
          />
        </div>

        <button type="submit" className="btn-primary" style={{width:"100%"}} disabled={loading}>
          {saved ? "Tersimpan!" : loading ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </div>
  );
}
