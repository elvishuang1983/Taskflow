import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAGeEIGeXhzmMmNNC1hxOTdkzG-t3hS7Xc",
    authDomain: "taskflow-pro-2783b.firebaseapp.com",
    projectId: "taskflow-pro-2783b",
    storageBucket: "taskflow-pro-2783b.firebasestorage.app",
    messagingSenderId: "988493907810",
    appId: "1:988493907810:web:7570291513777e31890e3b",
    measurementId: "G-Z57N36FEQW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
