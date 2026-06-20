import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  doc, getDoc, collection, addDoc, onSnapshot,
  query, orderBy, serverTimestamp, updateDoc, increment,
  arrayUnion, arrayRemove
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";
import styles from "./PostDetail.module.css";

function renderText(text) {
  if (!text) return null;
  return text.split(/(#\w+|@\w+)/g).map((part, i) => {
    if (part.startsWith("#")) return <Link key={i} to={`/brand/${part.slice(1)}`} style={{color:"var(--accent)",fontWeight:500}}>{part}</Link>;
    if (part.startsWith("@")) return <span key={i} style={{color:"#60a5fa",fontWeight:500}}>{part}</span>;
    return part;
  });
}

function Comment({ comment, postId, depth = 0 }) {
  const { user } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "posts", postId, "comments", comment.id, "replies"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      setReplies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [postId, comment.id]);

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setLoading(true);
    await addDoc(collection(db, "posts", postId, "comments", comment.id, "replies"), {
      text: replyText.trim(),
      authorId: user.uid,
      authorName: user.displayName || user.email,
      authorPhoto: user.photoURL || "",
      createdAt: serverTimestamp()
    });

    // 🟢 TAMBAHAN 1: Kirim notifikasi BALASAN KOMENTAR (Reply)
    // Notifikasi hanya dikirim jika yang membalas adalah orang lain (bukan pemilik komentar itu sendiri)
    if (comment.authorId && comment.authorId !== user.uid) {
      await addDoc(collection(db, "notifications"), {
        toUid: comment.authorId,                                 // ID Pemilik komentar utama
        fromUid: user.uid,                                       // ID Kamu yang membalas
        fromName: user.displayName || user.email || "Seseorang", // Nama kamu
        type: "reply",                                           // Tipe balasan komentar
        postId: postId,                                          // ID Postingan agar pas diklik lari ke sini
        createdAt: serverTimestamp(),
        read: false
      });
    }

    setReplyText(""); setShowReply(false); setLoading(false);
  };

  return (
    <div className={styles.comment} style={{ marginLeft: depth > 0 ? 36 : 0 }}>
      <img
        src={comment.authorPhoto || `https://ui-avatars.com/api/?name=${comment.authorName}&background=3b82f6&color=fff`}
        className="avatar" style={{width:32,height:32}} alt={comment.authorName}
      />
      <div className={styles.commentBody}>
        <div className={styles.commentMeta}>
          <span className={styles.commentName}>{comment.authorName}</span>
          <span className={styles.commentTime}>
            {comment.createdAt?.toDate ? new Date(comment.createdAt.toDate()).toLocaleDateString("id-ID", {day:"numeric",month:"short"}) : ""}
          </span>
        </div>
        <p className={styles.commentText}>{renderText(comment.text)}</p>
        {depth < 2 && (
          <button className={styles.replyBtn} onClick={() => setShowReply(!showReply)}>
            Balas
          </button>
        )}
        {showReply && (
          <div className={styles.replyBox}>
            <input
              placeholder="Tulis balasan..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitReply(); }}}
            />
            <button className="btn-primary" style={{padding:"7px 14px",fontSize:13}} onClick={submitReply} disabled={loading}>
              {loading ? "..." : "Kirim"}
            </button>
          </div>
        )}
        {replies.map(r => <Comment key={r.id} comment={r} postId={postId} depth={depth + 1} />)}
      </div>
    </div>
  );
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    getDoc(doc(db, "posts", id)).then(d => {
      if (d.exists()) {
        const data = { id: d.id, ...d.data() };
        setPost(data);
        setLikeCount(data.likesCount || 0);
        setIsLiked(data.likes?.includes(user?.uid) || false);
      }
    });
    const q = query(collection(db, "posts", id, "comments"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [id, user?.uid]);

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setLoading(true);
    await addDoc(collection(db, "posts", id, "comments"), {
      text: commentText.trim(),
      authorId: user.uid,
      authorName: user.displayName || user.email,
      authorPhoto: user.photoURL || "",
      createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, "posts", id), { commentsCount: increment(1) });

    // 🟢 TAMBAHAN 2: Kirim notifikasi KOMENTAR BARU (Comment)
    // Notifikasi hanya dikirim jika yang berkomentar adalah orang lain (bukan pemilik postingan itu sendiri)
    if (post && post.userId && post.userId !== user.uid) {
      await addDoc(collection(db, "notifications"), {
        toUid: post.userId,                                      // ID Pemilik postingan asli
        fromUid: user.uid,                                       // ID Kamu yang ngasih komentar
        fromName: user.displayName || user.email || "Seseorang", // Nama kamu
        type: "comment",                                         // Tipe komentar
        postId: id,                                              // ID Postingan
        createdAt: serverTimestamp(),
        read: false
      });
    }

    setCommentText(""); setLoading(false);
  };

  const handleLike = async (e) => {
    e.preventDefault();
    if (!user) return;
    const ref = doc(db, "posts", id);

    if (isLiked) {
      await updateDoc(ref, { likes: arrayRemove(user.uid), likesCount: increment(-1) });
      setLikeCount(c => c - 1);
    } else {
      await updateDoc(ref, { likes: arrayUnion(user.uid), likesCount: increment(1) });
      setLikeCount(c => c + 1);

      // 🟢 TAMBAHAN FITUR NOTIFIKASI LIKE (logic identik dengan PostCard.jsx)
      // Notifikasi hanya dikirim jika yang me-like adalah orang lain (bukan pemilik postingan itu sendiri)
      if (post.userId && post.userId !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          toUid: post.userId,
          fromUid: user.uid,
          fromName: user.displayName || user.email || "Seseorang",
          type: "like",
          postId: id,
          createdAt: serverTimestamp(),
          read: false
        });
      }
    }
    setIsLiked(!isLiked);
  };

  if (!post) return <div className="spinner" />;

  return (
    <div className="page">
      <button className="btn-ghost" onClick={() => navigate(-1)} style={{marginBottom:12}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Kembali
      </button>

      <div className={styles.postWrap}>
        <div className={styles.postHeader}>
          <img
            src={post.userPhoto || `https://ui-avatars.com/api/?name=${post.userName}&background=3b82f6&color=fff`}
            className="avatar" alt={post.userName}
          />
          <div>
            <Link to={`/profile/${post.userId}`} className={styles.postAuthor}>{post.userName}</Link>
            <p className={styles.postTime}>
              {post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleString("id-ID") : ""}
            </p>
          </div>
        </div>

        <p className={styles.postText}>{renderText(post.content)}</p>

        {post.imageUrl && <img src={post.imageUrl} className={styles.postImg} alt="post" />}

        {post.gadgetTag && (
          <Link to={`/gadget/${encodeURIComponent(post.gadgetTag)}`} className={styles.gadgetChip}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8l-1 4h10z"/></svg>
            {post.gadgetTag}
          </Link>
        )}

        <button
          onClick={handleLike}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "14px",
            background: "none",
            border: "none",
            cursor: user ? "pointer" : "default",
            color: isLiked ? "#ef4444" : "var(--text2)",
            fontSize: "13px",
            padding: 0
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          <span>{likeCount}</span>
        </button>
      </div>

      <hr className="divider" />

      <div className={styles.commentInput}>
        <img
          src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || user?.email}&background=3b82f6&color=fff`}
          className="avatar" style={{width:32,height:32}} alt="you"
        />
        <input
          placeholder="Tulis komentar..."
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); }}}
        />
        <button className="btn-primary" style={{padding:"7px 14px",fontSize:13,whiteSpace:"nowrap"}} onClick={submitComment} disabled={loading || !commentText.trim()}>
          {loading ? "..." : "Kirim"}
        </button>
      </div>

      <div className={styles.comments}>
        {comments.length === 0
          ? <p style={{color:"var(--text2)",fontSize:14,padding:"20px 0"}}>Belum ada komentar.</p>
          : comments.map(c => <Comment key={c.id} comment={c} postId={id} />)
        }
      </div>
    </div>
  );
}