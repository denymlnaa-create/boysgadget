import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import PostCard from "../components/PostCard";
import styles from "./BrandStream.module.css";

export default function BrandStream() {
  const { brand } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      where("gadgetTag", "==", brand),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [brand]);

  return (
    <div style={{maxWidth:600,margin:"0 auto"}}>
      <div className={styles.header}>
        <button className="btn-ghost" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <div>
          <h1 className={styles.brandName}>#{brand}</h1>
          <p className={styles.brandCount}>{posts.length} postingan</p>
        </div>
      </div>
      <hr className="divider" />
      {loading ? <div className="spinner" /> :
        posts.length === 0
          ? <p style={{color:"var(--text2)",fontSize:14,padding:"40px 20px",textAlign:"center"}}>Belum ada postingan dengan tag #{brand}</p>
          : posts.map(p => <PostCard key={p.id} post={p} />)
      }
    </div>
  );
}
