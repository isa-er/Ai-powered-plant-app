import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { RadioButton } from "react-native-paper";
import Papa from "papaparse";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import Modal from "react-native-modal";

import { doc, collection, setDoc} from "firebase/firestore";
import { auth, db } from "../../../firebase";

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const GEMINI_API_KEY = "AIzaSyCR9gWNdfwCfJLET5bHJCcqyQoVrzdm3gc";

const Secim = ({ navigation, route }) => {
  

  const saveTreatment = async () => {
    if (!selectedResponse) {
      alert("Lütfen bir tedavi seçiniz.");
      return;
    }
  
    const user = auth.currentUser;
  
    if (!user) {
      alert("Kullanıcı oturum açmamış.");
      return;
    }
  
    try {
      // Kullanıcı bilgileri
      const userId = user.uid;
  
      // Türkiye saati (GMT+3) formatında tarih
      const now = new Date();

  
      // Yeni belge için referans
      const treatmentDocRef = doc(collection(db, "users", userId, "tedaviler"));
  
      // Tedavi bilgileri
      const treatmentData = {
        selectedClass,
        cozumTercihi,
        cozumSuresi,
        yetistirmeYeri,
        tedavi: selectedResponse === "csv" ? response : aiResponse,
        kayıtTarihi: now
      };
  
      
  
      // Firestore'da belge oluştur
      await setDoc(treatmentDocRef, treatmentData);
  
      alert("Tedavi başarıyla kaydedildi.");
    } catch (error) {
      console.error("Tedavi kaydedilirken hata oluştu:", error);
      alert("Tedavi kaydedilirken bir hata oluştu.");
    }

    navigation.navigate("UserTabs", { screen: "Tedavi" });

  };
  



  const [cozumTercihi, setCozumTercihi] = useState(null);
  const [cozumSuresi, setCozumSuresi] = useState(null);
  const [yetistirmeYeri, setYetistirmeYeri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isYapayZekaActive, setIsYapayZekaActive] = useState(true);

  const { selectedClass } = route.params;

  const fetchAndParseCSV = async () => {
    try {
      setLoading(true);

      const storage = getStorage();
      const storageRef = ref(storage, "data/bitki_hastalik_tedavii.csv");

      const url = await getDownloadURL(storageRef);
      const response = await fetch(url);
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          

          const uygunTedavi = results.data.find(
            (row) =>
              row.Bitki_Hastalik === selectedClass &&
              row.Cozum === cozumTercihi &&
              row.Sure === cozumSuresi &&
              row.Mekan === yetistirmeYeri
          );

          if (uygunTedavi) {
            setResponse(uygunTedavi.Tedavi || "Tedavi bulunamadı.");
            setIsModalVisible(true);
          } else {
            setResponse("Tedavi bulunamadı.");
            setIsModalVisible(true);
          }
        },
        error: (error) => {
          console.error("CSV Ayrıştırma Hatası:", error);
          setResponse("CSV dosyası işlenirken hata oluştu.");
          setIsModalVisible(true);
        },
      });
    } catch (error) {
      console.error("CSV dosyası alınırken hata oluştu:", error);
      setResponse("Dosya alınamadı. Lütfen tekrar deneyin.");
      setIsModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const yapayzeka = async () => {
    if (!cozumTercihi || !cozumSuresi || !yetistirmeYeri) {
      alert("Lütfen tüm seçimleri yapınız.");
      return;
    }

    setLoading(true);
    setIsYapayZekaActive(false); // Butonu gizle

    const prompt = `${selectedClass} hastalığına sahip bitkim var. ${yetistirmeYeri}'nde yetiştiriyorum. ${cozumTercihi} bir çözüm aramaktayım. Bana ${cozumTercihi} bir tedavi öner. En fazla 50 kelime ile özetle.`;

    try {
      const apiResponse = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      const data = await apiResponse.json();
      console.log("API Yanıtı:", data);

      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        const resultText = data.candidates[0].content.parts
          .map((part) => part.text)
          .join(" ");
        setAiResponse(resultText);
      } else {
        setAiResponse("Yanıt alınamadı.");
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      setAiResponse("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleDevam = () => {
    if (!cozumTercihi || !cozumSuresi || !yetistirmeYeri) {
      alert("Lütfen tüm seçimleri yapınız.");
      return;
    }
    fetchAndParseCSV();
  };

  const back=()=>{
    navigation.navigate("UserTabs", { screen: "Photo" });
  }

  const resetSelections = () => {
    setCozumTercihi(null);
    setCozumSuresi(null);
    setYetistirmeYeri(null);
    setResponse("");
    setAiResponse("");
    setSelectedResponse(null);
    setIsYapayZekaActive(true);
    setIsModalVisible(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Seçim Ekranı</Text>
      <Text style={styles.subHeader}>
        Lütfen aşağıdaki kategorilerden birer seçim yapınız:
      </Text>

      {/* Çözüm Tercihi */}
      <Text style={styles.categoryTitle}>Çözüm Tercihi</Text>
      <RadioButton.Group
        onValueChange={(value) => setCozumTercihi(value)}
        value={cozumTercihi}
      >
        <View style={styles.radioRow}>
          <RadioButton value="kimyasal" />
          <Text style={styles.radioText}>Kimyasal</Text>
        </View>
        <View style={styles.radioRow}>
          <RadioButton value="doğal" />
          <Text style={styles.radioText}>Doğal</Text>
        </View>
      </RadioButton.Group>

      {/* Çözüm Süresi */}
      <Text style={styles.categoryTitle}>Çözüm Süresi</Text>
      <RadioButton.Group
        onValueChange={(value) => setCozumSuresi(value)}
        value={cozumSuresi}
      >
        <View style={styles.radioRow}>
          <RadioButton value="kısa vade" />
          <Text style={styles.radioText}>Kısa Vadeli</Text>
        </View>
        <View style={styles.radioRow}>
          <RadioButton value="uzun vade" />
          <Text style={styles.radioText}>Uzun Vadeli</Text>
        </View>
      </RadioButton.Group>

      {/* Yetiştirme Yeri */}
      <Text style={styles.categoryTitle}>Yetiştirme Yeri</Text>
      <RadioButton.Group
        onValueChange={(value) => setYetistirmeYeri(value)}
        value={yetistirmeYeri}
      >
        <View style={styles.radioRow}>
          <RadioButton value="ev" />
          <Text style={styles.radioText}>Ev</Text>
        </View>
        <View style={styles.radioRow}>
          <RadioButton value="bahçe" />
          <Text style={styles.radioText}>Bahçe</Text>
        </View>
        <View style={styles.radioRow}>
          <RadioButton value="sera" />
          <Text style={styles.radioText}>Sera</Text>
        </View>
      </RadioButton.Group>

      {/* Devam Butonu */}
      <TouchableOpacity style={styles.button} onPress={handleDevam}>
        <Text style={styles.buttonText}>Devam Et</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={back}>
        <Text style={styles.buttonText}>Geri Dön</Text>
      </TouchableOpacity>




      

      {/* Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={resetSelections}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={resetSelections}
          >
            <Text style={styles.modalCloseButtonText}>Seçim Ekranına Geri Dön</Text>
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Tedavi Önerileri</Text>

          {/* CSV Yanıtı */}
          {response && (
            
              <View>
                <Text style={styles.responseHeader}>CSV'den Gelen Tedavi</Text>
                <View style={styles.optionContainer}>
                  
                  <Text style={styles.modalText}>{response}</Text>
                  <RadioButton
                    value="csv"
                    status={selectedResponse === "csv" ? "checked" : "unchecked"}
                    onPress={() => setSelectedResponse("csv")}
                  />

                </View>
              </View>
          )}

          <View style={styles.divider} />

          {/* Yapay Zeka Yanıtı */}
          {aiResponse && (
          <View>
            <Text style={styles.responseHeader}>Yapay Zekâdan Gelen Tedavi</Text>
            <View style={styles.optionContainer}>
              
              <Text style={styles.modalText}>{aiResponse}</Text>
              <RadioButton
                value="ai"
                status={selectedResponse === "ai" ? "checked" : "unchecked"}
                onPress={() => setSelectedResponse("ai")}
              />

            </View>
          </View>
)}

          {/* Yapay Zekâya Sor Butonu */}
          {isYapayZekaActive && (
            <TouchableOpacity style={styles.modalButton} onPress={yapayzeka}>
              <Text style={styles.modalButtonText}>Yapay Zekâya Sor</Text>
            </TouchableOpacity>
          )}

          {/* Tedaviyi Kaydet Butonu */}
          <TouchableOpacity style={styles.modalButton} onPress={saveTreatment}>
            <Text style={styles.modalButtonText}>Tedaviyi Kaydet</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {loading && <ActivityIndicator size="large" color="#118B50" />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  
  divider:{
    height: 2, // Çizgi kalınlığı
    backgroundColor: "#CCCCCC", // Çizgi rengi
    marginVertical: 10, // Üst ve alt boşluk
    width: "100%", // Çizginin genişliği
  },

  responseHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#118B50",
    marginBottom: 5,
  },
  
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9F9F9",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#118B50",
  },
  subHeader: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
    color: "#555",
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  radioText: {
    fontSize: 16,
    marginLeft: 8,
    color: "#555",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#118B50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContainer: {
    backgroundColor: "yellow",
    borderRadius: 50,
    padding: 20,
    alignItems: "center",
  },
  modalCloseButton: {
    alignSelf: "flex-start",
    marginBottom: 30,
  },
  modalCloseButtonText: {
    color: "#118B50",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#118B50",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: "#118B50",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: "80%",
    alignItems: "center",
    elevation: 3,
  },
  modalButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  optionContainer: {
    
    alignItems: "center",
    marginBottom: 10,
  },
});

export default Secim;
