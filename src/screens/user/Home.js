import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,modalVisible,modalContent,Image
  
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { auth, db } from "../../../firebase";
import { doc, getDoc,collection,getDocs } from "firebase/firestore";
import { BarChart } from "react-native-chart-kit";
import Loading from "../../components/Loading";
import Acilis from "../../components/Acilis";



// new Date() in dönüşümnden kaynaklanıyor olabilir. 80. ve 222. satırlara bak




const Home = ({ navigation }) => {

 

  const [weather, setWeather] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [sunlightHours, setSunlightHours] = useState(null);
  const [windSpeed, setWindSpeed] = useState(null); // Rüzgar hızı
  const [uvIndex, setUvIndex] = useState(null); // Güneş UV indeksi
  const [conditionText, setConditionText] = useState(null); // Hava durumu açıklaması

  const [userName, setUserName] = useState("");
  const [sehir, setSehir] = useState(""); // Kullanıcı adı için state

  const [toplamTahminler, setToplamTahminler] = useState(0)
  const [toplamTedaviler, setToplamTedaviler] = useState(0)
  const [tedaviAltında, setTedaviAltında] = useState(0); // Tedavi altındaki bitki sayısı
  const [tedavisiBiten, setTedavisiBiten] = useState(0); // Tedavisi bitmiş bitki sayısı
  const [tedavisiBaslanacak, setTedavisiBaslanacak] = useState(0);
  const [bitkiListesi, setBitkiListesi] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const [loading, setLoading] = useState(true); // Tüm işlemler tamamlanana kadar yükleme durumu


  const hexToRgba = (hex, opacity = 1) => {
    const bigint = parseInt(hex.replace("#", ""), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
  
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  
  
  
    const fetchTedaviData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
  
        const tedaviRef = collection(db, "users", currentUser.uid, "tedaviler");
        const tedaviSnapshot = await getDocs(tedaviRef);

        const resimRef = collection(db, "users", currentUser.uid, "predictions");
        const resimSnapshot = await getDocs(resimRef);

        

        
  
        let tedaviAltındaCount = 0;
        let tedavisiBitenCount = 0;
        let tedavisiBaslanacakCount = 0;
        let bitkiler = [];
  
        const today = new Date();
        const formattedToday = new Date(today); // Sadece tarih bileşeni
        
  
        tedaviSnapshot.forEach((doc) => {
          const data = doc.data();
          const baslangicTarihi = data.baslangicTarihi || null;
          const bitisTarihi = data.bitisTarihi || null;
    
          const baslangic = baslangicTarihi ? new Date(baslangicTarihi.split("-").reverse().join("-")) : null;
          const bitis = bitisTarihi ? new Date(bitisTarihi.split("-").reverse().join("-")) : null;
    
          if (baslangic && bitis) {
            if (formattedToday >= baslangic && formattedToday <= bitis) {
              tedaviAltındaCount++;
            } else if (formattedToday > bitis) {
              tedavisiBitenCount++;
            } else if (formattedToday < baslangic) {
              tedavisiBaslanacakCount++;
            }
          }
    
          bitkiler.push({ ...data, id: doc.id });
        });


        // resimSnapshot.forEach((doc) => {
        //   const data = doc.data();
        //   const baslangicTarihi = data.baslangicTarihi || null;
        //   const bitisTarihi = data.bitisTarihi || null;
    
        //   const baslangic = baslangicTarihi ? new Date(baslangicTarihi.split("-").reverse().join("-")) : null;
        //   const bitis = bitisTarihi ? new Date(bitisTarihi.split("-").reverse().join("-")) : null;
    
        //   if (baslangic && bitis) {
        //     if (formattedToday >= baslangic && formattedToday <= bitis) {
        //       tedaviAltındaCount++;
        //     } else if (formattedToday > bitis) {
        //       tedavisiBitenCount++;
        //     } else if (formattedToday < baslangic) {
        //       tedavisiBaslanacakCount++;
        //     }
        //   }
    
        //   bitkiler.push({ ...data, id: doc.id });
        // });



        
      
  
        setTedaviAltında(tedaviAltındaCount);
        setTedavisiBiten(tedavisiBitenCount);
        setTedavisiBaslanacak(tedavisiBaslanacakCount);
        setBitkiListesi(bitkiler);




      } catch (error) {
        //console.error("Tedavi verileri alınırken hata:", error);
      }
    };


  
    const loadData = async () => {
      await fetchTedaviData();
      setLoading(false);
    };

    useEffect(() => {
      loadData();
    }, []);



    const openModal = (type) => {
      let content = null;
    
      if (type === "tahmin") {
        content = (
          <Text style={styles.cardtext} >Şu ana kadar toplam {toplamTahminler} tahmin yaptınız.</Text>
        );
      } 
      
      
      
      
      else if (type === "tedaviAltında") {
        content = bitkiListesi
          .filter((bitki) => {
            if (!bitki.baslangicTarihi || !bitki.bitisTarihi) {
              return false; // Eğer tarihler tanımlı değilse, bu bitkiyi filtreleme
            }
    
            const baslangic = new Date(bitki.baslangicTarihi.split("-").reverse().join("-"));
            const bitis = new Date(bitki.bitisTarihi.split("-").reverse().join("-"));

            
    
            return baslangic <= new Date() && bitis >= new Date();
          })
          .map((bitki) => (
            <View key={bitki.id} style={styles.bitkiItem}>
            <Image source={{ uri: bitki.imageUrl }} style={styles.bitkiImage} />
            <Text style={styles.cardtext} >Adı: {bitki.selectedClass}</Text>
            <Text style={styles.cardtext}>Bitiş Tarihi: {bitki.bitisTarihi}</Text>
          </View>
          ));
      } 
      
      
      
      
      
      else if (type === "tedavisiBiten") {
        content = bitkiListesi
          .filter((bitki) => {
            if (!bitki.bitisTarihi) {
              return false; // Eğer bitiş tarihi tanımlı değilse, bu bitkiyi filtreleme
            }
    
            const bitis = new Date(bitki.bitisTarihi.split("-").reverse().join("-"));
    
            return bitis < new Date();
          })
          .map((bitki) => (
            <View key={bitki.id} style={styles.bitkiItem}>
              <Text style={styles.cardtext} >Adı: {bitki.selectedClass}</Text>
              <Text style={styles.cardtext}>Bitiş Tarihi: {bitki.bitisTarihi}</Text>
            </View>
          ));
      } 
      
      
      
      
      else if (type === "tedavisiBaslanacak") {
        content = bitkiListesi
          .filter((bitki) => {
            if (!bitki.baslangicTarihi) {
              return false; // Eğer başlangıç tarihi tanımlı değilse, bu bitkiyi filtreleme
            }
    
            const baslangic = new Date(bitki.baslangicTarihi.split("-").reverse().join("-"));
            //console.log("baslangic",baslangic)
    
            return baslangic > new Date();
          })
          .map((bitki) => (
            <View key={bitki.id} style={styles.bitkiItem}>
              <Text style={styles.cardtext}>Adı: {bitki.selectedClass}</Text>
              <Text style={styles.cardtext}>Başlangıç Tarihi: {bitki.baslangicTarihi}</Text>
            </View>
          ));
      }
    
      setModalContent(content);
      setModalVisible(true);

    };
    


  

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userDoc);
          if (docSnap.exists()) {
            setUserName(docSnap.data().name);
            setSehir(docSnap.data().city);


            // predictions koleksiyonunu al
            const predictionsRef = collection(db, "users", currentUser.uid, "predictions");
            const predictionsSnap = await getDocs(predictionsRef);


            // predictions koleksiyonunu al
            const tedavilerRef = collection(db, "users", currentUser.uid, "tedaviler");
            const tedavilerSnap = await getDocs(tedavilerRef);

            let confidenceValues = [];
            let totalPredictions = 0;
            let totalTedaviler = 0;

            predictionsSnap.forEach((doc) => {
              //confidenceValues.push(doc.data().confidence);
              totalPredictions++; // doküman sayısını artır
            });

            tedavilerSnap.forEach((doc) => {
              //confidenceValues.push(doc.data().confidence);
              totalTedaviler++; // doküman sayısını artır
            });

            setToplamTahminler(totalPredictions) // toplam tahmin sayısı
            setToplamTedaviler(totalTedaviler) // toplam tahmin sayısı
            
          }
        }
      } catch (error) {
        //console.error("Kullanıcı bilgisi alınırken hata:", error);
      }
    };

    const fetchWeather = async () => {
      if (!sehir) return; // Şehir bilgisi yoksa bekle
      try {
        const response = await fetch(
          `api key`
        );
        const data = await response.json();
        setWeather(data.current.temp_c);
        setHumidity(data.current.humidity);
        setWindSpeed(data.current.wind_kph); // Rüzgar hızını al
        setUvIndex(data.current.uv); // UV indeksini al
        setConditionText(data.current.condition.text); // Hava durumu açıklamasını al
      } catch (error) {
        //console.error("Hava durumu alınırken hata:", error);
      }
    };

    const fetchSunlight = () => {
      // Sabit bir veri ya da farklı bir API kullanılabilir.
      setSunlightHours(6);
    };

    
    
    const loadData = async () => {
      await fetchUserInfo();
      await fetchWeather();
      await fetchSunlight();
      
      setLoading(false); // Tüm işlemler tamamlandıktan sonra yükleme durumunu kapat
    };

    loadData();
  }, [sehir]);

  if (loading) {
    return (
      <Acilis/>
    );
  }


  
  return (
    <ScrollView style={styles.container}>
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {modalContent}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Merhaba, {userName}</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate("Profile")}
        >
          <Icon name="user" size={20} color="#FFF" />
          <Text style={styles.profileButtonText}>Profil</Text>
        </TouchableOpacity>
      </View>
  
      {/* Weather and Stats Section */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Hava Durumu ve Bitki İstatistikleri</Text>
  
        <View style={styles.weatherContainer}>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherLabel}>Şehir</Text>
            <Text style={styles.weatherValue}>{sehir || "Bilgi Yok"}</Text>
          </View>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherLabel}>Durum</Text>
            <Text style={styles.weatherValue}>{conditionText || "Bilgi Yok"}</Text>
          </View>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherLabel}>Sıcaklık</Text>
            <Text style={styles.weatherValue}>
              {weather !== null ? `${weather}°C` : "Bilgi Yok"}
            </Text>
          </View>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherLabel}>Nem</Text>
            <Text style={styles.weatherValue}>
              {humidity !== null ? `${humidity}%` : "Bilgi Yok"}
            </Text>
          </View>
          <View style={styles.weatherItem}>
            <Text style={styles.weatherLabel}>Rüzgar Hızı</Text>
            <Text style={styles.weatherValue}>
              {windSpeed !== null ? `${windSpeed} km/sa` : "Bilgi Yok"}
            </Text>
          </View>
          


          <View style={styles.weatherItem}>
            <Text style={styles.weatherLabel}>Gün Işığı</Text>
            <Text style={styles.weatherValue}>
              {sunlightHours !== null ? `${sunlightHours} saat` : "Bilgi Yok"}
            </Text>
          </View>


        </View>
      </View>
  
      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.statsItem} onPress={() => openModal("tahmin")}>
          <Icon name="line-chart" size={30} color="#118B50" />
          <Text style={styles.statsLabel}>Tahmin Sayısı</Text>
          <Text style={styles.statsValue}>{toplamTahminler}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statsItem} onPress={() => openModal("tedaviAltında")}>
          <Icon name="hourglass-half" size={30} color="#FFC107" />
          <Text style={styles.statsLabel}>Tedavi Altında</Text>
          <Text style={styles.statsValue}>{tedaviAltında}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statsItem} onPress={() => openModal("tedavisiBiten")}>
          <Icon name="check-circle" size={30} color="#4CAF50" />
          <Text style={styles.statsLabel}>Tedavisi Biten</Text>
          <Text style={styles.statsValue}>{tedavisiBiten}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statsItem} onPress={() => openModal("tedavisiBaslanacak")}>
          <Icon name="calendar-plus-o" size={30} color="#118B50" />
          <Text style={styles.statsLabel}>Tedavisi Başlanacak</Text>
          <Text style={styles.statsValue}>{tedavisiBaslanacak}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
  


};

