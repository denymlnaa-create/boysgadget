import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const FALLBACK_ARTICLES = {
  "news-1": {
    id: "news-1",
    title: "Bocoran Desain Terbaru Lini Flagship Generasi Mendatang, Bezel Kian Tipis!",
    category: "Rumor",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=60",
    publishedAt: "10 Jun 2026",
    excerpt: "Informasi internal pemasok layar mengonfirmasi adanya pemangkasan ketebalan bezel hingga 1.2mm menggunakan teknologi fabrikasi teranyar...",
    content: `Informasi internal dari sejumlah pemasok layar terkemuka mengonfirmasi adanya pemangkasan ketebalan bezel hingga 1.2mm menggunakan teknologi fabrikasi teranyar yang belum pernah digunakan sebelumnya di segmen smartphone konsumen.

Sumber yang enggan disebutkan namanya menyebut bahwa teknologi ini memungkinkan panel layar dipasang langsung ke rangka logam tanpa lapisan perekat tambahan, sehingga menghasilkan tampilan yang jauh lebih bersih dan modern.

Desain baru ini diperkirakan akan debut pada lini flagship generasi mendatang yang dijadwalkan meluncur di paruh kedua tahun ini. Beberapa render yang beredar menunjukkan rasio layar ke bodi yang mendekati 95%, sebuah pencapaian baru di industri.

Para analis memperkirakan perubahan desain ini akan menjadi standar baru industri dalam dua tahun ke depan, mengingat biaya produksi yang semakin terjangkau seiring matangnya teknologi tersebut.`
  },
  "news-2": {
    id: "news-2",
    title: "Chipset Fabrikasi 3nm Generasi Kedua Mulai Masuki Tahap Produksi Massal",
    category: "Teknologi",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=60",
    publishedAt: "09 Jun 2026",
    excerpt: "Fabrikasi chipset terbaru ini dijanjikan bakal membawa efisiensi daya hingga 25% jauh lebih hemat dibandingkan pendahulunya...",
    content: `Fabrikasi chipset terbaru generasi kedua berbasis proses 3nm kini resmi memasuki tahap produksi massal, menandai babak baru dalam efisiensi daya perangkat mobile.

Dibandingkan generasi sebelumnya, chipset baru ini diklaim mampu menghadirkan efisiensi daya hingga 25% lebih hemat sambil mempertahankan performa puncak yang sama. Hal ini dimungkinkan berkat peningkatan pada arsitektur transistor dan optimasi jalur sinyal internal.

Produsen chipset terkemuka telah memulai pengiriman sampel kepada mitra OEM pilihan, dengan produksi penuh diperkirakan mencapai kapasitas maksimal pada kuartal ketiga tahun ini.

Dampak langsung yang paling terasa bagi konsumen adalah daya tahan baterai yang lebih lama dan performa gaming yang lebih konsisten tanpa throttling berlebihan. Smartphone berbasis chipset ini diperkirakan mulai hadir di pasar menjelang akhir tahun.`
  },
  "news-3": {
    id: "news-3",
    title: "Resmi Meluncur! Sensor Kamera HP 200MP Kini Dibekali AI Tracking Lebih Akurat",
    category: "Rilis",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60",
    publishedAt: "08 Jun 2026",
    excerpt: "Kemampuan computational photography terupdate memungkinkan pengambilan gambar low-light instan tanpa adanya delay rana kamera.",
    content: `Sensor kamera smartphone 200MP terbaru kini resmi diluncurkan dengan fitur unggulan berupa AI Tracking yang diklaim jauh lebih akurat dibandingkan generasi sebelumnya.

Kemampuan computational photography yang terupdate memungkinkan pengambilan gambar low-light secara instan tanpa adanya delay rana kamera yang selama ini menjadi keluhan pengguna. Sensor ini menggunakan teknologi pixel binning 16-in-1 yang menghasilkan foto efektif 12.5MP dengan detail luar biasa di kondisi cahaya rendah.

Fitur AI Tracking yang disempurnakan kini mampu mengenali dan mengikuti subjek bergerak dengan akurasi hingga 98%, termasuk dalam kondisi pencahayaan yang menantang seperti konser atau olahraga malam hari.

Sensor ini akan mulai hadir di smartphone flagship dari berbagai merek ternama mulai kuartal ini, dengan harga perangkat yang diperkirakan berada di kisaran premium namun lebih terjangkau dari sebelumnya.`
  }
};

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        // Coba fetch dari Firestore dulu
        const docRef = doc(db, "articles", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() });
        } else if (FALLBACK_ARTICLES[id]) {
          // Kalau tidak ada di Firestore, pakai fallback hardcoded
          setArticle(FALLBACK_ARTICLES[id]);
        } else {
          setArticle(null);
        }
      } catch (err) {
        console.error("Gagal memuat artikel:", err);
        // Kalau error Firestore (misal offline), tetap coba fallback
        if (FALLBACK_ARTICLES[id]) {
          setArticle(FALLBACK_ARTICLES[id]);
        }
      }
      setLoading(false);
    };

    fetchArticle();
  }, [id]);

  if (loading) return <div className="spinner" />;

  if (!article) return (
    <div style={{ padding: "40px", color: "#fff", maxWidth: "800px", margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={{ background: "transparent", border: "1px solid #333", color: "#aaa", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", marginBottom: "20px" }}>← Kembali</button>
      <p style={{ color: "#aaa" }}>Artikel tidak ditemukan.</p>
    </div>
  );

  const categoryColor = article.category === "Rumor" ? "#eab308" : article.category === "Rilis" ? "#22c55e" : "#3b82f6";
  const categoryBg = article.category === "Rumor" ? "rgba(234,179,8,0.15)" : article.category === "Rilis" ? "rgba(34,197,94,0.15)" : "rgba(59,130,246,0.15)";

  return (
    <div style={{ padding: "40px 30px", color: "#fff", maxWidth: "800px", margin: "0 auto", boxSizing: "border-box" }}>
      <button onClick={() => navigate(-1)} style={{ background: "transparent", border: "1px solid #333", color: "#aaa", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", marginBottom: "30px" }}>← Kembali</button>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <span style={{ backgroundColor: categoryBg, color: categoryColor, padding: "4px 10px", borderRadius: "4px", fontSize: "12px", fontWeight: "700" }}>
          {article.category}
        </span>
        <span style={{ fontSize: "13px", color: "#8e8e93" }}>{article.publishedAt}</span>
      </div>

      <h1 style={{ fontSize: "28px", fontWeight: "800", lineHeight: "1.3", marginBottom: "20px" }}>{article.title}</h1>

      {article.imageUrl && (
        <img
          src={article.imageUrl}
          alt={article.title}
          style={{ width: "100%", height: "360px", objectFit: "cover", borderRadius: "12px", marginBottom: "28px" }}
        />
      )}

      <div style={{ fontSize: "15px", lineHeight: "1.8", color: "#d1d1d1" }}>
        {(article.content || article.excerpt || "").split("\n\n").map((paragraph, i) => (
          <p key={i} style={{ marginBottom: "20px" }}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
}