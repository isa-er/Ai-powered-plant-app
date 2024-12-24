import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './AuthStack';
import UserStack from './UserStack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase'; // Firebase bağlantısı
import { View,ActivityIndicator } from 'react-native';


const RootNavigation = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Auto-login için yükleme durumu

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      //console.log("Auth State Changed:", currentUser?.email || "No user logged in");
      setUser(currentUser || null);
        if (currentUser) {
      setLoading(false);
    }
    });

    return unsubscribe; // Dinleyiciyi temizle
  }, []);

  // useEffect(() => {
  //   console.log("User state updated:", user);
  // }, [user]);
  
  
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

   return (
     <NavigationContainer>
       {user ? <UserStack /> : <AuthStack />}
     </NavigationContainer>
   );

  // return (
  //   <NavigationContainer>
  //     {user ? (
  //       <>
  //         {console.log("Rendering UserStack")}
  //         <UserStack />
  //       </>
  //     ) : (
  //       <>
  //         {console.log("Rendering AuthStack")}
  //         <AuthStack />
  //       </>
  //     )}
  //   </NavigationContainer>
  // );
  


};

export default RootNavigation;
