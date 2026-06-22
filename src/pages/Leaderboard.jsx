import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import { getCachedPhoneImage } from "../utils/imageUtils";

export default function Leaderboard() {
  const [gadgets, setGadgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("scoreGlobal");
  const [imageMap, setImageMap] = useState({});

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, "gadgets"), orderBy(activeTab, "desc"));
        const snap = await getDocs(q);
        setGadgets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Gagal mengambil data peringkat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab]);

  useEffect(() => {
    let mounted = true;
    if (gadgets.length === 0) return;
    Promise.all(gadgets.map(g => getCachedPhoneImage(g.brand, g.name).catch(() => null))).then(imgs => {
      if (!mounted) return;
      const map = {};
      imgs.forEach((img, i) => { if (img) map[gadgets[i].id] = img; });
      setImageMap(map);
    }).catch(() => {});
    return () => { mounted = false };
  }, [gadgets]);

  const tabs = [
    { id: "scoreGlobal", label: "Peringkat Global" },
    { id: "scoreCamera", label: "Kamera" },
    { id: "scorePerformance", label: "Performa" },
    { id: "scoreDisplay", label: "Layar" },
    { id: "scoreBattery", label: "Baterai" }
  ];

  if (loading) return <div className="spinner" />;

  return (
    <div className="page">
      <div style={{ marginBottom: 24, paddingTop: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "var(--ink)" }}>Peringkat Gadget Tertinggi</h2>
        <p style={{ color: "var(--ink-muted-48)", fontSize: 14 }}>
          Daftar skor pengujian performa gadget objektif yang diuji langsung oleh tim BoysGadget.
        </p>
      </div>

      {/* Tabs Filter Kategori Skor */}
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 12, marginBottom: 16 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'btn-primary' : 'btn'}
            style={{ 
              padding: "8px 16px", 
              fontSize: 13, 
              borderRadius: 20, 
              whiteSpace: "nowrap",
              cursor: "pointer",
              background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--ink-muted-48)'
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabel Leaderboard */}
      <div style={{ backgroundColor: "var(--surface-tile-3)", borderRadius: 8, overflow: "hidden", border: "1px solid var(--hairline)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--hairline)", backgroundColor: "var(--surface-tile-1)", color: "var(--body-on-dark)" }}>
              <th style={{ padding: "16px", width: "60px", textAlign: "center" }}>Rank</th>
              <th style={{ padding: "16px" }}>Gadget</th>
              <th style={{ padding: "16px", width: "120px" }}>Brand</th>
              <th style={{ padding: "16px", width: "140px", textAlign: "center" }}>
                {tabs.find(t => t.id === activeTab)?.label} Score
              </th>
            </tr>
          </thead>
          <tbody>
            {gadgets.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: "30px", textAlign: "center", color: "var(--ink-muted-48)" }}>
                  Belum ada data penilaian gadget di Firestore.
                </td>
              </tr>
            ) : (
              gadgets.map((gadget, index) => (
                <tr key={gadget.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  {/* Nomor Urut / Peringkat */}
                  <td style={{ padding: "16px", textAlign: "center", fontWeight: 700, color: index === 0 ? "#eab308" : index === 1 ? "#cbd5e1" : index === 2 ? "#b45309" : "var(--body-on-dark)" }}>
                    #{index + 1}
                  </td>
                  {/* Detail Gambar & Nama Gadget */}
                  <td style={{ padding: "16px" }}>
                    <Link to={`/gadget/${encodeURIComponent(gadget.name)}`} style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--body-on-dark)", textDecoration: "none", fontWeight: 500 }}>
                      <img 
                        src={imageMap[gadget.id] || gadget.imageUrl || "https://via.placeholder.com/40"} 
                        alt={gadget.name} 
                        style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", backgroundColor: "#333" }}
                      />
                      <span>{gadget.name}</span>
                    </Link>
                  </td>
                  {/* Nama Brand */}
                  <td style={{ padding: "16px", color: "var(--ink-muted-48)" }}>{gadget.brand}</td>
                  {/* Nilai Dinamis Sesuai Tab yang Dipilih */}
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <span style={{ 
                      backgroundColor: activeTab === "scoreGlobal" ? "var(--primary)" : "#22c55e", 
                      color: "#fff", 
                      padding: "4px 10px", 
                      borderRadius: 6, 
                      fontWeight: 700,
                      fontSize: 13 
                    }}>
                      {gadget[activeTab] || 0}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}