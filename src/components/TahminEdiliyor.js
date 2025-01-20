import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import LottieView from "lottie-react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase"; // Firestore bağlantısı

import * as Font from "expo-font";
import AppLoading from "expo-app-loading";

const TahminEdiliyor = () => {

  const loadFonts = () => {
    return Font.loadAsync({
      "Roboto-Regular": require("../../assets/fonts/Roboto/Roboto-MediumItalic.ttf"),
      "Roboto-Black": require("../../assets/fonts/Roboto/Roboto-BlackItalic.ttf"),
      
    });
  };

  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    loadFonts()
      .then(() => setFontsLoaded(true))
      .catch((e) => console.error(e));
  }, []);


  const [oneriler, setOneriler] = useState([]);
  const [rastgeleMetin, setRastgeleMetin] = useState("");

  useEffect(() => {
    // Firestore'dan önerileri çek
    const fetchOneriler = async () => {
      const querySnapshot = await getDocs(collection(db, "oneriler"));
      const data = querySnapshot.docs.map((doc) => doc.data().bilgi);
      setOneriler(data);
      // Rastgele bir metin başlangıçta seç
      setRastgeleMetin(data[Math.floor(Math.random() * data.length)]);
    };
    fetchOneriler();
  }, []);

  const rastgeleSec = () => {
    if (oneriler.length > 0) {
      const randomText = oneriler[Math.floor(Math.random() * oneriler.length)];
      setRastgeleMetin(randomText);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>TAHMİN EDİLİYOR...</Text>
      <LottieView
        source={require("../../assets/icons/b1.json")} // Lottie animasyon dosyası
        autoPlay
        loop
        speed={1}
        style={styles.lottie}
      />

      <Text style={styles.ipucu} >ipucu</Text>
      <View style={styles.suggestionContainer}>
        
        <Text style={styles.suggestionText}>{rastgeleMetin}</Text>
        <TouchableOpacity onPress={rastgeleSec} style={styles.iconButton}>
          <Text>🔄</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TahminEdiliyor;

const styles = StyleSheet.create({


  ipucu:{
    marginBottom:0,
    fontSize:20,
    fontWeight:"600",
    color:"green"
  },

  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f8ff", // Açık bir arka plan
    padding: 20,
  },
  header: {
    fontWeight: "bold",
    fontSize: 24,
    color: "#1e90ff", // Mavi ton
    marginBottom: 20,
  },
  lottie: {
    height: 300,
    width: 300,
    marginBottom:0
    
  },
  suggestionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fffacd", // Hafif sarı arka plan
    padding: 15,
    borderRadius: 20,
    width: "90%", // Genişlik sabit
    height:120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 20,
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    textAlign: "left", // Metni sola yasla
    fontFamily: "Roboto-Black",
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: "#1e90ff", // Mavi ton
    borderRadius: 20, // Yuvarlak buton
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginLeft: 10, // Yazıyla buton arasında boşluk
  },
});
