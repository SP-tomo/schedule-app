// =============================================
// Firebase Configuration
// =============================================
const firebaseConfig = {
  projectId: "undokai-30d94",
  appId: "1:335554252519:web:a95b4c8751dbf5665c1c42",
  databaseURL: "https://undokai-30d94-default-rtdb.asia-southeast1.firebasedatabase.app",
  storageBucket: "undokai-30d94.firebasestorage.app",
  apiKey: "AIzaSyAzQQi4EfY-uS1lYoSO4ziQ-d6KbwZBEmA",
  authDomain: "undokai-30d94.firebaseapp.com",
  messagingSenderId: "335554252519"
};

// Initialize Firebase
let firebaseApp;
let db;
let useFirebase = false;

try {
  if (typeof firebase !== 'undefined') {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    useFirebase = true;
    console.log('✅ Firebase initialized successfully');
  } else {
    console.log('ℹ️ Firebase SDK not loaded. Using local storage mode.');
  }
} catch (e) {
  console.warn('⚠️ Firebase initialization failed:', e);
}
