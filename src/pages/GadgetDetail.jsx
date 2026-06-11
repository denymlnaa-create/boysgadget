import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import PostCard from "../components/PostCard";
import styles from "./GadgetDetail.module.css";

export default function GadgetDetail() {
  const { name } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [specs, setSpecs] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("specs");

  const slug = location.state?.slug;

  useEffect(() => {
    const fetchSpecs = async () => {
      if (!slug) { setLoading(false); return; }
      try {
        const res = await fetch(`https://phone-specs-api.azharimm.dev/specs?slug=${slug}`);
        const data = await res.json();
        setSpecs(data.data);
      } catch { }
      setLoading(false);
    };
    fetchSpecs();

    const q = query(
      collection(db, "posts"),
      where("gadgetTag", "==", decodeURIComponent(name)),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [name, slug]);

  return (
    <div style={{maxWidth:600,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:16}}>
        <button className="btn-ghost" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h1 style={{fontSize:18,fontWeight:700}}>{decodeURIComponent(name)}</h1>
      </div>

      {specs && (
        <div className={styles.heroWrap}>
          {specs.thumbnail && <img src={specs.thumbnail} className={styles.heroImg} alt={specs.phone_name} />}
          <div className={styles.heroInfo}>
            <p className={styles.heroName}>{specs.phone_name}</p>
            {specs.release_date && <p className={styles.heroSub}>Rilis: {specs.release_date}</p>}
          </div>
        </div>
      )}

      <div className={styles.tabs}>
        <button className={tab === "specs" ? styles.active : ""} onClick={() => setTab("specs")}>Spesifikasi</button>
        <button className={tab === "posts" ? styles.active : ""} onClick={() => setTab("posts")}>Diskusi ({posts.length})</button>
      </div>

      {tab === "specs" && (
        loading ? <div className="spinner" /> :
        !specs ? <p style={{color:"var(--text2)",fontSize:14,padding:"30px 20px",textAlign:"center"}}>Data spesifikasi tidak tersedia.</p> :
        <div className={styles.specsTable}>
          {specs.specifications?.map((section, i) => (
            <div key={i} className={styles.specSection}>
              <h3 className={styles.specTitle}>{section.title}</h3>
              {section.specs?.map((row, j) => (
                <div key={j} className={styles.specRow}>
                  <span className={styles.specKey}>{row.key}</span>
                  <span className={styles.specVal}>{Array.isArray(row.val) ? row.val.join(", ") : row.val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === "posts" && (
        posts.length === 0
          ? <p style={{color:"var(--text2)",fontSize:14,padding:"30px 20px",textAlign:"center"}}>Belum ada diskusi untuk gadget ini.</p>
          : posts.map(p => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
