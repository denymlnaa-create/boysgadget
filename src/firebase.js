import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAseZY8uebRp6T3vPOVnShcB0luv5VGK8s",
  authDomain: "boysgadget.firebaseapp.com",
  projectId: "boysgadget",
  storageBucket: "boysgadget.firebasestorage.app",
  messagingSenderId: "281575988315",
  appId: "1:281575988315:web:39a76cf9e59f1ed4bb337e",
  measurementId: "G-SDQ1WFMVN8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
