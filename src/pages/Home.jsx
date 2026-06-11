import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import PostCard from "../components/PostCard";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [tab, setTab] = useState("trending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "posts"),
      orderBy(tab === "trending" ? "likes" : "createdAt", "desc"),
      limit(30)
    );
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [tab]);

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs}>
        <button className={tab === "trending" ? styles.active : ""} onClick={() => setTab("trending")}>Trending</button>
        <button className={tab === "latest" ? styles.active : ""} onClick={() => setTab("latest")}>Terbaru</button>
      </div>

      {loading ? <div className="spinner" /> : (
        posts.length === 0
          ? <p className={styles.empty}>Belum ada postingan. Jadilah yang pertama!</p>
          : posts.map(p => <PostCard key={p.id} post={p} />)
      )}

      <Link to="/compose" className={styles.fab}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </Link>
    </div>
  );
}
