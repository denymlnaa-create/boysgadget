import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Compose() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "posts"), {
        content: content,
        userId: user?.uid || "anonymous",
        userName: user?.displayName || "Sultan Muhammad",
        userPhoto: user?.photoURL || "",
        likesCount: 0,
        commentsCount: 0,
        createdAt: serverTimestamp()
      });
      navigate("/");
    } catch (err) {
      console.error("Gagal mengirim postingan:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px", color: "#fff", backgroundColor: "#1e1e1e", borderRadius: "8px", border: "1px solid #333" }}>
      
      {/* Top Header Menu */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "18px" }}>←</button>
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Buat Postingan</h3>
        <button 
          onClick={handlePost} 
          disabled={submitting || !content.trim()}
          style={{
            backgroundColor: content.trim() ? "#3b82f6" : "#2d2d2d",
            color: content.trim() ? "#fff" : "#666",
            border: "none",
            padding: "6px 16px",
            borderRadius: "6px",
            fontWeight: "700",
            cursor: content.trim() ? "pointer" : "default"
          }}
        >
          {submitting ? "Memuat..." : "Post"}
        </button>
      </div>

      {/* Input Text Area */}
      <textarea
        placeholder="Ceritain gadget kamu... gunakan #NamaGadget untuk tag gadget dan @username untuk mention"
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, 500))}
        style={{
          width: "100%",
          height: "150px",
          backgroundColor: "transparent",
          border: "none",
          color: "#fff",
          fontSize: "15px",
          resize: "none",
          outline: "none",
          lineHeight: "1.6"
        }}
      />

      {/* 🛠️ BARIS AKSESORI MEDIA (DIBERI GAP AGAR TIDAK DEMPET) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #2d2d2d", paddingTop: "14px" }}>
        
        {/* Kontainer Foto dengan Jarak Seimbang */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#aaa", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span style={{ fontSize: "14px", fontWeight: "500" }}>Foto</span>
        </div>

        <span style={{ fontSize: "12px", color: "#666" }}>{content.length}/500</span>
      </div>

      {/* Hint Tags Bawah */}
      <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
        <span style={{ backgroundColor: "#252526", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", color: "#aaa" }}>#Samsung #iPhone15 → tag gadget</span>
        <span style={{ backgroundColor: "#252526", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", color: "#aaa" }}>@username → mention pengguna</span>
      </div>

    </div>
  );
}