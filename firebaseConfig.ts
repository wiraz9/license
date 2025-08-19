// Konfigurasi Firebase, ganti dengan config milikmu
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCWp2-0S4y8SX8A0xy1OMgBanGpuxul3ZQ",
  projectId: "catatorder-de5b5",
  storageBucket: "catatorder-de5b5.firebasestorage.app",
  appId: "1:229202384169:android:c2b7eb0ed0516e91259338",
  messagingSenderId: "229202384169"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
