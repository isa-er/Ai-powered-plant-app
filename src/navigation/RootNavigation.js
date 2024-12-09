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
    // Kullanıcı oturum durumu dinleniyor
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Mevcut kullanıcıyı state'e kaydet
      setLoading(false); // Yükleme tamamlandı
    });

    return unsubscribe; // Dinleyiciyi temizle
  }, []);

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
};

export default RootNavigation;
