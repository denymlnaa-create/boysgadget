    import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function News() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const articlesRef = collection(db, "articles");
    const q = query(articlesRef, orderBy("publishedAt", "desc"));
    
    const unsub = onSnapshot(articlesRef, (snap) => {
      if (!snap.empty) {
        setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        // Fallback data
        setArticles([
          { id: "news-1", title: "Bocoran Desain Terbaru Lini Flagship", category: "Rumor", imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500", publishedAt: "10 Jun 2026", excerpt: "Informasi internal pemasok layar..." },
          { id: "news-2", title: "Chipset Fabrikasi 3nm Produksi Massal", category: "Teknologi", imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500", publishedAt: "09 Jun 2026", excerpt: "Fabrikasi chipset terbaru..." }
        ]);
      }
    });
    return unsub;
  }, []);

  return (
    <div style={{ width: "100%", padding: "40px 30px", color: "#fff", boxSizing: "border-box" }}>
      <button onClick={() => navigate(-1)} style={{ background: "#252526", border: "1px solid #333", color: "#fff", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", marginBottom: "20px" }}>← Kembali</button>
      <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "30px" }}>Portal Berita Gadget</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "25px" }}>
        {articles.map((article) => (
          <div key={article.id} onClick={() => navigate(`/news/${article.id}`)} style={{ backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px solid #2d2d30", overflow: "hidden", cursor: "pointer" }}>
            <img src={article.imageUrl} alt={article.title} style={{ width: "100%", height: "180px", objectFit: "cover" }} />
            <div style={{ padding: "20px" }}>
              <span style={{ color: "#3b82f6", fontSize: "11px", fontWeight: "700" }}>{article.category}</span>
              <h4 style={{ margin: "10px 0", fontSize: "16px" }}>{article.title}</h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}