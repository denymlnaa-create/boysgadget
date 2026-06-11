import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import styles from "./Notifications.module.css";

export default function Notifications() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      where("toUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      snap.docs.forEach(d => {
        if (!d.data().read) updateDoc(doc(db, "notifications", d.id), { read: true });
      });
    });
    return unsub;
  }, [user.uid]);

  const getIcon = (type) => {
    if (type === "like") return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" style={{color:"var(--danger)"}}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
    if (type === "comment") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:"var(--accent)"}}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
    if (type === "reply") return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:"#60a5fa"}}><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>;
    return null;
  };

  return (
    <div className="page">
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:16}}>Notifikasi</h2>
      {notifs.length === 0
        ? <p style={{color:"var(--text2)",fontSize:14,textAlign:"center",padding:"40px 0"}}>Belum ada notifikasi.</p>
        : notifs.map(n => (
          <Link key={n.id} to={`/post/${n.postId}`} className={`${styles.notif} ${!n.read ? styles.unread : ""}`}>
            <div className={styles.iconWrap}>{getIcon(n.type)}</div>
            <div className={styles.notifBody}>
              <p className={styles.notifText}>
                <strong>{n.fromName}</strong>
                {n.type === "like" && " menyukai postingan kamu"}
                {n.type === "comment" && " mengomentari postingan kamu"}
                {n.type === "reply" && " membalas komentar kamu"}
              </p>
              <p className={styles.notifTime}>
                {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleDateString("id-ID", {day:"numeric",month:"short"}) : ""}
              </p>
            </div>
            {!n.read && <div className={styles.dot} />}
          </Link>
        ))
      }
    </div>
  );
}
