import { useState, useEffect } from "react";
import {
  collection, onSnapshot, doc, updateDoc, addDoc,
  deleteDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const SCORE_FIELDS = [
  { key: "scoreGlobal", label: "Global" },
  { key: "scoreCamera", label: "Kamera" },
  { key: "scorePerformance", label: "Performa" },
  { key: "scoreDisplay", label: "Layar" },
  { key: "scoreBattery", label: "Baterai" }
];

// Setiap section = satu kartu spesifikasi di GadgetDetail.
// fields: [{ key, label, placeholder }]
const SPEC_SECTIONS = [
  {
    title: "Layar",
    fields: [
      { key: "displaySize", label: "Ukuran Layar", placeholder: "6.7 inci" },
      { key: "displayType", label: "Tipe Layar", placeholder: "AMOLED" },
      { key: "displayRefreshRate", label: "Refresh Rate", placeholder: "120Hz" },
      { key: "displayResolution", label: "Resolusi", placeholder: "1440 x 3120 piksel" }
    ]
  },
  {
    title: "Performa",
    fields: [
      { key: "chipset", label: "Chipset", placeholder: "Snapdragon 8 Elite Gen 5" },
      { key: "ram", label: "RAM", placeholder: "12GB" },
      { key: "storage", label: "Storage", placeholder: "256GB" }
    ]
  },
  {
    title: "Kamera",
    fields: [
      { key: "cameraRear", label: "Kamera Belakang", placeholder: "50MP + 50MP + 50MP" },
      { key: "cameraFront", label: "Kamera Depan", placeholder: "32MP" }
    ]
  },
  {
    title: "Baterai",
    fields: [
      { key: "batteryCapacity", label: "Kapasitas Baterai", placeholder: "5400mAh" },
      { key: "batteryCharging", label: "Fast Charging", placeholder: "90W Wired" }
    ]
  },
  {
    title: "Bodi",
    fields: [
      { key: "bodyDimensions", label: "Dimensi", placeholder: "162.2 x 75.3 x 8.4 mm" },
      { key: "bodyWeight", label: "Berat", placeholder: "220g" },
      { key: "bodyColors", label: "Pilihan Warna", placeholder: "Hitam, Putih, Titanium" }
    ]
  },
  {
    title: "Konektivitas",
    fields: [
      { key: "connNetwork", label: "Jaringan", placeholder: "5G" },
      { key: "connNFC", label: "NFC", placeholder: "Ya" },
      { key: "connPort", label: "Port", placeholder: "USB Type-C 3.2" }
    ]
  }
];

const ALL_SPEC_KEYS = SPEC_SECTIONS.flatMap(s => s.fields.map(f => f.key));

const EMPTY_FORM = {
  name: "",
  brand: "",
  imageUrl: "",
  scoreGlobal: "",
  scoreCamera: "",
  scorePerformance: "",
  scoreDisplay: "",
  scoreBattery: "",
  ...Object.fromEntries(ALL_SPEC_KEYS.map(k => [k, ""]))
};

export default function AdminGadgets() {
  const [gadgets, setGadgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [showSpecs, setShowSpecs] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "gadgets"), (snap) => {
      setGadgets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error("Gagal memuat gadgets:", err);
      setLoading(false);
    });
    return unsub;
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  const startEdit = (gadget) => {
    setForm({
      name: gadget.name || "",
      brand: gadget.brand || "",
      imageUrl: gadget.imageUrl || "",
      scoreGlobal: gadget.scoreGlobal ?? "",
      scoreCamera: gadget.scoreCamera ?? "",
      scorePerformance: gadget.scorePerformance ?? "",
      scoreDisplay: gadget.scoreDisplay ?? "",
      scoreBattery: gadget.scoreBattery ?? "",
      ...Object.fromEntries(ALL_SPEC_KEYS.map(k => [k, gadget[k] || ""]))
    });
    setEditingId(gadget.id);
    setError("");
    setShowSpecs(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.brand.trim()) {
      setError("Nama dan Brand wajib diisi.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        imageUrl: form.imageUrl.trim(),
        scoreGlobal: form.scoreGlobal === "" ? 0 : Number(form.scoreGlobal),
        scoreCamera: form.scoreCamera === "" ? 0 : Number(form.scoreCamera),
        scorePerformance: form.scorePerformance === "" ? 0 : Number(form.scorePerformance),
        scoreDisplay: form.scoreDisplay === "" ? 0 : Number(form.scoreDisplay),
        scoreBattery: form.scoreBattery === "" ? 0 : Number(form.scoreBattery),
        ...Object.fromEntries(ALL_SPEC_KEYS.map(k => [k, form[k].trim()])),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "gadgets", editingId), payload);
      } else {
        await addDoc(collection(db, "gadgets"), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }
      resetForm();
    } catch (err) {
      console.error("Gagal menyimpan gadget:", err);
      setError("Gagal menyimpan data. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus gadget ini? Tindakan ini tidak bisa dibatalkan.")) return;
    try {
      await deleteDoc(doc(db, "gadgets", id));
      if (editingId === id) resetForm();
    } catch (err) {
      console.error("Gagal menghapus gadget:", err);
    }
  };

  const filteredGadgets = gadgets
    .filter(g =>
      (g.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (g.brand || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  if (loading) return <div className="spinner" />;

  return (
    <div style={{ width: "100%", maxWidth: "1100px", margin: "0 auto", padding: "30px", color: "#fff", boxSizing: "border-box" }}>
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "6px" }}>Kelola Skor & Spesifikasi Gadget</h2>
        <p style={{ fontSize: "14px", color: "#8e8e93", margin: 0 }}>
          Tambah atau ubah skor dan spesifikasi gadget. Data ini langsung dipakai di Home, Leaderboard, dan halaman detail gadget.
        </p>
      </div>

      {/* Form Tambah/Edit */}
      <div style={{ backgroundColor: "#1e1e1e", border: "1px solid #333", borderRadius: "10px", padding: "22px", marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", margin: 0 }}>
            {editingId ? "Edit Gadget" : "Tambah Gadget Baru"}
          </h3>
          {editingId && (
            <button
              onClick={resetForm}
              style={{ background: "none", border: "none", color: "#8e8e93", fontSize: "13px", cursor: "pointer" }}
            >
              Batal edit
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
          <div>
            <label style={labelStyle}>Nama Gadget *</label>
            <input
              value={form.name}
              onChange={e => handleChange("name", e.target.value)}
              placeholder="iPhone 15 Pro Max"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Brand *</label>
            <input
              value={form.brand}
              onChange={e => handleChange("brand", e.target.value)}
              placeholder="Apple"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label style={labelStyle}>URL Gambar</label>
          <input
            value={form.imageUrl}
            onChange={e => handleChange("imageUrl", e.target.value)}
            placeholder="https://..."
            style={inputStyle}
          />
        </div>

        <label style={{ ...labelStyle, marginBottom: "10px", display: "block" }}>Skor per Kategori</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "18px" }}>
          {SCORE_FIELDS.map(f => (
            <div key={f.key}>
              <label style={{ ...labelStyle, color: "#8e8e93" }}>{f.label}</label>
              <input
                type="number"
                value={form[f.key]}
                onChange={e => handleChange(f.key, e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        {/* Toggle Spesifikasi Detail */}
        <button
          onClick={() => setShowSpecs(s => !s)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            color: "#3b82f6",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            padding: 0,
            marginBottom: showSpecs ? "18px" : "18px"
          }}
        >
          {showSpecs ? "▾" : "▸"} Spesifikasi Detail (Layar, Performa, Kamera, Baterai, Bodi, Konektivitas)
        </button>

        {showSpecs && (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "18px" }}>
            {SPEC_SECTIONS.map(section => (
              <div key={section.title}>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "#eee", marginBottom: "10px" }}>{section.title}</p>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${section.fields.length}, 1fr)`, gap: "12px" }}>
                  {section.fields.map(f => (
                    <div key={f.key}>
                      <label style={{ ...labelStyle, color: "#8e8e93" }}>{f.label}</label>
                      <input
                        value={form[f.key]}
                        onChange={e => handleChange(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "14px" }}>{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            backgroundColor: "#3b82f6",
            color: "#fff",
            border: "none",
            padding: "10px 22px",
            borderRadius: "8px",
            fontWeight: "700",
            fontSize: "14px",
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Gadget"}
        </button>
      </div>

      {/* List Gadget */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "700", margin: 0 }}>Daftar Gadget ({filteredGadgets.length})</h3>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari gadget..."
          style={{ ...inputStyle, width: "220px" }}
        />
      </div>

      <div style={{ backgroundColor: "#1e1e1e", borderRadius: "8px", overflow: "hidden", border: "1px solid #333" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333", backgroundColor: "#252526", color: "#8e8e93" }}>
              <th style={thStyle}>Gadget</th>
              <th style={thStyle}>Brand</th>
              {SCORE_FIELDS.map(f => <th key={f.key} style={{ ...thStyle, textAlign: "center" }}>{f.label}</th>)}
              <th style={{ ...thStyle, textAlign: "center" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredGadgets.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "#8e8e93" }}>
                  Belum ada gadget. Tambahkan lewat form di atas.
                </td>
              </tr>
            ) : (
              filteredGadgets.map(gadget => (
                <tr key={gadget.id} style={{ borderBottom: "1px solid #2d2d2d" }}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img
                        src={gadget.imageUrl || "https://placeholder.co/32x32?text=HP"}
                        alt={gadget.name}
                        style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "cover", backgroundColor: "#333" }}
                      />
                      <span>{gadget.name}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: "#8e8e93" }}>{gadget.brand}</td>
                  {SCORE_FIELDS.map(f => (
                    <td key={f.key} style={{ ...tdStyle, textAlign: "center" }}>
                      {gadget[f.key] || 0}
                    </td>
                  ))}
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <button onClick={() => startEdit(gadget)} style={actionBtnStyle}>Edit</button>
                    <button onClick={() => handleDelete(gadget.id)} style={{ ...actionBtnStyle, color: "#ef4444" }}>Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "12px",
  fontWeight: "600",
  color: "#aaa",
  marginBottom: "6px"
};

const inputStyle = {
  width: "100%",
  backgroundColor: "#141416",
  border: "1px solid #2d2d30",
  borderRadius: "8px",
  padding: "9px 12px",
  color: "#fff",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box"
};

const thStyle = {
  padding: "12px"
};

const tdStyle = {
  padding: "12px"
};

const actionBtnStyle = {
  background: "none",
  border: "none",
  color: "#3b82f6",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  marginRight: "10px"
};