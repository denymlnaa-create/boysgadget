import { useState, useEffect } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../hooks/useAuth";

const ADMIN_UIDS = ["UID_SULTAN_DI_SINI", "UID_ANDIKA_DI_SINI"]; 

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  if (user && ADMIN_UIDS.includes(user.uid)) {
    return null; 
  }

  useEffect(() => {
    if (!user || !isOpen) return;

    const chatRef = collection(db, "chats", user.uid, "messages");
    const q = query(chatRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, [user, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    try {
      const chatRef = collection(db, "chats", user.uid, "messages");
      
      await addDoc(chatRef, {
        text: input,
        createdAt: serverTimestamp(),
        senderId: user.uid,
        senderName: user.displayName || "User",
        isAdmin: false
      });

      // TRIGGER NOTIFIKASI UNTUK ADMIN
      const notifRef = collection(db, "notifications");
      await addDoc(notifRef, {
        type: "chat_masuk",
        title: "Pesan Baru dari User",
        description: `${user.displayName || "User"} mengirim pesan: "${input}"`,
        createdAt: serverTimestamp(),
        isRead: false,
        receiverId: "ADMIN", // Ditargetkan untuk semua admin
        senderId: user.uid
      });

      setInput("");
    } catch (err) {
      console.error("Gagal mengirim pesan:", err);
    }
  };

  if (!user) return null;

  return (
    <div style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 9999 }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#3b82f6",
          color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {isOpen && (
        <div style={{
          position: "absolute", bottom: "80px", right: "0", width: "330px", height: "400px",
          backgroundColor: "#1e1e24", borderRadius: "12px", border: "1px solid #333",
          display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 5px 25px rgba(0,0,0,0.5)"
        }}>
          <div style={{ padding: "15px", backgroundColor: "#141416", borderBottom: "1px solid #333", fontWeight: "700" }}>
            Hubungi Admin BoysGadget
          </div>

          <div style={{ flex: 1, padding: "15px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((msg) => {
              const isMe = msg.senderId === user.uid;
              return (
                <div key={msg.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                  <div style={{
                    backgroundColor: isMe ? "#3b82f6" : "#2d2d30",
                    padding: "8px 12px", borderRadius: "8px", fontSize: "14px"
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: "flex", borderTop: "1px solid #333" }}>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pesan..."
              style={{ flex: 1, padding: "12px", backgroundColor: "#141416", color: "#fff", border: "none", outline: "none" }}
            />
            <button type="submit" style={{ padding: "12px 20px", backgroundColor: "#3b82f6", color: "#fff", border: "none", cursor: "pointer" }}>
              Kirim
            </button>
          </form>
        </div>
      )}
    </div>
  );
}