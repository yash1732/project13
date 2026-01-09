import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB7sHVE5GVu8iO8CrwHThyx1vW8d46Mo9g",
  authDomain: "gdgf-2b33c.firebaseapp.com",
  projectId: "gdgf-2b33c",
  storageBucket: "gdgf-2b33c.firebasestorage.app",
  messagingSenderId: "583533481206",
  appId: "1:583533481206:web:00869526577a238c81f0d7",
  measurementId: "G-01E2MR35LV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
export default app;
