import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

export default function Leaderboard() {
  const [gadgets, setGadgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("scoreGlobal");

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
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#fff" }}>Peringkat Gadget Tertinggi</h2>
        <p style={{ color: "var(--text2, #aaa)", fontSize: 14 }}>
          Daftar skor pengujian performa gadget objektif yang diuji langsung oleh tim BoysGadget.
        </p>
      </div>

      {/* Tabs Filter Kategori Skor */}
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 12, marginBottom: 16 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`btn-${activeTab === tab.id ? "primary" : "ghost"}`}
            style={{ 
              padding: "8px 16px", 
              fontSize: 13, 
              borderRadius: 20, 
              whiteSpace: "nowrap",
              cursor: "pointer"
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabel Leaderboard */}
      <div style={{ backgroundColor: "#1e1e1e", borderRadius: 8, overflow: "hidden", border: "1px solid #333" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333", backgroundColor: "#252526", color: "var(--text2, #aaa)" }}>
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
                <td colSpan="4" style={{ padding: "30px", textAlign: "center", color: "var(--text2, #aaa)" }}>
                  Belum ada data penilaian gadget di Firestore.
                </td>
              </tr>
            ) : (
              gadgets.map((gadget, index) => (
                <tr key={gadget.id} style={{ borderBottom: "1px solid #2d2d2d" }}>
                  {/* Nomor Urut / Peringkat */}
                  <td style={{ padding: "16px", textAlign: "center", fontWeight: 700, color: index === 0 ? "#eab308" : index === 1 ? "#cbd5e1" : index === 2 ? "#b45309" : "#fff" }}>
                    #{index + 1}
                  </td>
                  {/* Detail Gambar & Nama Gadget */}
                  <td style={{ padding: "16px" }}>
                    <Link to={`/gadget/${encodeURIComponent(gadget.name)}`} style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff", textDecoration: "none", fontWeight: 500 }}>
                      <img 
                        src={gadget.imageUrl || "https://placeholder.co/40x40?text=HP"} 
                        alt={gadget.name} 
                        style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", backgroundColor: "#333" }}
                      />
                      <span>{gadget.name}</span>
                    </Link>
                  </td>
                  {/* Nama Brand */}
                  <td style={{ padding: "16px", color: "var(--text2, #aaa)" }}>{gadget.brand}</td>
                  {/* Nilai Dinamis Sesuai Tab yang Dipilih */}
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <span style={{ 
                      backgroundColor: activeTab === "scoreGlobal" ? "var(--accent, #3b82f6)" : "#22c55e", 
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