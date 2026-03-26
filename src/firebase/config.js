import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase project config from console.firebase.google.com
const firebaseConfig = {
  apiKey: "AIzaSyCAL4z4UIQ5Ko4Rjyt39uYRgZHhMrxQHDE",
  authDomain: "cablecollection-494f0.firebaseapp.com",
  projectId: "cablecollection-494f0",
  storageBucket: "cablecollection-494f0.firebasestorage.app",
  messagingSenderId: "188015650256",
  appId: "1:188015650256:web:c15e7cb15589e39aeb05d5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
