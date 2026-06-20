import { useState, useRef } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Compose() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      // Catatan: Jika ingin menyimpan file ke Storage, proses upload imageFile diletakkan di sini.
      // Untuk saat ini, struktur data post tetap dijaga agar tidak merusak database Anda.
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
    <div style={{ maxWidth: "660px", margin: "40px auto", padding: "30px", color: "#fff", backgroundColor: "#111112", borderRadius: "16px", border: "1px solid #2d2d30", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
      
      {/* Top Header Menu */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px", borderBottom: "1px solid #2d2d30", paddingBottom: "16px" }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: "#1e1e24", border: "1px solid #2d2d30", color: "#fff", cursor: "pointer", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "0.2s" }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "#3b82f6"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "#2d2d30"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", letterSpacing: "-0.5px" }}>Buat Postingan</h3>
        <button 
          onClick={handlePost} 
          disabled={submitting || !content.trim()}
          style={{
            background: content.trim() ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" : "#252529",
            color: content.trim() ? "#fff" : "#52525b",
            border: content.trim() ? "none" : "1px solid #2d2d30",
            padding: "8px 20px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "14px",
            cursor: content.trim() ? "pointer" : "default",
            boxShadow: content.trim() ? "0 4px 14px rgba(59, 130, 246, 0.3)" : "none"
          }}
        >
          {submitting ? "Memuat..." : "Post"}
        </button>
      </div>

      {/* Profil Singkat Pengguna */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'Sultan'}&background=random`} alt="avatar" style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover", border: "1px solid #3c3c3e" }} />
        <div>
          <h5 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>{user?.displayName || "Sultan Muhammad"}</h5>
          <span style={{ fontSize: "11px", color: "#3b82f6", fontWeight: "600", backgroundColor: "rgba(59, 130, 246, 0.1)", padding: "2px 8px", borderRadius: "4px", marginTop: "2px", display: "inline-block" }}>Gadget Enthusiast</span>
        </div>
      </div>

      {/* Input Text Area */}
      <textarea
        placeholder="Apa yang anda pikirkan?"
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, 500))}
        style={{
          width: "100%",
          height: "160px",
          backgroundColor: "transparent",
          border: "none",
          color: "#eee",
          fontSize: "15px",
          resize: "none",
          outline: "none",
          lineHeight: "1.6",
          padding: "0"
        }}
      />

      {/* Preview Image Box */}
      {imagePreview && (
        <div style={{ position: "relative", width: "100%", borderRadius: "12px", overflow: "hidden", marginBottom: "20px", border: "1px solid #2d2d30", backgroundColor: "#141416" }}>
          <img src={imagePreview} alt="Preview Upload" style={{ width: "100%", maxHeight: "350px", objectFit: "contain", display: "block", margin: "0 auto" }} />
          <button 
            onClick={handleRemoveImage}
            style={{ position: "absolute", top: "12px", right: "12px", backgroundColor: "rgba(0, 0, 0, 0.75)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "50%", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Input File Tersembunyi */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        style={{ display: "none" }} 
      />

      {/* Baris Aksesori Media */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #2d2d30", paddingTop: "16px" }}>
        
        {/* Tombol Pemicu Galeri */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{ display: "flex", alignItems: "center", gap: "8px", color: "#3b82f6", backgroundColor: "rgba(59, 130, 246, 0.08)", padding: "10px 18px", borderRadius: "10px", border: "1px solid rgba(59, 130, 246, 0.2)", cursor: "pointer", transition: "0.2s" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.15)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.08)"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" ry="3"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span style={{ fontSize: "14px", fontWeight: "700" }}>Tambah Foto</span>
        </div>

        <span style={{ fontSize: "13px", color: content.length >= 450 ? "#ef4444" : "#8e8e93", fontWeight: "600" }}>
          {content.length}/500
        </span>
      </div>
    </div>
  );
}