import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAV3JgVatxsrR5X9iCfFGbmd-AUk3l3JPs",
  authDomain: "detzit-7acc9.firebaseapp.com",
  databaseURL: "https://detzit-7acc9-default-rtdb.firebaseio.com",
  projectId: "detzit-7acc9",
  storageBucket: "detzit-7acc9.firebasestorage.app",
  messagingSenderId: "52359271416",
  appId: "1:52359271416:web:466e6f073f69a24d653c0d",
  measurementId: "G-7KLGQQBRLF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export default app;