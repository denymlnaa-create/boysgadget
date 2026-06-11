import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [topGadgets, setTopGadgets] = useState([]);
  const [articles, setArticles] = useState([]); // State untuk menampung berita
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("trending");

  // Fetch Post Diskusi
  useEffect(() => {
    const postsRef = collection(db, "posts");
    let q = query(postsRef, orderBy("createdAt", "desc"));
    if (activeTab === "trending") {
      q = query(postsRef, orderBy("likesCount", "desc"));
    }

    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Error fetch posts:", err);
      setLoading(false);
    });

    return unsub;
  }, [activeTab]);

  // Fetch Peringkat Gadget Top 5
  useEffect(() => {
    const gadgetRef = collection(db, "gadgets");
    const q = query(gadgetRef, orderBy("scoreGlobal", "desc"), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setTopGadgets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  // Fetch Berita Gadget Terbaru (Limit 3 atau 4 untuk ditaruh di home)
  useEffect(() => {
    const articlesRef = collection(db, "articles"); // Koleksi firestore baru
    const q = query(articlesRef, orderBy("publishedAt", "desc"), limit(3));
    
    const unsub = onSnapshot(articlesRef, (snap) => {
      if (!snap.empty) {
        setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
        // Mock data otomatis jika koleksi 'articles' di Firestore kamu masih kosong
        setArticles([
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
        ]);
      }
    });
    return unsub;
  }, []);

  if (loading) return <div className="spinner" />;

  const featuredGadget = topGadgets[0] || {
    name: "iPhone 15 Pro Max",
    brand: "Apple",
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=60",
    scoreGlobal: 154,
  };

  const gadgetCaption = featuredGadget.caption || 
    `${featuredGadget.name} merupakan perangkat flagship andalan dari ${featuredGadget.brand} dengan total skor pengujian performa menyeluruh sebesar ${featuredGadget.scoreGlobal} poin.`;

  return (
    <div style={{ width: "100%", padding: "20px 30px", color: "#fff", boxSizing: "border-box" }}>
      
      {/* HERO BANNER */}
      <div style={{
        background: "linear-gradient(135deg, #111112 0%, #1c1c1f 100%)",
        borderRadius: "16px",
        padding: "45px",
        marginBottom: "35px",
        border: "1px solid #2d2d30",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "40px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
      }}>
        <div style={{ position: "absolute", top: "-20%", right: "-5%", width: "450px", height: "450px", background: "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ flex: "1", minWidth: "320px", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ backgroundColor: "#22c55e", color: "#fff", padding: "5px 14px", borderRadius: "30px", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px" }}>
              🏆 SKOR TERTINGGI: {featuredGadget.scoreGlobal} PTS
            </span>
            <span style={{ backgroundColor: "#252529", color: "#3b82f6", padding: "4px 12px", borderRadius: "30px", fontSize: "11px", fontWeight: "700", border: "1px solid rgba(59, 130, 246, 0.4)" }}>
              {featuredGadget.brand?.toUpperCase()} FLAGSHIP CHOICE
            </span>
          </div>
          
          <h1 style={{ fontSize: "42px", fontWeight: "900", marginBottom: "16px", letterSpacing: "-0.5px", lineHeight: "1.2" }}>
            {featuredGadget.name}
          </h1>
          
          <p style={{ color: "#b3b3b3", fontSize: "15px", lineHeight: "1.7", marginBottom: "30px", maxWidth: "680px" }}>
            {gadgetCaption}
          </p>

          <div style={{ display: "flex", gap: "14px", marginBottom: "35px", flexWrap: "wrap" }}>
            <div style={{ backgroundColor: "#141416", border: "1px solid #2d2d30", padding: "12px 18px", borderRadius: "10px" }}>
              <span style={{ display: "block", fontSize: "10px", color: "#8e8e93", fontWeight: "700" }}>CAMERA</span>
              <span style={{ fontSize: "13px", color: "#eee", fontWeight: "600" }}>Pro-Grade Sensor</span>
            </div>
            <div style={{ backgroundColor: "#141416", border: "1px solid #2d2d30", padding: "12px 18px", borderRadius: "10px" }}>
              <span style={{ display: "block", fontSize: "10px", color: "#8e8e93", fontWeight: "700" }}>PERFORMANCE</span>
              <span style={{ fontSize: "13px", color: "#eee", fontWeight: "600" }}>Ultimate Gaming</span>
            </div>
            <div style={{ backgroundColor: "#141416", border: "1px solid #2d2d30", padding: "12px 18px", borderRadius: "10px" }}>
              <span style={{ display: "block", fontSize: "10px", color: "#8e8e93", fontWeight: "700" }}>BATTERY</span>
              <span style={{ fontSize: "13px", color: "#eee", fontWeight: "600" }}>Long-Lasting Life</span>
            </div>
          </div>

          <Link to={`/gadget/${encodeURIComponent(featuredGadget.name)}`} style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "14px 30px", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: "700", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", color: "#fff", boxShadow: "0 4px 18px rgba(59, 130, 246, 0.35)" }}>
            <span>Eksplor Spesifikasi & Review Lengkap</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </Link>
        </div>

        <div style={{ flex: "0 1 380px", display: "flex", justifyContent: "center", alignItems: "center", padding: "25px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.04)", height: "260px" }}>
          <img src={featuredGadget.imageUrl} alt={featuredGadget.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.55))" }} />
        </div>
      </div>

      {/* LAYOUT GRID UTAMA BARIS BAWAH */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "30px", alignItems: "start" }}>
        
        {/* KOLOM KIRI (DISKUSI & BERITA) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          
          {/* SECTION DISKUSI */}
          <div>
            {/* KOTAK BUAT POSTINGAN */}
            <div 
              onClick={() => navigate("/compose")}
              style={{ backgroundColor: "#1e1e1e", padding: "16px", borderRadius: "8px", border: "1px solid #333", marginBottom: "24px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}
            >
              <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'Sultan'}&background=random`} alt="avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
              <div style={{ flex: 1, backgroundColor: "#252526", padding: "11px 16px", borderRadius: "25px", color: "#8e8e93", fontSize: "14px", border: "1px solid #3c3c3e" }}>
                Apa yang Anda pikirkan, {user?.displayName ? user.displayName.split(" ")[0] : "Sultan"}?
              </div>
            </div>

            {/* FILTER TAB DISKUSI */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700" }}>Diskusi Terhangat</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setActiveTab("trending")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: activeTab === "trending" ? "#3b82f6" : "transparent", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Trending</button>
                <button onClick={() => setActiveTab("terbaru")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: activeTab === "terbaru" ? "#3b82f6" : "transparent", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Terbaru</button>
              </div>
            </div>

            {/* LIST DISKUSI COMPONENT */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {posts.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", backgroundColor: "#1e1e1e", borderRadius: "8px", border: "1px solid #333", color: "#aaa" }}>
                  <p style={{ margin: 0, fontSize: "14px" }}>Belum ada diskusi hari ini.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} style={{ backgroundColor: "#1e1e1e", padding: "16px", borderRadius: "8px", border: "1px solid #333" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <img src={post.userPhoto || `https://ui-avatars.com/api/?name=${post.userName}&background=random`} alt="avatar" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                      <div>
                        <h5 style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>{post.userName}</h5>
                        <span style={{ fontSize: "11px", color: "#aaa" }}>
                          {post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : "Baru saja"}
                        </span>
                      </div>
                    </div>
                    <Link to={`/post/${post.id}`} style={{ textDecoration: "none", color: "#fff" }}>
                      <p style={{ fontSize: "14px", lineHeight: "1.5", marginBottom: "14px", color: "#eee" }}>{post.content}</p>
                    </Link>
                    <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#aaa" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="16" height="16" fill="#ef4444" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        <span>{post.likesCount || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* NEW SECTION: BERITA SEPUTAR GADGET (DIBAWAH MENU DISKUSI) */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>Wawasan & Berita Gadget</span>
              </h3>
              <Link to="/news" style={{ color: "#3b82f6", textDecoration: "none", fontSize: "13px", fontWeight: "600" }}>Lihat Semua Berita →</Link>
            </div>

            {/* Grid Berita Berdampingan */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
              {articles.map((article) => (
                <div 
                  key={article.id}
                  onClick={() => navigate(`/news/${article.id}`)}
                  style={{
                    backgroundColor: "#1e1e1e",
                    borderRadius: "12px",
                    border: "1px solid #2d2d30",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, border-color 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.borderColor = "#3b82f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "#2d2d30";
                  }}
                >
                  {/* Foto Sampul Berita */}
                  <div style={{ width: "100%", height: "140px", overflow: "hidden", backgroundColor: "#141416" }}>
                    <img src={article.imageUrl} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  
                  {/* Detail Konten Singkat */}
                  <div style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ 
                        backgroundColor: article.category === "Rumor" ? "rgba(234, 179, 8, 0.15)" : article.category === "Rilis" ? "rgba(34, 197, 94, 0.15)" : "rgba(59, 130, 246, 0.15)",
                        color: article.category === "Rumor" ? "#eab308" : article.category === "Rilis" ? "#22c55e" : "#3b82f6",
                        padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" 
                      }}>
                        {article.category}
                      </span>
                      <span style={{ fontSize: "11px", color: "#8e8e93" }}>{article.publishedAt}</span>
                    </div>
                    
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "700", lineHeight: "1.4", color: "#fff", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {article.title}
                    </h4>
                    
                    <p style={{ margin: 0, fontSize: "12px", color: "#a1a1aa", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {article.excerpt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* KOLOM KANAN (SIDEBAR) */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* TOP SKOR GLOBAL */}
          <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "8px", border: "1px solid #333" }}>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "700" }}>🏆 Top Skor Global</h4>
            <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#8e8e93" }}>Peringkat performa menyeluruh</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {topGadgets.slice(0, 3).map((gadget, index) => (
                <div key={gadget.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: index !== 2 ? "1px solid #2d2d2d" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: "700", color: index === 0 ? "#eab308" : index === 1 ? "#cbd5e1" : "#fff" }}>#{index + 1}</span>
                    <Link to={`/gadget/${encodeURIComponent(gadget.name)}`} style={{ textDecoration: "none", color: "#fff", fontSize: "13px" }}>{gadget.name}</Link>
                  </div>
                  <span style={{ backgroundColor: "#3b82f6", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>{gadget.scoreGlobal || 0}</span>
                </div>
              ))}
              <div style={{ textAlign: "center", marginTop: "8px" }}>
                <Link to="/ranking" style={{ textDecoration: "none", color: "#3b82f6", fontSize: "13px", fontWeight: "600" }}>Lihat Semua Peringkat →</Link>
              </div>
            </div>
          </div>

          {/* TELUSURI BRAND */}
          <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "8px", border: "1px solid #333" }}>
            <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700" }}>🏷️ Telusuri Brand</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {["Apple", "Samsung", "Xiaomi", "Oppo", "Vivo", "Asus"].map((brand) => (
                <button key={brand} onClick={() => navigate(`/search?brand=${brand}`)} style={{ backgroundColor: "#252526", color: "#fff", border: "1px solid #3c3c3e", padding: "6px 12px", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}>
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}