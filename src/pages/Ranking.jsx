import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Ranking() {
  const navigate = useNavigate();
  const [gadgets, setGadgets] = useState([]);

  useEffect(() => {
    const gadgetRef = collection(db, "gadgets");
    const q = query(gadgetRef, orderBy("scoreGlobal", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setGadgets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  return (
    <div style={{ width: "100%", padding: "40px 30px", color: "#fff", boxSizing: "border-box" }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ backgroundColor: "#252526", border: "1px solid #333", color: "#fff", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", marginBottom: "20px" }}
      >
        ← Kembali
      </button>

      <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "8px" }}>Leaderboard Skor Global Gadget</h2>
      <p style={{ color: "#aaa", marginBottom: "30px" }}>Urutan smartphone berdasar kalkulasi performa, kamera, dan efisiensi baterai.</p>

      <div style={{ backgroundColor: "#1e1e1e", borderRadius: "12px", border: "1px solid #333", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "#252526", borderBottom: "1px solid #333" }}>
              <th style={{ padding: "16px", fontSize: "14px", fontWeight: "700" }}>Peringkat</th>
              <th style={{ padding: "16px", fontSize: "14px", fontWeight: "700" }}>Nama Gadget</th>
              <th style={{ padding: "16px", fontSize: "14px", fontWeight: "700" }}>Brand</th>
              <th style={{ padding: "16px", fontSize: "14px", fontWeight: "700", textAlign: "right" }}>Skor Global</th>
            </tr>
          </thead>
          <tbody>
            {gadgets.map((gadget, index) => (
              <tr key={gadget.id} style={{ borderBottom: "1px solid #2d2d2d" }}>
                <td style={{ padding: "16px", fontWeight: "700", color: index === 0 ? "#eab308" : index === 1 ? "#cbd5e1" : "#fff" }}>
                  #{index + 1}
                </td>
                <td style={{ padding: "16px", cursor: "pointer", color: "#3b82f6" }} onClick={() => navigate(`/gadget/${encodeURIComponent(gadget.name)}`)}>
                  {gadget.name}
                </td>
                <td style={{ padding: "16px", color: "#aaa" }}>{gadget.brand}</td>
                <td style={{ padding: "16px", textAlign: "right", fontWeight: "700", color: "#22c55e" }}>{gadget.scoreGlobal} Pts</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}