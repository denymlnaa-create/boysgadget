import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import PostCard from "../components/PostCard";
import styles from "./GadgetDetail.module.css";

const MOBILEAPI_KEY = "eef7bb1143bf377e91b7622abecfb1ab51dcc751";

// Mapping field MobileAPI.dev → label tampilan
// Response: { name, brand_name, colors, storage, screen_resolution, weight,
//             thickness, release_date, camera, battery_capacity, hardware }
const SPEC_MAP = [
  {
    title: "Layar",
    rows: [
      { key: "screen_resolution", label: "Resolusi & Ukuran" }
    ]
  },
  {
    title: "Performa",
    rows: [
      { key: "hardware", label: "Chipset & RAM" },
      { key: "storage", label: "Storage" }
    ]
  },
  {
    title: "Kamera",
    rows: [
      { key: "camera", label: "Kamera" }
    ]
  },
  {
    title: "Baterai",
    rows: [
      { key: "battery_capacity", label: "Kapasitas Baterai" }
    ]
  },
  {
    title: "Bodi",
    rows: [
      { key: "weight", label: "Berat" },
      { key: "thickness", label: "Ketebalan" },
      { key: "colors", label: "Pilihan Warna" }
    ]
  },
  {
    title: "Rilis",
    rows: [
      { key: "release_date", label: "Tanggal Rilis" }
    ]
  }
];

export default function GadgetDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [gadget, setGadget] = useState(null);
  const [apiSpecs, setApiSpecs] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("specs");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const decodedName = decodeURIComponent(name);

      try {
        // 1. Ambil dokumen gadget dari Firestore (untuk skor + cek cache spesifikasi)
        const q = query(collection(db, "gadgets"), where("name", "==", decodedName));
        const snap = await getDocs(q);
        let gadgetDoc = null;
        let gadgetId = null;

        if (!snap.empty) {
          gadgetDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
          gadgetId = snap.docs[0].id;
          setGadget(gadgetDoc);
        }

        // 2. Cek apakah spesifikasi sudah pernah di-cache di Firestore
        if (gadgetDoc?.apiSpecsCache) {
          // Sudah ada cache → pakai langsung, tanpa call API
          setApiSpecs(gadgetDoc.apiSpecsCache);
        } else {
          // Belum ada cache → fetch dari MobileAPI.dev
          const res = await fetch(
            `/mobileapi/devices/search?name=${encodeURIComponent(decodedName)}&key=${MOBILEAPI_KEY}`
          );
          if (res.ok) {
            const data = await res.json();
            // Response bisa berupa object langsung atau array — handle keduanya
            const specs = Array.isArray(data) ? data[0] : data;
            if (specs && specs.name) {
              setApiSpecs(specs);
              // Simpan ke Firestore sebagai cache supaya tidak call API lagi
              if (gadgetId) {
                await updateDoc(doc(db, "gadgets", gadgetId), {
                  apiSpecsCache: specs
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("Gagal memuat data gadget:", err);
      }

      setLoading(false);
    };

    fetchData();

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

  // Bangun section spesifikasi dari data API — hanya tampilkan yang ada nilainya
  const filledSections = SPEC_MAP
    .map(section => ({
      title: section.title,
      rows: section.rows
        .filter(row => apiSpecs?.[row.key])
        .map(row => ({ key: row.label, val: apiSpecs[row.key] }))
    }))
    .filter(section => section.rows.length > 0);

  // Spesifikasi manual dari Firestore (field yang diisi admin) sebagai fallback/tambahan
  const MANUAL_SPEC_SECTIONS = [
    { title: "Layar", fields: [
      { key: "displaySize", label: "Ukuran Layar" },
      { key: "displayType", label: "Tipe Layar" },
      { key: "displayRefreshRate", label: "Refresh Rate" },
      { key: "displayResolution", label: "Resolusi" }
    ]},
    { title: "Performa", fields: [
      { key: "chipset", label: "Chipset" },
      { key: "ram", label: "RAM" },
      { key: "storage", label: "Storage" }
    ]},
    { title: "Kamera", fields: [
      { key: "cameraRear", label: "Kamera Belakang" },
      { key: "cameraFront", label: "Kamera Depan" }
    ]},
    { title: "Baterai", fields: [
      { key: "batteryCapacity", label: "Kapasitas Baterai" },
      { key: "batteryCharging", label: "Fast Charging" }
    ]},
    { title: "Bodi", fields: [
      { key: "bodyDimensions", label: "Dimensi" },
      { key: "bodyWeight", label: "Berat" },
      { key: "bodyColors", label: "Pilihan Warna" }
    ]},
    { title: "Konektivitas", fields: [
      { key: "connNetwork", label: "Jaringan" },
      { key: "connNFC", label: "NFC" },
      { key: "connPort", label: "Port" }
    ]}
  ];

  const manualSections = MANUAL_SPEC_SECTIONS
    .map(section => ({
      title: section.title,
      rows: section.fields
        .filter(f => gadget?.[f.key])
        .map(f => ({ key: f.label, val: gadget[f.key] }))
    }))
    .filter(section => section.rows.length > 0);

  // Gabungkan: prioritaskan API, fallback ke manual Firestore
  const specsToShow = filledSections.length > 0 ? filledSections : manualSections;
  const hasSpecs = specsToShow.length > 0;

  return (
    <div style={{maxWidth:600,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:16}}>
        <button className="btn-ghost" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h1 style={{fontSize:18,fontWeight:700}}>{decodeURIComponent(name)}</h1>
      </div>

      {(gadget || apiSpecs) && (
        <div className={styles.heroWrap}>
          {(gadget?.imageUrl || apiSpecs?.image) && (
            <img
              src={gadget?.imageUrl || apiSpecs?.image || null}
              className={styles.heroImg}
              alt={decodeURIComponent(name)}
            />
          )}
          <div className={styles.heroInfo}>
            <p className={styles.heroName}>{apiSpecs?.name || gadget?.name || decodeURIComponent(name)}</p>
            {(apiSpecs?.brand_name || gadget?.brand) && (
              <p className={styles.heroSub}>Brand: {apiSpecs?.brand_name || gadget?.brand}</p>
            )}
            {apiSpecs?.release_date && (
              <p className={styles.heroSub}>{apiSpecs.release_date}</p>
            )}

            <a
              href={`https://wa.me/6281234567890?text=Halo%20Admin%20BoysGadget,%20saya%20mau%20tanya%20dan%20konsultasi%20mengenai%20HP%20${encodeURIComponent(apiSpecs?.name || decodeURIComponent(name))}`}
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
        !hasSpecs ? (
          <p style={{color:"var(--text2)",fontSize:14,padding:"30px 20px",textAlign:"center"}}>
            Data spesifikasi tidak tersedia.
          </p>
        ) : (
          <div className={styles.specsTable}>
            {specsToShow.map((section, i) => (
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
        )
      )}

      {tab === "posts" && (
        posts.length === 0
          ? <p style={{color:"var(--text2)",fontSize:14,padding:"30px 20px",textAlign:"center"}}>Belum ada diskusi untuk gadget ini.</p>
          : posts.map(p => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}