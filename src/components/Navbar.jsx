import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // State untuk menyimpan jumlah notifikasi yang belum dibaca
  const [unreadCount, setUnreadCount] = useState(0);

  // Efek samping untuk mendengarkan perubahan koleksi notifikasi secara real-time
  useEffect(() => {
    if (!user) return;

    // Query untuk mengambil notifikasi milik user aktif yang berstatus belum dibaca (read: false)
    const q = query(
      collection(db, "notifications"),
      where("toUid", "==", user.uid),
      where("read", "==", false)
    );

    // Menerapkan listener real-time Firestore
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size); // Mengambil total jumlah dokumen langsung dari snap.size
    });

    return unsub;
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  // Jika user belum melakukan login, sembunyikan tampilan navigasi atas
  if (!user) return null;

  // Fungsi pembantu untuk memberikan class active secara visual pada menu yang sedang dibuka
  const active = (path) => location.pathname === path ? styles.active : "";

  return (
    <nav className={styles.nav}>
      {/* Sisi Kiri: Identitas Aplikasi */}
      <Link to="/" className={styles.logo}>BoysGadget</Link>
      
      {/* Sisi Kanan: Kumpulan Menu Navigasi Ikon */}
      <div className={styles.links}>
        
        {/* MENU 1: BERANDA / TIMELINE */}
        <Link to="/" className={active("/")} title="Beranda">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </Link>
        
        {/* MENU 2: PENCARIAN GADGET */}
        <Link to="/search" className={active("/search")} title="Cari Gadget">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </Link>

        {/* MENU 3: RANKING / LEADERBOARD GADGET (ALA DXOMARK) */}
        <Link to="/leaderboard" className={active("/leaderboard")} title="Peringkat Skor DXO">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </Link>
        
        {/* MENU 4: NOTIFIKASI (DILENGKAPI BULATAN INDIKATOR) */}
        <Link 
          to="/notifications" 
          className={active("/notifications")} 
          title="Notifikasi"
          style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          
          {/* Kondisi bunderan merah menyala hanya jika ada unreadCount > 0 */}
          {unreadCount > 0 && (
            <span style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              backgroundColor: "var(--danger, #ef4444)",
              width: "8px",
              height: "8px",
              borderRadius: "50%"
            }} />
          )}
        </Link>
        
        {/* MENU 5: LINK KONSULTASI ADMIN (WHATSAPP) */}
        <a 
          href="https://wa.me/6281234567890?text=Halo%20Admin%20BoysGadget,%20saya%20mau%20tanya%20rekomendasi%20gadget" 
          target="_blank" 
          rel="noopener noreferrer" 
          title="Tanya Admin"
          className={styles.iconLink}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </a>

        {/* MENU 6: FOTO PROFIL USER */}
        <Link to={`/profile/${user.uid}`} className={active(`/profile/${user.uid}`)}>
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}&background=3b82f6&color=fff`} 
            className="avatar" 
            style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} 
            alt="profile"
          />
        </Link>

        {/* TOMBOL KELUAR (LOGOUT) */}
        <button className="btn-ghost" onClick={handleLogout} style={{ fontSize: 12, marginLeft: 4 }}>Logout</button>
      </div>
    </nav>
  );
}