const styles = StyleSheet.create({



  loaderContainer:{
    flex: 1,
    backgroundColor: "#F0F0F0",
    padding: 20,
    justifyContent:"center",
    alignItems:"center",

  },

  loaderText:{
    fontWeight:"800",
    fontSize:22,
  }
  ,


  cardtext:{
    fontSize:16,
    fontWeight:"bold",
    color:"brown",
    
    
    
  },


  bitkiItem: {
    fontSize:24,
    fontWeight:"bold",
    padding:10,
    borderBottomColor:"#5CB338",
    borderBottomWidth:4,
    borderBottomEndRadius:20,
    borderBottomLeftRadius:20,
    marginBottom:20,
  
},
  container: {
    flex: 1,
    backgroundColor: "#F0F0F0",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#118B50",
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#118B50",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginLeft: 10,
  },
  profileButtonText: {
    color: "#FFF",
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  infoBox: {
    padding: 20,
    backgroundColor: "#FFF",
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#118B50",
    textAlign: "center",
    marginBottom: 15,
  },
  weatherContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  weatherItem: {
    width: "48%", // İki sütun görünümü için genişlik
    backgroundColor: "#E9F5DB",
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
  },
  weatherLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#118B50",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statsItem: {
    width: "48%",
    backgroundColor: "#FFF",
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
  },
  statsLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 5,
    textAlign: "center",
  },
  statsValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#118B50",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  
    
  },
  modalContent: {
    backgroundColor: "#ECE852",
    padding: 20,
    borderRadius: 20,
    width: "80%",
  },
  closeButton: {
    backgroundColor: "#118B50",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});

export default Home;
