import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";

export default function AdminChat() {
  const { user } = useAuth();
  const [activeUserChatId, setActiveUserChatId] = useState(""); 
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!activeUserChatId) return;

    const chatRef = collection(db, "chats", activeUserChatId, "messages");
    const q = query(chatRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, [activeUserChatId]);

  const handleReplyMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeUserChatId || !user) return;

    try {
      const chatRef = collection(db, "chats", activeUserChatId, "messages");
      
      await addDoc(chatRef, {
        text: input,
        createdAt: serverTimestamp(),
        senderId: user.uid,
        senderName: user.displayName || "Admin",
        isAdmin: true
      });

      // TRIGGER NOTIFIKASI UNTUK USER SPESIFIK
      const notifRef = collection(db, "notifications");
      await addDoc(notifRef, {
        type: "balasan_admin",
        title: "Balasan dari Admin",
        description: `Admin membalas chat Anda: "${input}"`,
        createdAt: serverTimestamp(),
        isRead: false,
        receiverId: activeUserChatId, // Dikirim langsung ke UID user tersebut
        senderId: user.uid
      });

      setInput("");
    } catch (err) {
      console.error("Gagal membalas pesan:", err);
    }
  };

  return (
    <div style={{ display: "flex", height: "90vh", color: "#fff" }}>
      {/* Struktur Halaman Utama AdminChat */}
    </div>
  );
}