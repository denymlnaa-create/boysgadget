import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const FALLBACK_ARTICLES = [
  {
    id: "news-1",
    title: "Bocoran Desain Terbaru Lini Flagship Generasi Mendatang, Bezel Kian Tipis!",
    category: "Rumor",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=60",
    publishedAt: "10 Jun 2026",
    excerpt: "Informasi internal pemasok layar mengonfirmasi adanya pemangkasan ketebalan bezel hingga 1.2mm menggunakan teknologi fabrikasi teranyar..."
  },
  {
    id: "news-2",
    title: "Chipset Fabrikasi 3nm Generasi Kedua Mulai Masuki Tahap Produksi Massal",
    category: "Teknologi",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60",
    publishedAt: "09 Jun 2026",
    excerpt: "Fabrikasi chipset terbaru ini dijanjikan bakal membawa efisiensi daya hingga 25% jauh lebih hemat dibandingkan pendahulunya..."
  },
  {
    id: "news-3",
    title: "Resmi Meluncur! Sensor Kamera HP 200MP Kini Dibekali AI Tracking Lebih Akurat",
    category: "Rilis",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60",
    publishedAt: "08 Jun 2026",
    excerpt: "Kemampuan computational photography terupdate memungkinkan pengambilan gambar low-light instan tanpa adanya delay rana kamera."
  }
];

export default function News() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const articlesRef = collection(db, "articles");
    const q = query(articlesRef, orderBy("publishedAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        setArticles(FALLBACK_ARTICLES);
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