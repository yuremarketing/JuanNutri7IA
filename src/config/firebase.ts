import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCRZsxp-nptfLoCW1R1781Ws4whi3KMrMs",
  authDomain: "juannutri7ia.firebaseapp.com",
  projectId: "juannutri7ia",
  storageBucket: "juannutri7ia.firebasestorage.app",
  messagingSenderId: "1049071977721",
  appId: "1:1049071977721:web:8bcf0c38ed0a55090e4e28",
  measurementId: "G-0Z7FS2M6T2"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
