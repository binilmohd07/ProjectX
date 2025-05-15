// src/app/firebase.config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyA3d6vOat56mbcTyj1l1TwRh0_gc4ULCAA",
    authDomain: "projectx-8945b.firebaseapp.com",
    // authDomain: "localhost:4200/auth/callback",
    projectId: "projectx-8945b",
    storageBucket: "projectX.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "25524705340"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase Auth
export const auth = getAuth(app);
