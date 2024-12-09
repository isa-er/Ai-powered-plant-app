import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDNhhkFOw5Z8FOWBTnmshMgNokz3tibgE0",
    authDomain: "test-app-a13f2.firebaseapp.com",
    projectId: "test-app-a13f2",
    storageBucket: "test-app-a13f2.firebasestorage.app",
    messagingSenderId: "508345980397",
    appId: "1:508345980397:web:9207dc8cf298ec58b743e4"
  };

// Firebase Initialization
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

export { db ,auth};