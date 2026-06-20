import { useState, useEffect } from "react";

export default function Notifications() {
  // Biarkan state, useEffect, atau logika fungsi di sini tetap sama seperti sebelumnya
  const [notifications, setNotifications] = useState([]);

  return (
    <div style={{ width: "100%", padding: "20px 30px", color: "#fff", boxSizing: "border-box" }}>
      <div style={{ backgroundColor: "#1e1e1e", padding: "20px", borderRadius: "8px", border: "1px solid #333" }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", fontWeight: "700" }}>Notifikasi</h3>
        <p style={{ margin: 0, fontSize: "14px", color: "#8e8e93" }}>Belum ada notifikasi baru.</p>
      </div>
    </div>
  );
}