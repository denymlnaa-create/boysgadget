import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./GadgetSearch.module.css";
import { getCachedPhoneImage } from "../utils/imageUtils";

const PHONE_HISTORY_KEY = "NhkPMg==";

export default function GadgetSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const res = await fetch(`https://phone-specs-api.azharimm.dev/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      const phones = data.data?.phones || [];
      // Fetch Unsplash images in parallel and attach to results
      const withImages = await Promise.all(phones.map(async (p) => {
        try {
          const img = await getCachedPhoneImage(p.brand, p.phone_name);
          return { ...p, image: img || p.image };
        } catch {
          return p;
        }
      }));
      setResults(withImages);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <h2 className={styles.title}>Cari Gadget</h2>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          placeholder="Cari nama gadget, misal: Samsung Galaxy S24..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "..." : "Cari"}
        </button>
      </form>

      {loading && <div className="spinner" />}

      {searched && !loading && results.length === 0 && (
        <p style={{color:"var(--ink-muted-48)",fontSize:14,textAlign:"center",padding:"30px 0"}}>Gadget tidak ditemukan.</p>
      )}

      <div className={styles.grid}>
        {results.map((phone, i) => (
          <div key={i} className={styles.phoneCard} onClick={() => navigate(`/gadget/${encodeURIComponent(phone.phone_name)}`, { state: { slug: phone.slug } })}>
            <img src={phone.image} alt={phone.phone_name} className={styles.phoneImg} onError={e => e.target.style.display="none"} />
            <div className={styles.phoneInfo}>
              <p className={styles.phoneName}>{phone.phone_name}</p>
              <p className={styles.phoneBrand}>{phone.brand}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
