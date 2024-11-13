import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCuJTsv1VFOc01c9FEGzEiBXNxM64xj7uM",
  authDomain: "uacomapp.firebaseapp.com",
  projectId: "uacomapp",
  storageBucket: "uacomapp.firebasestorage.app",
  messagingSenderId: "8265272205",
  appId: "1:8265272205:web:66bfbc4a58ee5184db8bc4",
  measurementId: "G-YW42H26WQZ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);