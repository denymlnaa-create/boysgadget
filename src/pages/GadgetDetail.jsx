import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import PostCard from "../components/PostCard";
import { getCachedPhoneImage } from "../utils/imageUtils";
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

function GadgetDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [gadget, setGadget] = useState(null);
  const [apiSpecs, setApiSpecs] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("specs");
  const [phoneImage, setPhoneImage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const decodedName = decodeURIComponent(name);

      // Prefetch a representative phone image (curated or Unsplash) using the decoded name
      try {
        const preImage = await getCachedPhoneImage(null, decodedName);
        if (preImage) setPhoneImage(preImage);
      } catch (imgErr) {
        console.error('Prefetch image failed:', imgErr);
      }

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
          
          // Fetch gambar dari Unsplash berdasarkan brand & name
          const image = await getCachedPhoneImage(
            gadgetDoc.brand || "smartphone",
            decodeURIComponent(name)
          );
          setPhoneImage(image);
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

                  // Fetch Unsplash image using api specs (fallback if gadget doc didn't provide image)
                  try {
                    const imageFromApiSpecs = await getCachedPhoneImage(specs.brand_name || gadgetDoc?.brand || "smartphone", specs.name);
                    if (imageFromApiSpecs && !phoneImage) setPhoneImage(imageFromApiSpecs);
                  } catch (e) {
                    console.error("Failed to fetch image from Unsplash for apiSpecs:", e);
                  }
                }
          }
        }
      } catch (err) {
        console.error("Gagal memuat data gadget:", err);
      }
      // Always attempt to fetch a representative product image from Unsplash
      try {
        if (!phoneImage) {
          const fallbackImage = await getCachedPhoneImage(null, decodedName);
          if (fallbackImage) setPhoneImage(fallbackImage);
        }
      } catch (e) {
        console.error('Failed to fetch fallback Unsplash image:', e);
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
    }, async (err) => {
      // Firestore may require a composite index for this query in some projects — fallback to getDocs
      console.error('Posts listener error:', err);
      try {
        const docs = await getDocs(q);
        setPosts(docs.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Fallback getDocs failed for posts:', e);
        setPosts([]);
      }
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
    <div className={styles.page}>
      {/* Back Button - Sticky */}
      <div className={styles.backBar}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <h1 className={styles.backTitle}>{decodeURIComponent(name)}</h1>
      </div>

      {/* Light Tile - Hero Section */}
        <section className={styles.tileLight}>
          <div className={styles.heroGrid}>
            {/* Left Side - Info */}
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>{apiSpecs?.name || gadget?.name || decodeURIComponent(name)}</h1>
              
              {(apiSpecs?.brand_name || gadget?.brand) && (
                <p className={styles.heroBrand}>{apiSpecs?.brand_name || gadget?.brand}</p>
              )}
              
              <p className={styles.heroDesc}>
                {apiSpecs?.description || apiSpecs?.summary || apiSpecs?.about || gadget?.description || `${apiSpecs?.brand_name || gadget?.brand || ''} ${apiSpecs?.name || decodeURIComponent(name)} — Perangkat yang menawarkan kombinasi desain, performa, dan fitur kamera yang kompetitif pada kelasnya.`}
              </p>

              {/* Score Badges */}
              {(gadget?.scoreGlobal || gadget?.scoreCamera) && (
                <div className={styles.scoreBadges}>
                  {gadget?.scoreGlobal && (
                    <div className={styles.badge}>
                      <span className={styles.badgeLabel}>Global Score</span>
                      <span className={styles.badgeValue}>{gadget.scoreGlobal}</span>
                    </div>
                  )}
                  {gadget?.scoreCamera && (
                    <div className={styles.badge}>
                      <span className={styles.badgeLabel}>Kamera</span>
                      <span className={styles.badgeValue}>{gadget.scoreCamera}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Admin contact removed — platform is user-only now */}
            </div>

            {/* Right Side - Product Image */}
            <div className={styles.heroImage}>
              <img
                src={phoneImage || gadget?.imageUrl || apiSpecs?.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=60"}
                alt={decodeURIComponent(name)}
              />
            </div>
          </div>
        </section>

      {/* Parchment Tile - Specs Section */}
      <section className={styles.tileParchment}>
        <div className={styles.mainContent}>
          <div className={styles.tabNav}>
            <button 
              className={`${styles.tabButton} ${tab === "specs" ? styles.active : ""}`}
              onClick={() => setTab("specs")}
            >
              Spesifikasi
            </button>
            <button 
              className={`${styles.tabButton} ${tab === "posts" ? styles.active : ""}`}
              onClick={() => setTab("posts")}
            >
              Diskusi ({posts.length})
            </button>
          </div>

          {tab === "specs" && (
            loading ? (
              <div className="spinner" />
            ) : !hasSpecs ? (
              <p className={styles.emptyState}>Data spesifikasi tidak tersedia.</p>
            ) : (
              <div className={styles.specsGrid}>
                {specsToShow.map((section, i) => (
                  <div key={i} className={styles.specSection}>
                    <h3 className={styles.specTitle}>{section.title}</h3>
                    <div className={styles.specRows}>
                      {section.rows.map((row, j) => (
                        <div key={j} className={styles.specRow}>
                          <span className={styles.specKey}>{row.key}</span>
                          <span className={styles.specVal}>{row.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "posts" && (
            <div className={styles.postsContainer}>
              {posts.length === 0 ? (
                <p className={styles.emptyState}>Belum ada diskusi untuk gadget ini.</p>
              ) : (
                posts.map(p => <PostCard key={p.id} post={p} />)
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default GadgetDetail;