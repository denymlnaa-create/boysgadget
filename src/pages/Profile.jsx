import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import PostCard from "../components/PostCard";
import styles from "./Profile.module.css";

export default function Profile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getDoc(doc(db, "users", uid)).then(d => {
      if (d.exists()) setProfile(d.data());
    });
    const q = query(
      collection(db, "posts"),
      where("authorId", "==", uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [uid]);

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);
  const isOwn = user?.uid === uid;

  if (!profile) return <div className="spinner" />;

  return (
    <div style={{maxWidth:600,margin:"0 auto"}}>
      <div className={styles.headerBar}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <span style={{fontSize:15,fontWeight:500}}>{profile.name}</span>
        {isOwn && (
          <Link to="/settings" className="btn btn-secondary" style={{padding:"6px 14px",fontSize:13}}>Edit Profil</Link>
        )}
      </div>

      <div className={styles.profileSection}>
        <img
          src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.name}&background=3b82f6&color=fff&size=80`}
          className={styles.avatar}
          alt={profile.name}
        />
        <h1 className={styles.name}>{profile.name}</h1>
        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{posts.length}</span>
            <span className={styles.statLabel}>Postingan</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{totalLikes}</span>
            <span className={styles.statLabel}>Likes</span>
          </div>
        </div>
      </div>

      <hr className="divider" />

      <div>
        {posts.length === 0
          ? <p style={{color:"var(--ink-muted-48)",fontSize:14,padding:"40px 20px",textAlign:"center"}}>Belum ada postingan.</p>
          : posts.map(p => <PostCard key={p.id} post={p} />)
        }
      </div>
    </div>
  );
}
