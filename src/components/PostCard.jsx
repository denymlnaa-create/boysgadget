import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// 🟢 TAMBAHAN: Import collection, addDoc, dan serverTimestamp dari firebase
import { doc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import styles from "./PostCard.module.css";
import { getCachedPhoneImage } from "../utils/imageUtils";

export default function PostCard({ post }) {
  const { user } = useAuth();
  const liked = post.likes?.includes(user?.uid);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(liked);
  const [phoneImage, setPhoneImage] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (post?.gadgetTag) {
      getCachedPhoneImage(null, post.gadgetTag).then(img => {
        if (mounted && img) setPhoneImage(img);
      }).catch(() => {});
    }
    return () => { mounted = false };
  }, [post?.gadgetTag]);

  const handleLike = async (e) => {
    e.preventDefault();
    if (!user) return;
    const ref = doc(db, "posts", post.id);
    
    if (isLiked) {
      await updateDoc(ref, { likes: arrayRemove(user.uid) });
      setLikeCount(c => c - 1);
    } else {
      await updateDoc(ref, { likes: arrayUnion(user.uid) });
      setLikeCount(c => c + 1);

      // 🟢 TAMBAHAN FITUR NOTIFIKASI LIKE
      // Notifikasi hanya dikirim jika yang me-like adalah orang lain (bukan pemilik postingan itu sendiri)
      if (post.authorId && post.authorId !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          toUid: post.authorId,                           // ID Pemilik postingan yang menerima notif
          fromUid: user.uid,                              // ID Kamu yang melakukan like
          fromName: user.displayName || user.email || "Seseorang", // Nama kamu yang bakal muncul di notif
          type: "like",                                   // Tipe notifikasi
          postId: post.id,                                // ID Postingan untuk dilempar pas diklik
          createdAt: serverTimestamp(),                   // Waktu real-time server Firebase
          read: false                                     // Status awal belum dibaca
        });
      }
    }
    setIsLiked(!isLiked);
  };

  const renderText = (text) => {
    if (!text) return null;
    const parts = text.split(/(#\w+|@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("#")) {
        return <Link key={i} to={`/brand/${part.slice(1)}`} className={styles.tagLink}>{part}</Link>;
      }
      if (part.startsWith("@")) {
        return <span key={i} className={styles.mention}>{part}</span>;
      }
      return part;
    });
  };

  return (
    <Link to={`/post/${post.id}`} className={styles.card}>
      <div className={styles.header}>
        <img
          src={post.authorPhoto || `https://ui-avatars.com/api/?name=${post.authorName}&background=3b82f6&color=fff`}
          className="avatar"
          alt={post.authorName}
        />
        <div className={styles.meta}>
          <Link to={`/profile/${post.authorId}`} className={styles.name} onClick={e => e.stopPropagation()}>
            {post.authorName}
          </Link>
          <span className={styles.time}>
            {post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : ""}
          </span>
        </div>
      </div>

      <p className={styles.body}>{renderText(post.text)}</p>

      {post.imageUrl && (
        <img src={post.imageUrl} className={styles.postImage} alt="post" />
      )}

      {post.gadgetTag && (
        <div className={styles.gadgetChip}>
          {phoneImage ? (
            <img src={phoneImage} alt={post.gadgetTag} className={styles.gadgetThumb} />
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-1 4h10z"/></svg>
          )}
          <Link to={`/gadget/${encodeURIComponent(post.gadgetTag)}`} onClick={e => e.stopPropagation()} className={styles.gadgetLink}>
            {post.gadgetTag}
          </Link>
        </div>
      )}

      <div className={styles.actions}>
        <button className={`${styles.likeBtn} ${isLiked ? styles.liked : ""}`} onClick={handleLike}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
        <span className={styles.commentCount}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          {post.commentCount || 0}
        </span>
      </div>
    </Link>
  );
}