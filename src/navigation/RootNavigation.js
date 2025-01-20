import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './AuthStack';
import UserStack from './UserStack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase'; // Firebase bağlantısı
import { View,ActivityIndicator } from 'react-native';
import Loading from '../components/Loading';
import Acilis from '../components/Acilis';


const RootNavigation = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Auto-login için yükleme durumu
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    //console.log("wAA")
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      //console.log("Auth State Changed:", currentUser?.email || "No user logged in");
      setUser(currentUser || null);
      setLoading(false);
    });
    return unsubscribe; // Dinleyiciyi temizle
  }, []);

  // useEffect(() => {
  //   console.log("User state updated:", user);
  // }, [user]);
  
  
  if (loading) {
    return (
      <Acilis/>
    );
  }

  
  

    return (
      <NavigationContainer>
        {user ? <UserStack /> : <AuthStack />}
      </NavigationContainer>
    );

  //  return (
  //    <NavigationContainer>
  //      {user ? (
  //        <>
  //          {console.log("Rendering UserStack")}
  //          <UserStack />
  //        </>
  //      ) : (
  //        <>
  //          {console.log("Rendering AuthStack")}
  //          <AuthStack />
  //        </>
  //      )}
  //    </NavigationContainer>
  //  );
  


};

export default RootNavigation;
