import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, limit, doc, updateDoc, arrayUnion, arrayRemove, addDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import ChatWidget from "../components/ChatWidget";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [topGadgets, setTopGadgets] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("trending");
  const [sidebarTab, setSidebarTab] = useState("kamera"); // State tab kategori untuk Top Skor Global

  const [currentSlide, setCurrentSlide] = useState(0);

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

  useEffect(() => {
    const gadgetRef = collection(db, "gadgets");
    // Mengambil data gadget agar pengurutan per kategori spek valid dan akurat
    const unsub = onSnapshot(gadgetRef, (snap) => {
      setTopGadgets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const articlesRef = collection(db, "articles");
    const q = query(articlesRef, orderBy("publishedAt", "desc"), limit(3));
    
    const unsub = onSnapshot(articlesRef, (snap) => {
      if (!snap.empty) {
        setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else {
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

  // Menjaga agar isi Carousel Hero teratas tetap merupakan Top 5 Global Score secara konisten
  const globalTop5 = [...topGadgets]
    .sort((a, b) => (b.scoreGlobal || 0) - (a.scoreGlobal || 0))
    .slice(0, 5);

  const carouselItems = globalTop5.length > 0 ? globalTop5 : [
    {
      name: "iPhone 15 Pro Max",
      brand: "Apple",
      imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=60",
      scoreGlobal: 154,
    },
    {
      name: "Galaxy S24 Ultra",
      brand: "Samsung",
      imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=60",
      scoreGlobal: 152,
    },
    {
      name: "Xiaomi 14 Ultra",
      brand: "Xiaomi",
      imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=60",
      scoreGlobal: 150,
    }
  ];

  // Logika pengurutan valid untuk Top 1-5 di Sidebar berdasarkan kategori spesifikasi teraktif
  const getSortedSidebarGadgets = () => {
    let scoreField = "scoreGlobal";
    if (sidebarTab === "kamera") scoreField = "scoreCamera";
    else if (sidebarTab === "performa") scoreField = "scorePerformance";
    else if (sidebarTab === "layar") scoreField = "scoreDisplay";
    else if (sidebarTab === "baterai") scoreField = "scoreBattery";

    return [...topGadgets]
      .filter(g => typeof g[scoreField] === "number")
      .sort((a, b) => (b[scoreField] || 0) - (a[scoreField] || 0))
      .slice(0, 5);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  const handleLikePost = async (e, post) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    const liked = post.likes?.includes(user.uid);
    const ref = doc(db, "posts", post.id);

    if (liked) {
      await updateDoc(ref, { likes: arrayRemove(user.uid), likesCount: increment(-1) });
    } else {
      await updateDoc(ref, { likes: arrayUnion(user.uid), likesCount: increment(1) });

      if (post.userId && post.userId !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          toUid: post.userId,
          fromUid: user.uid,
          fromName: user.displayName || user.email || "Seseorang",
          type: "like",
          postId: post.id,
          createdAt: serverTimestamp(),
          read: false
        });
      }
    }
  };

  if (loading) return <div className="spinner" />;

  const featuredGadget = carouselItems[currentSlide] || carouselItems[0];

  const gadgetCaption = featuredGadget.caption || 
    `${featuredGadget.name} merupakan perangkat flagship andalan dari ${featuredGadget.brand || 'Brand'} dengan total skor pengujian performa menyeluruh sebesar ${featuredGadget.scoreGlobal || 0} poin.`;

  return (
    <div style={{ width: "100%", padding: "20px 30px", color: "#fff", boxSizing: "border-box" }}>
      
      {/* Dynamic Auto-Carousel Hero Section */}
      <div style={{
        background: "linear-gradient(135deg, #111112 0%, #1c1c1f 100%)",
        borderRadius: "16px",
        padding: "45px 45px 55px 45px",
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

        {/* Konten Kiri (Informasi Gadget) */}
        <div style={{ flex: "1", minWidth: "320px", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <span style={{ backgroundColor: "#22c55e", color: "#fff", padding: "5px 14px", borderRadius: "30px", fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px" }}>
              🏆 SKOR TERTINGGI: {featuredGadget.scoreGlobal || 0} PTS
            </span>
            <span style={{ backgroundColor: "#252529", color: "#3b82f6", padding: "4px 12px", borderRadius: "30px", fontSize: "11px", fontWeight: "700", border: "1px solid rgba(59, 130, 246, 0.4)" }}>
              {String(featuredGadget.brand || "FLAGSHIP").toUpperCase()} CHOICE
            </span>
          </div>
          
          <h1 key={`title-${currentSlide}`} style={{ fontSize: "42px", fontWeight: "900", marginBottom: "16px", letterSpacing: "-0.5px", lineHeight: "1.2", animation: "fadeIn 0.5s ease-in-out" }}>
            {featuredGadget.name}
          </h1>
          
          <p key={`desc-${currentSlide}`} style={{ color: "#b3b3b3", fontSize: "15px", lineHeight: "1.7", marginBottom: "30px", maxWidth: "680px", minHeight: "50px", animation: "fadeIn 0.5s ease-in-out" }}>
            {gadgetCaption}
          </p>

          <div style={{ display: "flex", gap: "14px", marginBottom: "35px", flexWrap: "wrap" }}>
            <div style={{ backgroundColor: "#141416", border: "1px solid #2d2d30", padding: "12px 18px", borderRadius: "10px" }}>
              <span style={{ display: "block", fontSize: "10px", color: "#8e8e93", fontWeight: "700" }}>CAMERA</span>
              <span style={{ fontSize: "13px", color: "#eee", fontWeight: "600" }}>{featuredGadget.cameraFeature || "Pro-Grade Sensor"}</span>
            </div>
            <div style={{ backgroundColor: "#141416", border: "1px solid #2d2d30", padding: "12px 18px", borderRadius: "10px" }}>
              <span style={{ display: "block", fontSize: "10px", color: "#8e8e93", fontWeight: "700" }}>PERFORMANCE</span>
              <span style={{ fontSize: "13px", color: "#eee", fontWeight: "600" }}>{featuredGadget.performanceFeature || "Ultimate Gaming"}</span>
            </div>
            <div style={{ backgroundColor: "#141416", border: "1px solid #2d2d30", padding: "12px 18px", borderRadius: "10px" }}>
              <span style={{ display: "block", fontSize: "10px", color: "#8e8e93", fontWeight: "700" }}>BATTERY</span>
              <span style={{ fontSize: "13px", color: "#eee", fontWeight: "600" }}>{featuredGadget.batteryFeature || "Long-Lasting Life"}</span>
            </div>
          </div>

          <Link to={`/gadget/${encodeURIComponent(featuredGadget.name)}`} style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "14px 30px", borderRadius: "10px", textDecoration: "none", fontSize: "14px", fontWeight: "700", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", color: "#fff", boxShadow: "0 4px 18px rgba(59, 130, 246, 0.35)" }}>
            <span>Eksplor Spesifikasi & Review Lengkap</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </Link>
        </div>

        {/* Konten Kanan (Gambar) */}
        <div style={{ flex: "0 1 380px", display: "flex", justifyContent: "center", alignItems: "center", padding: "25px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.04)", height: "260px", zIndex: 1 }}>
          <img 
            key={`img-${currentSlide}`}
            src={featuredGadget.imageUrl} 
            alt={featuredGadget.name} 
            style={{ 
              maxHeight: "100%", 
              maxWidth: "100%", 
              objectFit: "contain", 
              filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.55))",
              animation: "fadeIn 0.5s ease-in-out"
            }} 
          />
        </div>

        {/* Indikator Titik Bawah */}
        {carouselItems.length > 1 && (
          <div style={{ position: "absolute", bottom: "20px", left: "45px", display: "flex", gap: "8px", zIndex: 2 }}>
            {carouselItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                style={{
                  width: idx === currentSlide ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  backgroundColor: idx === currentSlide ? "#3b82f6" : "#4b5563",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.3s ease"
                }}
              />
            ))}
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.97); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>

      {/* Grid Utama */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "30px", alignItems: "start" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
          
          <div>
            <div 
              onClick={() => navigate("/compose")}
              style={{ 
                backgroundColor: "#1e1e24", 
                padding: "20px", 
                borderRadius: "14px", 
                border: "1px solid #2d2d30", 
                marginBottom: "24px", 
                cursor: "pointer", 
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                transition: "border-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#3b82f6"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#2d2d30"}
            >
              <div style={{ 
                fontSize: "14px", 
                fontWeight: "700", 
                color: "#fff", 
                marginBottom: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <span style={{ color: "#3b82f6" }}></span> Mulai Diskusi Baru
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'Sultan'}&background=random`} alt="avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "1px solid #3c3c3e" }} />
                <div style={{ 
                  flex: 1, 
                  backgroundColor: "#141416", 
                  padding: "12px 16px", 
                  borderRadius: "10px", 
                  color: "#8e8e93", 
                  fontSize: "14px", 
                  border: "1px solid #2d2d30",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span>Apa tren gadget yang sedang Anda pikirkan, {user?.displayName ? user.displayName.split(" ")[0] : "Sultan"}?</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700" }}>Diskusi Terhangat</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setActiveTab("trending")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: activeTab === "trending" ? "#3b82f6" : "transparent", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Trending</button>
                <button onClick={() => setActiveTab("terbaru")} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", backgroundColor: activeTab === "terbaru" ? "#3b82f6" : "transparent", color: "#fff", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Terbaru</button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {posts.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", backgroundColor: "#1e1e1e", borderRadius: "8px", border: "1px solid #333", color: "#aaa" }}>
                  <p style={{ margin: 0, fontSize: "14px" }}>Belum ada diskusi hari ini.</p>
                </div>
              ) : (
                posts.map((post) => {
                  const isLiked = post.likes?.includes(user?.uid);
                  const likeCount = post.likesCount || 0;
                  return (
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
                        <div
                          onClick={(e) => handleLikePost(e, post)}
                          style={{ display: "flex", alignItems: "center", gap: "6px", cursor: user ? "pointer" : "default" }}
                        >
                          <svg width="16" height="16" fill={isLiked ? "#ef4444" : "none"} stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                          <span>{likeCount}</span>
                        </div>
                        <Link to={`/post/${post.id}`} style={{ display: "flex", alignItems: "center", gap: "6px", color: "#aaa", textDecoration: "none" }}>
                          <svg width="16" height="16" fill="none" stroke="#aaa" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                          <span>{post.commentsCount || 0}</span>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>Wawasan & Berita Gadget</span>
              </h3>
              <Link to="/news" style={{ color: "#3b82f6", textDecoration: "none", fontSize: "13px", fontWeight: "600" }}>Lihat Semua Berita →</Link>
            </div>

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
                  <div style={{ width: "100%", height: "140px", overflow: "hidden", backgroundColor: "#141416" }}>
                    <img src={article.imageUrl} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  
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

        {/* Sidebar Kanan */}
        <aside style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Card Top Skor Global dengan Tab Kategori */}
          <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "8px", border: "1px solid #333" }}>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", fontWeight: "700" }}>🏆 Top Skor Global</h4>
            <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#8e8e93" }}>Peringkat performa aspek spesifikasi</p>
            
            {/* Navigasi Tab Kategori Mikro */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "16px", borderBottom: "1px solid #2d2d30", paddingBottom: "8px", overflowX: "auto" }}>
              {[
                { id: "kamera", label: "Kamera" },
                { id: "performa", label: "Performa" },
                { id: "layar", label: "Layar" },
                { id: "baterai", label: "Baterai" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSidebarTab(tab.id)}
                  style={{
                    backgroundColor: sidebarTab === tab.id ? "#3b82f6" : "transparent",
                    color: sidebarTab === tab.id ? "#fff" : "#8e8e93",
                    border: "none",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List Item Peringkat 1-5 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {getSortedSidebarGadgets().length === 0 ? (
                <p style={{ margin: 0, fontSize: "13px", color: "#8e8e93", textAlign: "center", padding: "8px 0" }}>
                  Belum ada data skor untuk kategori ini.
                </p>
              ) : (
                getSortedSidebarGadgets().map((gadget, index, arr) => {
                  let scoreField = "scoreGlobal";
                  if (sidebarTab === "kamera") scoreField = "scoreCamera";
                  else if (sidebarTab === "performa") scoreField = "scorePerformance";
                  else if (sidebarTab === "layar") scoreField = "scoreDisplay";
                  else if (sidebarTab === "baterai") scoreField = "scoreBattery";

                  return (
                    <div key={gadget.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: index !== arr.length - 1 ? "1px solid #2d2d2d" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontWeight: "700", color: index === 0 ? "#eab308" : index === 1 ? "#cbd5e1" : index === 2 ? "#cd7f32" : "#fff" }}>#{index + 1}</span>
                        <Link to={`/gadget/${encodeURIComponent(gadget.name)}`} style={{ textDecoration: "none", color: "#fff", fontSize: "13px" }}>{gadget.name}</Link>
                      </div>
                      <span style={{ backgroundColor: "#3b82f6", padding: "2px 8px", borderRadius: "4px", fontSize: "11px" }}>{gadget[scoreField]}</span>
                    </div>
                  );
                })
              )}
              
              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <Link to="/leaderboard" style={{ textDecoration: "none", color: "#3b82f6", fontSize: "13px", fontWeight: "600" }}>
                  Lihat Semua Top Skor Global →
                </Link>
              </div>
            </div>
          </div>

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
      <ChatWidget />
    </div>
  );
}