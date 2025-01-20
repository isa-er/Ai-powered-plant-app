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
import { MaterialIcons, FontAwesome } from "react-native-vector-icons";

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
      //console.error("Tedavi kaydedilirken hata oluştu:", error);
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
      const storageRef = ref(storage, "data/bitki_hastalik_tedavii2.csv");

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
          //console.error("CSV Ayrıştırma Hatası:", error);
          setResponse("CSV dosyası işlenirken hata oluştu.");
          setIsModalVisible(true);
        },
      });
    } catch (error) {
      //console.error("CSV dosyası alınırken hata oluştu:", error);
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
      console.log("API Yanıtı:\n", data);
      console.log("Prompt:", prompt);

      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        const resultText = data.candidates[0].content.parts
          .map((part) => part.text)
          .join(" ");
        setAiResponse(resultText);
      } else {
        setAiResponse("Yanıt alınamadı.");
      }
    } catch (error) {
      //console.error("Gemini API error:", error);
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
    navigation.navigate("UserTabs", { screen: "Tahmin" });
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
    
    <ScrollView style={styles.container2}>
      <Text style={styles.header2}>Seçim Ekranı</Text>
      

 

      <Modal
  isVisible={isModalVisible}
  onBackdropPress={resetSelections}
  animationIn="slideInUp"
  animationOut="slideOutDown"
>
  <View style={styles.modalContainer2}>
    {/* Modal Başlık */}
    <Text style={styles.modalTitle2}>Tedavi Önerileri</Text>

    {/* CSV Yanıtı */}
    {response && (
      <View style={styles.responseContainer2}>
        <Text style={styles.responseHeader2}>Tedavi Önerimiz</Text>
        <View style={styles.optionContainer2}>
          <Text style={styles.responseText2}>{response}</Text>
          <RadioButton
            value="csv"
            status={selectedResponse === "csv" ? "checked" : "unchecked"}
            onPress={() => setSelectedResponse("csv")}
            color="#118B50"
          />
        </View>
      </View>
    )}

    <View style={styles.divider2} />

    {/* Yapay Zeka Yanıtı */}
    {aiResponse && (
      <View style={styles.responseContainer2}>
        <Text style={styles.responseHeader2}>Yapay Zeka Önerisi</Text>
        <View style={styles.optionContainer2}>
          <Text style={styles.responseText2}>{aiResponse}</Text>
          <RadioButton
            value="ai"
            status={selectedResponse === "ai" ? "checked" : "unchecked"}
            onPress={() => setSelectedResponse("ai")}
            color="#118B50"
          />
        </View>
      </View>
    )}

    {/* Yapay Zekâya Sor Butonu */}
    {isYapayZekaActive && (
      <TouchableOpacity style={styles.actionButton2} onPress={yapayzeka}>
        <Text style={styles.actionButtonText2}>Yapay Zekaya Sor</Text>
      </TouchableOpacity>
    )}

    {/* Tedaviyi Kaydet Butonu */}
    <TouchableOpacity style={styles.actionButton2} onPress={saveTreatment}>
      <Text style={styles.actionButtonText2}>Tedaviyi Kaydet</Text>
    </TouchableOpacity>

    {/* Modal Kapat Butonu */}
    <TouchableOpacity
      style={styles.closeButton2}
      onPress={resetSelections}
    >
      <Text style={styles.closeButtonText2}>Seçim Ekranına Geri Dön</Text>
    </TouchableOpacity>
  </View>
</Modal>






      {/* Seçim ekranında devam et'e bastıktan sonra */}
      {loading && <ActivityIndicator size="large" color="red" />}
    


    <View style={styles.container2}>
      


      {/* Çözüm Tercihi */}
      <View style={styles.categoryContainer2}>
        <Text style={styles.categoryTitle2}>Çözüm Tercihi</Text>
        <View style={styles.optionGroup2}>

          <TouchableOpacity style={styles.optionItem4} onPress={() => setCozumTercihi("kimyasal")}>
            <MaterialIcons name="science" size={30} color="#FF6F61" />
            <Text style={styles.optionText2}>Kimyasal</Text>
            <RadioButton
              value="kimyasal"
              status={cozumTercihi === "kimyasal" ? "checked" : "unchecked"}
              onPress={() => setCozumTercihi("kimyasal")}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem4} onPress={() => setCozumTercihi("doğal")}>
            <FontAwesome name="leaf" size={30} color="#FF6F61" />
            <Text style={styles.optionText2}>Doğal</Text>
            <RadioButton
              value="doğal"
              status={cozumTercihi === "doğal" ? "checked" : "unchecked"}
              onPress={() => setCozumTercihi("doğal")}
            />
          </TouchableOpacity>

        </View>
      </View>

      {/* Çözüm Süresi */}
      <View style={[styles.categoryContainer2, styles.altCategory2]} >
        <Text style={styles.categoryTitle2}>Çözüm Süresi</Text>
        <View style={styles.optionGroup2}>

          <TouchableOpacity style={styles.optionItem3} onPress={() => setCozumSuresi("kısa vade")}>
            <MaterialIcons name="timer" size={30} color="#1E90FF" />
            <Text style={styles.optionText2}>Kısa Vadeli</Text>
            <RadioButton
              value="kısa vade"
              status={cozumSuresi === "kısa vade" ? "checked" : "unchecked"}
              onPress={() => setCozumSuresi("kısa vade")}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem3} onPress={() => setCozumSuresi("uzun vade")}>
            <MaterialIcons name="hourglass-full" size={30} color="#1E90FF" />
            <Text style={styles.optionText2}>Uzun Vadeli</Text>
            <RadioButton
              value="uzun vade"
              status={cozumSuresi === "uzun vade" ? "checked" : "unchecked"}
              onPress={() => setCozumSuresi("uzun vade")}
            />
          </TouchableOpacity>

        </View>
      </View>

     


      {/* Yetiştirme Yeri */}
      <View style={[styles.categoryContainer2, styles.altCategory3]}>
        <Text style={styles.categoryTitle2}>Yetiştirme Yeri</Text>
        <View style={styles.optionGroup2}>

          <TouchableOpacity style={styles.optionItem2} onPress={() => setYetistirmeYeri("ev")}>
            <MaterialIcons name="home" size={30} color="#28A745" />
            <Text style={styles.optionText2}>Ev</Text>
            <RadioButton
              value="ev"
              status={yetistirmeYeri === "ev" ? "checked" : "unchecked"}
              onPress={() => setYetistirmeYeri("ev")}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem2} onPress={() => setYetistirmeYeri("bahçe")} >
            <MaterialIcons name="park" size={30} color="#28A745" />
            <Text style={styles.optionText2}>Bahçe</Text>
            <RadioButton
              value="bahçe"
              status={yetistirmeYeri === "bahçe" ? "checked" : "unchecked"}
              onPress={() => setYetistirmeYeri("bahçe")}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionItem2} onPress={() => setYetistirmeYeri("sera")}>
            <FontAwesome name="industry" size={30} color="#28A745" />
            <Text style={styles.optionText2}>Sera</Text>
            <RadioButton
              value="sera"
              status={yetistirmeYeri === "sera" ? "checked" : "unchecked"}
              onPress={() => setYetistirmeYeri("sera")}
            />
          </TouchableOpacity>
        </View>
      </View>






      {/* Butonlar */}
      <TouchableOpacity style={styles.button2} onPress={handleDevam}>
        <Text style={styles.buttonText2}>Devam Et</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button2, styles.backButton2]} onPress={back}>
        <Text style={styles.buttonText2}>Geri Dön</Text>
      </TouchableOpacity>

      {/* {loading && <ActivityIndicator size="large" color="yellow" />} */}

    </View>












    </ScrollView>
  );
};

