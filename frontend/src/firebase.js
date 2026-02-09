// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Hardcoded fallback config (public Firebase config is safe to include in client code)
const fallbackConfig = {
    apiKey: "AIzaSyBvSdJmYCcLwlPNI0L5hKq6AZOb4IyQgBg",
    authDomain: "clawpay-f98f4.firebaseapp.com",
    projectId: "clawpay-f98f4",
    storageBucket: "clawpay-f98f4.firebasestorage.app",
    messagingSenderId: "1034567890",
    appId: "1:1034567890:web:abc123def456"
};

// Firebase config - use env vars if available, fallback to hardcoded
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackConfig.appId
};

// Debug log to check config
console.log('🔥 Firebase config:', {
    projectId: firebaseConfig.projectId,
    hasApiKey: !!firebaseConfig.apiKey
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
