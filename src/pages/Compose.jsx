import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import styles from "./Compose.module.css";

export default function Compose() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const extractGadgetTag = (t) => {
    const match = t.match(/#(\w[\w\s]*\w|\w+)/);
    return match ? match[1] : null;
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !image) return;
    setLoading(true);

    let imageUrl = null;
    if (image) {
      const storageRef = ref(storage, `posts/${user.uid}_${Date.now()}`);
      await uploadBytes(storageRef, image);
      imageUrl = await getDownloadURL(storageRef);
    }

    const gadgetTag = extractGadgetTag(text);

    await addDoc(collection(db, "posts"), {
      text: text.trim(),
      imageUrl,
      gadgetTag,
      authorId: user.uid,
      authorName: user.displayName || user.email,
      authorPhoto: user.photoURL || "",
      likes: [],
      commentCount: 0,
      createdAt: serverTimestamp()
    });

    navigate("/");
  };

  const charLimit = 500;

  return (
    <div className="page">
      <div className={styles.header}>
        <button className="btn-ghost" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h2 style={{fontSize:16, fontWeight:500}}>Buat Postingan</h2>
        <button
          className="btn-primary"
          style={{padding:"7px 18px"}}
          onClick={handleSubmit}
          disabled={loading || (!text.trim() && !image)}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>

      <div className={styles.composer}>
        <img
          src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || user?.email}&background=3b82f6&color=fff`}
          className="avatar"
          alt="you"
        />
        <div className={styles.inputArea}>
          <textarea
            placeholder="Ceritain gadget kamu... gunakan #NamaGadget untuk tag gadget dan @username untuk mention"
            value={text}
            onChange={e => setText(e.target.value)}
            maxLength={charLimit}
            rows={4}
            className={styles.textarea}
          />

          {preview && (
            <div className={styles.previewWrap}>
              <img src={preview} className={styles.preview} alt="preview" />
              <button className={styles.removeImg} onClick={() => { setImage(null); setPreview(null); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          )}

          <div className={styles.toolbar}>
            <button className="btn-ghost" onClick={() => fileRef.current.click()} style={{padding:"4px 8px",fontSize:13}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Foto
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} style={{display:"none"}} />
            <span className={styles.counter} style={{color: text.length > charLimit * 0.9 ? "var(--danger)" : "var(--text2)"}}>
              {text.length}/{charLimit}
            </span>
          </div>

          <div className={styles.hints}>
            <span className={styles.hint}>#Samsung · #iPhone15 → tag gadget</span>
            <span className={styles.hint}>@username → mention pengguna</span>
          </div>
        </div>
      </div>
    </div>
  );
}
