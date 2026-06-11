import { useParams, useNavigate } from "react-router-dom";

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ padding: "40px", color: "#fff", maxWidth: "800px", margin: "0 auto" }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ 
          background: "transparent", 
          border: "1px solid #333", 
          color: "#aaa", 
          padding: "8px 16px", 
          borderRadius: "6px", 
          cursor: "pointer", 
          marginBottom: "20px" 
        }}
      >
        ← Kembali
      </button>
      
      <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>Detail Berita</h1>
      <p style={{ color: "#aaa" }}>
        Sedang memuat konten untuk ID Berita: <strong>{id}</strong>
      </p>
      {/* Nanti di sini kamu bisa tambah logika fetch data berita dari Firestore berdasarkan ID */}
    </div>
  );
}