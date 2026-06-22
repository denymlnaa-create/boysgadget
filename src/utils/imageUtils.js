// Unsplash API helper untuk fetch gambar HP berdasarkan brand dan series
const UNSPLASH_ACCESS_KEY = "EQpAqMmQfxJlbJYe-9J-e7_M3H0O-Yx3vqFMVpF4gmo";

// Mapping untuk mendapatkan query yang tepat berdasarkan brand dan specs
const getSearchQuery = (brand, name, specs) => {
  const brandLower = (brand || "").toLowerCase();
  const nameLower = (name || "").toLowerCase();
  
  // Extract model dari name (misal "iPhone 15 Pro" -> "iPhone 15 Pro")
  let modelQuery = nameLower;
  
  // Standarisasi query untuk Unsplash
  const queryMap = {
    "apple": () => modelQuery.includes("pro") ? "iPhone Pro" : "iPhone",
    "samsung": () => modelQuery.includes("ultra") ? "Galaxy Ultra" : modelQuery.includes("fold") ? "Galaxy Fold" : "Galaxy S",
    "xiaomi": () => modelQuery.includes("ultra") ? "Xiaomi Ultra" : modelQuery.includes("pro") ? "Xiaomi Pro" : "Xiaomi",
    "oppo": () => "OPPO phone",
    "vivo": () => "Vivo phone",
    "asus": () => "Asus ROG phone",
    "oneplus": () => "OnePlus",
    "google": () => "Pixel",
    "realme": () => "Realme phone",
  };
  
  const query = queryMap[brandLower] ? queryMap[brandLower]() : modelQuery;
  return query;
};

// Fetch gambar dari Unsplash
export const getPhoneImageUrl = async (brand, name, specs = null) => {
  // quick curated mapping for popular models to avoid rate limits and ensure brand-accurate images
  const curated = {
    "iphone 15 pro max": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80&auto=format&fit=crop",
    "iphone 15 pro": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80&auto=format&fit=crop",
    "galaxy s24 ultra": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&q=80&auto=format&fit=crop",
    "xiaomi 14 ultra": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80&auto=format&fit=crop",
    "pixel": "https://images.unsplash.com/photo-1523475496153-3d6cc8e0b6a8?w=800&q=80&auto=format&fit=crop",
    "oneplus": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80&auto=format&fit=crop"
  };
  const key = (name || "").toLowerCase();
  for (const k of Object.keys(curated)) {
    if (key.includes(k)) return curated[k];
  }

  try {
    const query = getSearchQuery(brand, name, specs);
    const params = new URLSearchParams({
      query,
      per_page: 1,
      orientation: "portrait",
      client_id: UNSPLASH_ACCESS_KEY,
    });
    
    const response = await fetch(
      `https://api.unsplash.com/search/photos?${params}`
    );
    
    if (!response.ok) {
      // rate limit or server error — fallback silently
      throw new Error("Unsplash API error: " + response.status);
    }
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      // Return optimized image URL dengan width setting
      return `${data.results[0].urls.raw}&w=600&q=80&fit=crop`;
    }
  } catch (error) {
    console.error("Error fetching image:", error);
  }
  
  // Fallback ke generic phone image
  return `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=60`;
};

// Cached images untuk performa
const imageCache = {};

export const getCachedPhoneImage = async (brand, name, specs = null) => {
  const cacheKey = `${brand}-${name}`;
  
  if (imageCache[cacheKey]) {
    return imageCache[cacheKey];
  }
  
  const imageUrl = await getPhoneImageUrl(brand, name, specs);
  imageCache[cacheKey] = imageUrl;
  return imageUrl;
};
