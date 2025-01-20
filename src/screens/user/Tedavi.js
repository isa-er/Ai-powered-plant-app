import React, { useState, useEffect } from "react";
import {
  Button,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert
} from "react-native";
import { collection, doc, deleteDoc, updateDoc ,onSnapshot,query,orderBy} from "firebase/firestore";
import { auth, db } from "../../../firebase";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Icon from "react-native-vector-icons/Ionicons";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";




const TedaviEkrani = ({navigation,route}) => {
  


  const [loading, setLoading] = useState(true);
  const [treatments, setTreatments] = useState([]);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [currentDateType, setCurrentDateType] = useState(""); // "baslangic" veya "bitis"
  const [currentTreatmentId, setCurrentTreatmentId] = useState(null); // Tarih için seçilen kart
  const [addingNote, setAddingNote] = useState(null);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    const fetchTreatments = () => {
      const user = auth.currentUser;

      if (!user) {
        alert("Kullanıcı oturum açmamış.");
        return;
      }

      const userId = user.uid;
      

      const treatmentsRef = collection(db, "users", userId, "tedaviler");
      const treatmentsQuery = query(treatmentsRef, orderBy("kayıtTarihi", "desc"));

      const unsubscribe = onSnapshot(
        treatmentsQuery,
        (snapshot) => {
          const treatmentsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          
          setTreatments(treatmentsData);
          setLoading(false);
        },
        (error) => {
          //console.error("Tedaviler yüklenirken hata oluştu:", error);
          alert("Tedaviler yüklenirken bir hata oluştu.");
        }
      );

      return () => unsubscribe();
    };

    fetchTreatments();
  }, []);

  const handleDateConfirm = (date) => {
    setDatePickerVisibility(false);

    if (!currentTreatmentId) return;

    const formattedDate = `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getFullYear()}`;

    const userId = auth.currentUser.uid;
    const treatmentRef = doc(db, "users", userId, "tedaviler", currentTreatmentId);

    updateDoc(treatmentRef, {
      [`${currentDateType}Tarihi`]: formattedDate,
    })
      .then(() => {
        alert(
          `${currentDateType === "baslangic" ? "Başlangıç" : "Bitiş"} tarihi kaydedildi.`
        );
      })
      .catch((error) => {
        //console.error("Tarih kaydedilirken hata oluştu:", error);
        alert("Tarih kaydedilirken bir hata oluştu.");
      });
  };

  

  const deleteTreatment = (id) => {
    Alert.alert(
      "Silme Onayı",
      "Tedaviyi silmek istediğinizden emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel", // Kullanıcı silmek istemezse işlem iptal edilir
        },
        {
          text: "Evet",
          onPress: async () => {
            try {
              const userId = auth.currentUser.uid;
              const treatmentRef = doc(db, "users", userId, "tedaviler", id);
              await deleteDoc(treatmentRef);
              alert("Tedavi silindi.");
            } catch (error) {
              //console.error("Tedavi silinirken hata oluştu:", error);
              alert("Tedavi silinirken bir hata oluştu.");
            }
          },
        },
      ]
    );
  };


  const saveNote = async (treatmentId) => {
    try {
      const userId = auth.currentUser.uid;
      const treatmentRef = doc(db, "users", userId, "tedaviler", treatmentId);

      await updateDoc(treatmentRef, {
        not: newNote,
      });

      setAddingNote(null);
      alert("Not kaydedildi.");
    } catch (error) {
      //console.error("Not kaydedilirken hata oluştu:", error);
      alert("Not kaydedilirken bir hata oluştu.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#118B50" />
        <Text style={styles.loadingText}>Veriler Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>


      <Text style={styles.header}>Tedavi Ekranı</Text>
      {treatments.length > 0 ? (
        treatments.map((treatment) => (
          <View key={treatment.id} style={styles.card}>
            <Text style={styles.cardTitle}>{treatment.selectedClass}</Text>
            <Text style={styles.cardDetail}>
              Çözüm Tercihi: {treatment.cozumTercihi}
            </Text>
            <Text style={styles.cardDetail}>
              Çözüm Süresi: {treatment.cozumSuresi}
            </Text>
            <Text style={styles.cardDetail}>
              Yetiştirme Yeri: {treatment.yetistirmeYeri}
            </Text>
            <Text style={styles.cardDetail}>
              Tedavi: {treatment.tedavi}
            </Text>
            {treatment.baslangicTarihi && (
              <Text style={styles.cardDetail}>
                Başlangıç Tarihi: {treatment.baslangicTarihi}
              </Text>
            )}
            
            {treatment.bitisTarihi && (
              <Text style={styles.cardDetail}>
                Bitiş Tarihi: {treatment.bitisTarihi}
              </Text>
            )}

            {treatment.not && (
              <Text style={styles.cardDetail}>
                Not: {treatment.not}
              </Text>
            )}


          <Text style={styles.cardDate}>
            Tedavi Kayıt Tarihi:{" "}
            {treatment.kayıtTarihi?.toDate
              ? treatment.kayıtTarihi.toDate().toLocaleString("tr-TR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Bilinmiyor"}
          </Text>

            

            

            <View style={styles.buttonContainer}>
              

              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setCurrentDateType("baslangic");
                  setCurrentTreatmentId(treatment.id);
                  setDatePickerVisibility(true);
                }}
              >
                <Icon name="calendar-outline" size={18} color="#FFF" />
                <Text style={styles.buttonText}>Başlangıç Tarihi </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setCurrentDateType("bitis");
                  setCurrentTreatmentId(treatment.id);
                  setDatePickerVisibility(true);
                }}
              >
                <Icon name="calendar-outline" size={18} color="#FFF" />
                <Text style={styles.buttonText}>Bitiş Tarihi</Text>
              </TouchableOpacity>


              <TouchableOpacity
                style={styles.button2}
                onPress={() => deleteTreatment(treatment.id)}
              >
                <Icon name="trash-outline" size={18} color="#FFF" />
                <Text style={styles.buttonText}>Tedaviyi Sil</Text>
              </TouchableOpacity>


              <TouchableOpacity
                style={styles.button3}
                onPress={() => setAddingNote(treatment.id)}
              >
                <Icon name="create-outline" size={18} color="#FFF" />
                <Text style={styles.buttonText}>Not Ekle</Text>
              </TouchableOpacity>
            </View>

            {addingNote === treatment.id && (
              <View style={styles.noteInputContainer}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Not ekleyin..."
                  value={newNote}
                  onChangeText={setNewNote}
                />
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => saveNote(treatment.id)}
                >
                  <Text style={styles.buttonText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            )}

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              onConfirm={handleDateConfirm}
              onCancel={() => setDatePickerVisibility(false)}
            />
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>Kayıtlı tedavi bulunamadı.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({



















  container: {
    padding: 20,
    backgroundColor: "#CBE2B5",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#118B50",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#E3F0AF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#118B50",
    marginBottom: 10,
  },
  cardDetail: {
    fontWeight: "700",
    fontSize: 15,
    color: "#674636",
    marginBottom: 10, // Daha geniş boşluk
    paddingBottom: 5,
    borderBottomColor: "rgba(103, 70, 54, 0.2)", // Şık bir tonlama
    borderBottomWidth: 2, // İnce çizgi
  },
  cardDate: {
    fontWeight:"400",
    fontSize: 14,
    color: "#4F6F52",
    marginTop: 10,
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap", // Taşmaları engellemek için wrap
    justifyContent: "space-between",
    marginTop: 15,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#47A992",
    padding: 10,
    borderRadius: 8,
    width: "48%", // Butonlar yan yana sığsın
    marginBottom: 10, // Alt boşluk
  },


  button2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C51605",
    padding: 10,
    borderRadius: 8,
    width: "48%", // Butonlar yan yana sığsın
    marginBottom: 10, // Alt boşluk
  },

  button3: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5F8D4E",
    padding: 10,
    borderRadius: 8,
    width: "48%", // Butonlar yan yana sığsın
    marginBottom: 10, // Alt boşluk
  },


  buttonText: {
    color: "#F8FAE5",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  noteInputContainer: {
    marginTop: 15,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 10,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  saveButton: {
    alignSelf: "flex-start",
    backgroundColor: "#118B50",
    padding: 10,
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginTop: 20,
  },
});


export default TedaviEkrani;
