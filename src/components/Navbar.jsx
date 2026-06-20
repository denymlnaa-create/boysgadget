import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { collection, query, where, onSnapshot, or } from "firebase/firestore";
import { db } from "../firebase";

const ADMIN_UIDS = ["UID_SULTAN_DI_SINI", "UID_ANDIKA_DI_SINI"];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Mendeteksi path aktif saat ini
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);

  useEffect(() => {
    if (!user) return;

    const isAdmin = ADMIN_UIDS.includes(user.uid);
    const notifRef = collection(db, "notifications");
    let q;

    if (isAdmin) {
      q = query(
        notifRef,
        where("isRead", "==", false),
        or(
          where("receiverId", "==", "ADMIN"),
          where("receiverId", "==", user.uid)
        )
      );
    } else {
      q = query(
        notifRef,
        where("receiverId", "==", user.uid),
        where("isRead", "==", false)
      );
    }

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
    <nav style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "15px 30px", backgroundColor: "#141416", borderBottom: "1px solid #2d2d30", color: "#fff"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link to="/" style={{ textDecoration: "none", color: "#3b82f6", fontSize: "20px", fontWeight: "850", letterSpacing: "-0.5px" }}>
          BoysGadget
        </Link>
      </div>

      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          
          {/* Tombol Home */}
          <Link to="/" style={{ color: getIconColor("/"), display: "flex", alignItems: "center" }} title="Home">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </Link>

          {/* Tombol Search */}
          <Link to="/search" style={{ color: getIconColor("/search"), display: "flex", alignItems: "center" }} title="Cari Gadget">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </Link>

          {/* Tombol Leaderboard */}
          <Link to="/leaderboard" style={{ color: getIconColor("/leaderboard"), display: "flex", alignItems: "center" }} title="Leaderboard">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </Link>

          {/* Tombol Notifikasi */}
          <Link to="/notifications" style={{ color: getIconColor("/notifications"), display: "flex", alignItems: "center", position: "relative" }} title="Notifikasi">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            
            {hasUnreadNotif && (
              <span style={{
                position: "absolute", top: "-2px", right: "-2px", width: "9px", height: "9px",
                backgroundColor: "#ef4444", borderRadius: "50%", border: "2px solid #141416"
              }} />
            )}
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginLeft: "6px" }}>
            <Link to={`/profile/${user.uid}`} style={{ display: "flex", alignItems: "center" }} title="Profil Saya">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`} 
                alt="Profile" 
                style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "1px solid #3c3c3e" }} 
              />
            </Link>
            
            <button 
              onClick={handleLogout} 
              style={{ backgroundColor: "transparent", color: "#aeaeac", border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer", padding: "4px 8px", borderRadius: "4px" }}
              onMouseEnter={(e) => e.target.style.color = "#ef4444"}
              onMouseLeave={(e) => e.target.style.color = "#aeaeac"}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}