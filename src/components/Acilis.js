import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import  LinearGradient  from 'react-native-linear-gradient';

const Acilis = () => {
  return (
    <View style={styles.container}>
      {/* En Üstteki Başlık */}
      <Text style={styles.title}>Plant Care</Text>

      {/* Lottie Animasyon ve Yaprak Resmi */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/icons/leaf2.png')} // Yaprak resmi
          style={styles.leaf}
        />
        <LottieView
          source={require('../../assets/icons/b4.json')} // Lottie animasyonu
          autoPlay
          loop
          speed={2}
          style={styles.animation}
        />
      </View>

      {/* En Alttaki Yazı */}
      <Text style={styles.subtitle}>AI ile Bitki Sağlığı</Text>
    </View>
  );
};

const styles = StyleSheet.create({


  container: {
    flex: 1,
    justifyContent:"space-evenly", // Üst, Orta, ve Alt alanlar
    alignItems: 'center',
    backgroundColor: '#EFE3C2', // Sade bir arka plan rengi
    
  },
  title: {
    fontSize: 39,
    fontWeight: 'bold',
    color: '#3E7B27', // Koyu bir yazı rengi
    marginTop: 20,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 200,
    height: 200,
    position: 'relative',
    
  },
  leaf: {
    left:-70,
    width: 250,
    height: 250,
    position: 'absolute',
    zIndex: 0, // Yaprağı önde tutmak için
  },
  animation: {
    right:-70,
    width: 200,
    height: 2000,
    position: 'absolute',
    zIndex: 1, // Animasyonu arka planda tutmak için
  },
  subtitle: {
    fontSize: 18,
    color: '#85A947', // Alt yazı için hafif koyu bir ton
    marginBottom: 20,
  },
});

export default Acilis;
