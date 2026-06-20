import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import PostCard from "../components/PostCard";
import styles from "./GadgetDetail.module.css";

const SPEC_SECTIONS = [
  {
    title: "Layar",
    fields: [
      { key: "displaySize", label: "Ukuran Layar" },
      { key: "displayType", label: "Tipe Layar" },
      { key: "displayRefreshRate", label: "Refresh Rate" },
      { key: "displayResolution", label: "Resolusi" }
    ]
  },
  {
    title: "Performa",
    fields: [
      { key: "chipset", label: "Chipset" },
      { key: "ram", label: "RAM" },
      { key: "storage", label: "Storage" }
    ]
  },
  {
    title: "Kamera",
    fields: [
      { key: "cameraRear", label: "Kamera Belakang" },
      { key: "cameraFront", label: "Kamera Depan" }
    ]
  },
  {
    title: "Baterai",
    fields: [
      { key: "batteryCapacity", label: "Kapasitas Baterai" },
      { key: "batteryCharging", label: "Fast Charging" }
    ]
  },
  {
    title: "Bodi",
    fields: [
      { key: "bodyDimensions", label: "Dimensi" },
      { key: "bodyWeight", label: "Berat" },
      { key: "bodyColors", label: "Pilihan Warna" }
    ]
  },
  {
    title: "Konektivitas",
    fields: [
      { key: "connNetwork", label: "Jaringan" },
      { key: "connNFC", label: "NFC" },
      { key: "connPort", label: "Port" }
    ]
  }
];

export default function GadgetDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [gadget, setGadget] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("specs");

  useEffect(() => {
    const fetchGadget = async () => {
      setLoading(true);
      try {
        const decodedName = decodeURIComponent(name);
        const q = query(collection(db, "gadgets"), where("name", "==", decodedName));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setGadget({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          setGadget(null);
        }
      } catch (err) {
        console.error("Gagal memuat data gadget:", err);
        setGadget(null);
      }
      setLoading(false);
    };
    fetchGadget();

    const q = query(
      collection(db, "posts"),
      where("gadgetTag", "==", decodeURIComponent(name)),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [name]);

  // Hanya tampilkan section yang punya minimal satu field terisi
  const filledSections = SPEC_SECTIONS
    .map(section => ({
      title: section.title,
      rows: section.fields
        .filter(f => gadget && gadget[f.key])
        .map(f => ({ key: f.label, val: gadget[f.key] }))
    }))
    .filter(section => section.rows.length > 0);

  return (
    <div style={{maxWidth:600,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:16}}>
        <button className="btn-ghost" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h1 style={{fontSize:18,fontWeight:700}}>{decodeURIComponent(name)}</h1>
      </div>

      {gadget && (
        <div className={styles.heroWrap}>
          {gadget.imageUrl && <img src={gadget.imageUrl} className={styles.heroImg} alt={gadget.name} />}
          <div className={styles.heroInfo}>
            <p className={styles.heroName}>{gadget.name}</p>
            {gadget.brand && <p className={styles.heroSub}>Brand: {gadget.brand}</p>}

            <a 
              href={`https://wa.me/6281234567890?text=Halo%20Admin%20BoysGadget,%20saya%20mau%20tanya%20dan%20konsultasi%20mengenai%20HP%20${encodeURIComponent(gadget.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                marginTop: 10,
                fontSize: 12,
                fontWeight: 600,
                color: "#25d366",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: 20,
                background: "rgba(37, 211, 102, 0.1)",
                border: "1px solid rgba(37, 211, 102, 0.2)"
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Tanya Admin Tentang HP Ini
            </a>
          </div>
        </div>
      )}

      <div style={{padding:"0 16px", marginBottom: 12}}>
        <div style={{background:"var(--bg2, rgba(255,255,255,0.03))", borderRadius: 8, padding: 12, border: "1px solid var(--border, rgba(255,255,255,0.05))"}}>
          <p style={{fontSize:12, color:"var(--text2, #aaa)", margin:0, lineHeight: "1.5"}}>
            💡 <strong>Panduan Pemula:</strong> Gunakan tab <b>Spesifikasi</b> untuk mengenali detail komponen resmi, atau pindah ke tab <b>Diskusi</b> untuk melihat review jujur dari komunitas.
          </p>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={tab === "specs" ? styles.active : ""} onClick={() => setTab("specs")}>Spesifikasi</button>
        <button className={tab === "posts" ? styles.active : ""} onClick={() => setTab("posts")}>Diskusi ({posts.length})</button>
      </div>

      {tab === "specs" && (
        loading ? <div className="spinner" /> :
        !gadget || filledSections.length === 0 ? <p style={{color:"var(--text2)",fontSize:14,padding:"30px 20px",textAlign:"center"}}>Data spesifikasi tidak tersedia.</p> :
        <div className={styles.specsTable}>
          {filledSections.map((section, i) => (
            <div key={i} className={styles.specSection}>
              <h3 className={styles.specTitle}>{section.title}</h3>
              {section.rows.map((row, j) => (
                <div key={j} className={styles.specRow}>
                  <span className={styles.specKey}>{row.key}</span>
                  <span className={styles.specVal}>{row.val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === "posts" && (
        posts.length === 0
          ? <p style={{color:"var(--text2)",fontSize:14,padding:"30px 20px",textAlign:"center"}}>Belum ada diskusi untuk gadget ini.</p>
          : posts.map(p => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}