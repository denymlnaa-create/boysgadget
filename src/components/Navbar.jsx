import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Mendeteksi path aktif saat ini
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);

  useEffect(() => {
    if (!user) return;

    const notifRef = collection(db, "notifications");
    const q = query(
      notifRef,
      where("receiverId", "==", user.uid),
      where("isRead", "==", false)
    );

    const unsub = onSnapshot(q, (snap) => {
      setHasUnreadNotif(!snap.empty);
    });

    return unsub;
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  };

  // Fungsi pembantu untuk menentukan warna ikon berdasarkan path aktif
  const getIconColor = (path) => {
    return location.pathname === path ? "#3b82f6" : "#8e8e93";
  };

  return (
    <nav className={styles.nav}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link to="/" className={styles.logo}>
          BoysGadget
        </Link>
      </div>

      {user && (
        <div className={styles.links}>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''} title="Home">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </Link>

          <Link to="/search" className={location.pathname === '/search' ? 'active' : ''} title="Cari Gadget">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </Link>

          <Link to="/leaderboard" className={location.pathname === '/leaderboard' ? 'active' : ''} title="Leaderboard">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </Link>

          <Link to="/notifications" className={location.pathname === '/notifications' ? 'active' : ''} title="Notifikasi" style={{ position: 'relative' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {hasUnreadNotif && <span className={styles.unread} />}
          </Link>

          <Link to={`/profile/${user.uid}`} title="Profil Saya" className={styles.profileLink}>
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`} 
              alt="Profile" 
              className={styles.avatar}
            />
          </Link>

          <button onClick={handleLogout} className={styles.logout}>Logout</button>
        </div>
      )}
    </nav>
  );
}