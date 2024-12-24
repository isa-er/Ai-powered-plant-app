import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { auth} from '../../../firebase';
import { signOut } from 'firebase/auth';

import { collection, query, where, onSnapshot, doc, getDocs, orderBy ,getDoc} from "firebase/firestore";
import { db } from "../../../firebase";

const Home = ({ navigation }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(""); // Kullanıcı adı için state


  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=24c7403fd1124a0a8da183412242312&q=Kars&aqi=no&lang=tr`
        );
        const data = await response.json();

        if (response.ok) {
          setWeather(data);
        } else {
          console.error('Hava durumu API hatası:', data.error.message);
          alert('Hava durumu verisi alınamadı.');
        }
      } catch (error) {
        console.error('Hava durumu alınırken hata oluştu:', error);
        alert('Hava durumu bilgisi alınırken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

  }, []);


  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const currentUser = auth.currentUser; // Oturum açmış kullanıcıyı al
        if (currentUser) {
          const userDoc = doc(db, "users", currentUser.uid); // Kullanıcı belgesi
          const docSnap = await getDoc(userDoc);
  
          if (docSnap.exists()) {
            setUserName(docSnap.data().name); // Kullanıcı adını ayarla
          } else {
            console.log("Kullanıcı verisi bulunamadı!");
          }
        }
      } catch (error) {
        console.error("Kullanıcı adı alınırken hata:", error);
      }
    };
    fetchUserName(); 
  }, []);
  


  const handleSignOut = async () => {
    try {
      await signOut(auth);
      //navigation.navigate('Login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#118B50" />
        <Text>Veriler Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Merhaba, {userName}!</Text>
      {weather ? (
        <View style={styles.weatherContainer}>
          <Text style={styles.weatherText}>
            {weather.location.name} - {weather.current.condition.text}
          </Text>
          <Text style={styles.weatherTemp}>{weather.current.temp_c}°C</Text>
        </View>
      ) : (
        <Text style={styles.errorText}>Hava durumu bilgisi alınamadı.</Text>
      )}
      <Button title="Profil" onPress={() => navigation.navigate('Profile')} />
      <Button title="Çıkış Yap" onPress={handleSignOut} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  weatherContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  weatherText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  weatherTemp: {
    fontSize: 24,
    color: '#118B50',
  },
  errorText: {
    fontSize: 16,
    color: '#FF0000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Home;
