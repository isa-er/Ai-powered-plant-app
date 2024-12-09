import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator ,Button} from 'react-native';
import { auth, db } from '../../../firebase'; // Firebase bağlantısı
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Loading from '../../components/Loading';



const Home = ({navigation}) => {

  const handleSignOut = async () => {
    try {
      await signOut(auth); // Firebase çıkış işlemi
      Alert.alert('Çıkış Yapıldı', 'Başarıyla çıkış yaptınız!');
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
      console.error(error);
    }
  };


  const [userData, setUserData] = useState(null); // Kullanıcı verisi
  const [loading, setLoading] = useState(true); // Yükleniyor durumu

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser; // Mevcut kullanıcı
        if (currentUser) {
          const docRef = doc(db, 'users', currentUser.uid); // Kullanıcıya ait belge
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserData(docSnap.data()); // Veriyi state'e kaydet
          } else {
            console.log('Kullanıcı verisi bulunamadı!');
          }
        }
      } catch (error) {
        console.error('Veri alınırken hata:', error);
      } finally {
        setLoading(false); // Yükleme tamamlandı
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    <Loading/>
  }

  return (
    <View style={styles.container}>
      {userData ? (
        <>
          <Text style={styles.title}>Merhaba, {userData.name}!</Text>
          <Text style={styles.info}>Email: {userData.email}</Text>
          <Text style={styles.info}>Kayıt Tarihi: {userData.createdAt?.toDate().toLocaleString()}</Text>
          <Button title="Çıkış Yap" onPress={handleSignOut} />
          
        </>
      ) : (
        <Loading></Loading>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  info: {
    fontSize: 16,
    marginBottom: 5,
  },
});

export default Home;
