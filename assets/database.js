import { initializeApp } from "firebase/app"
import { getFirestore } from 'firebase/firestore';

const NewfirebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "AUTH_DOMAIN",
  projectId: "PROJECT_ID",
  storageBucket: "STORAGE_BUCKET",
  messagingSenderId: "MESSAGING_SENDER_ID",
  appId: "APP_ID",
  measurementId: "MEASUREMENT_ID"
};
// Initialize Firebase


const app = initializeApp(NewfirebaseConfig);
export const db = getFirestore(app)