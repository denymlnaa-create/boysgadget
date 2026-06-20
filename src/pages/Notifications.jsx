import { useEffect } from "react";
import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";

// Di dalam komponen Notifications kamu:
useEffect(() => {
  const markNotifAsRead = async () => {
    if (!user) return;

    const notifRef = collection(db, "notifications");
    // Ambil semua notif belum dibaca yang ditujukan untuk user ini / ADMIN
    const isAdmin = ["UID_SULTAN", "UID_ANDIKA"].includes(user.uid);
    
    // Kamu bisa sesuaikan query ini dengan struktur halaman notif kamu
    const q = query(
      notifRef, 
      where("isRead", "==", false),
      where("receiverId", "==", isAdmin ? "ADMIN" : user.uid)
    );

    const querySnapshot = await getDocs(q);
    
    // Update semua menjadi isRead: true sekaligus menggunakan Batch
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });
    
    await batch.commit();
  };

  markNotifAsRead();
}, [user]);