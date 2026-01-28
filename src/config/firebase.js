// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8dk5luo3Sy3Wzz1PXDN44d0uB8_Sduo8",
  authDomain: "smartco-2d684.firebaseapp.com",
  projectId: "smartco-2d684",
  storageBucket: "smartco-2d684.firebasestorage.app",
  messagingSenderId: "941611759375",
  appId: "1:941611759375:web:ba94a43cd7717532acf07a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app