const styles = StyleSheet.create({


  modalContainer2: {
    backgroundColor: '#FBF6E9',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle2: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#118B50',
    marginBottom: 20,
  },
  responseContainer2: {
    marginBottom: 15,
  },
  responseHeader2: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#118B50',
    marginBottom: 8,
  },
  responseText2: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    flex: 1,
    marginRight: 10,
  },
  optionContainer2: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F9ED',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  divider2: {
    height: 1,
    backgroundColor: '#CCC',
    marginVertical: 15,
  },
  actionButton2: {
    backgroundColor: '#118B50',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginVertical: 10,
    alignItems: 'center',
  },
  actionButtonText2: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FBF6E9',
  },
  closeButton2: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#FFE893',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText2: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  
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









  


  container2: {
    flex: 1,
    padding: 10,
    backgroundColor: "#F6FCDF",
    
  },
  header2: {

    fontSize: 24,
    fontWeight: "bold",
    color: "#34495E",
    marginBottom: 15,
    marginTop:15,
    textAlign: "center",
  },
  categoryContainer2: {
    backgroundColor: "#FF7777",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  altCategory2: {
    backgroundColor: "#73BBA3",
  },
  altCategory3: {
    backgroundColor: "#FA1A",
  },
  categoryTitle2: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2F3645",
    marginBottom: 15,
  },
  optionGroup2: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },




  



  optionItem2: {
    alignItems: "center",
    width: "30%",
    marginBottom: 0,
    borderWidth:2,
    borderRadius:10,
    borderColor:"#E6B9A6",
    padding:6,
    backgroundColor:"#DFFAAA",


  },
  optionItem3: {
    alignItems: "center",
    width: "40%",
    marginBottom: 0,
    borderWidth:2,
    borderRadius:10,
    borderColor:"#E6B9A6",
    padding:6,
    backgroundColor:"#DFFAAA",


  },
  optionItem4: {
    alignItems: "center",
    width: "40%",
    marginBottom: 0,
    borderWidth:2,
    borderRadius:10,
    borderColor:"#E6B9A6",
    padding:6,
    backgroundColor:"#DFFAAA",









  },
  optionText2: {
    fontSize: 18,
    fontWeight:"800",
    marginVertical: 5,
    textAlign: "center",
    color: "#555",
  },
  button2: {
    backgroundColor: "#118B50",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
    marginTop: 10,
  },
  backButton2: {
    backgroundColor: "#FF6F61",
  },
  buttonText2: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },









});

export default Secim;