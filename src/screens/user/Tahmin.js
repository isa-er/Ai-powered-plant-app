import React, { useEffect, useState } from "react";
import {
  Button,
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  FlatList,
  Modal,
  TouchableOpacity,
} from "react-native";
import { collection, query, where, onSnapshot, doc, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../../firebase";
import { getAuth } from "firebase/auth";

const Tahmin = ({ navigation,route }) => {

  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    //console.error("No user is logged in.");
    return <Text>Error: No user is logged in.</Text>;
  }

  const userEmail = currentUser.email;
  const [predictions, setPredictions] = useState([]);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true); // Yüklenme durumu

  const getUserIdByEmail = async (email) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      //console.error("No user found with the given email");
      return null; // Hata fırlatmak yerine null döndür
    }

    return querySnapshot.docs[0].id;
  };

  useEffect(() => {
    let unsubscribe;

    const subscribeToPredictions = async () => {
      try {
        const userId = await getUserIdByEmail(userEmail);
        if (!userId) {
          console.log("Kullanıcı ID bulunamadı.");
          setPredictions([]); // Boş liste ayarla
          setLoading(false); // Yüklenme durumunu tamamla
          return;
        }

        const predictionsRef = collection(db, "users", userId, "predictions");
        const q = query(predictionsRef, orderBy("timestamp", "desc"));

        unsubscribe = onSnapshot(q, (snapshot) => {
          const updatedPredictions = [];
          snapshot.forEach((doc) => {
            updatedPredictions.push({ id: doc.id, ...doc.data() });
          });
          setPredictions(updatedPredictions);
        });
      } catch (error) {
        //console.error("Error fetching predictions:", error);
        Alert.alert("Hata", "Tahminler alınırken bir hata oluştu.");
        setPredictions([]); // Hata durumunda boş liste ayarla
      } finally {
        setLoading(false); // Yüklenme durumunu tamamla
      }
    };

    subscribeToPredictions();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userEmail]);

  const openModal = (item) => {
    setSelectedPrediction(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setSelectedPrediction(null);
    setModalVisible(false);
  };

  const goToSecim = () => {
    if (selectedPrediction) {
      navigation.navigate("Secim", { selectedClass: selectedPrediction.result });
      closeModal();
    }
  };

  const renderPrediction = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <Text style={styles.resultText}>Sınıfı: {item.result}</Text>
      <TouchableOpacity style={styles.detailButton} onPress={() => openModal(item)}>
        <Text style={styles.detailButtonText}>Detay</Text>
      </TouchableOpacity>
      <Text style={styles.dateText}>
      Tahmin Günü:{" "}
      
      {new Date(item.timestamp?.seconds * 1000).toLocaleString()}

      
    </Text>
      
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Veriler yükleniyor...</Text>
      </View>
    );
  }



  return (
    <View style={styles.container}>
      
      <Text style={styles.text}>Tahminler</Text>
      {predictions.length > 0 ? (
        <FlatList
          data={predictions}
          keyExtractor={(item) => item.id}
          renderItem={renderPrediction}
        />
      ) : (
        <Text style={styles.noDataText}>Henüz bir tahmin bulunmamaktadır.</Text>
      )}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          {selectedPrediction && (
            <>
              <Image source={{ uri: selectedPrediction.imageUrl }} style={styles.modalImage} />
              <Text style={styles.modalClass}>
                Sınıf: {selectedPrediction.result}
              </Text>
              <Text style={styles.modalDetail}>
                Güvenilirlik: {selectedPrediction.confidence.toFixed(2)}
              </Text>
              <Text style={styles.modalDetail}>
                Gün: {new Date(selectedPrediction.timestamp?.seconds * 1000).toLocaleString()}
              </Text>
              <TouchableOpacity style={styles.treatmentButton} onPress={goToSecim}>
                <Text style={styles.treatmentButtonText}>Tedavi Öner</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>Geri</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FEFAE0", // Açık arka plan
  },
  text: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#34495E", // Modern koyu gri ton
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#ECDFCC", // Beyaz kutucuk
    padding: 15,
    marginVertical: 10,
    borderRadius: 15,
    shadowColor: "#000", // Hafif gölge
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5, // Android için gölge
    alignItems: "center",
    borderColor: "#00425A", // Gri kenar çizgisi
    borderWidth: 1,
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0", // Hafif kenar çerçevesi
  },
  resultText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#186F65", // Koyu mavi-gri ton
    marginBottom: 5,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#7C444F", // Daha yumuşak gri ton
    marginBottom: 10,
    fontWeight:"800",
    marginTop:10,
  },
  detailButton: {
    backgroundColor: "#3498DB", // Mavi ton
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    width:"40%",
    alignItems:"center",
    marginTop:"7"
    
    
  },
  detailButtonText: {
    alignItems:"center",
    justifyContent:"center",
    color: "#FFF", // Beyaz yazı
    fontWeight: "bold",
    fontSize: 17,
  },
  modalContainer: {
    
    flex: 1,
    marginTop: "40%",
    marginBottom: "40%",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBF6E9", // Açık gri ton
    padding: 20,
    
  },
  modalImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  modalClass: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "bold",
    color: "#F87A53",
  },
  modalDetail: {
    fontSize: 18,
    fontWeight: "500",
    color: "#898121",
    marginTop: 5,
  },
  treatmentButton: {
    marginTop: 20,
    width: "50%",
    backgroundColor: "#1ABC9C", // Canlı yeşil
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  treatmentButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: 10,
    width: "50%",
    backgroundColor: "#E74C3C", // Canlı kırmızı
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  noDataText: {
    fontSize: 16,
    color: "#7F8C8D",
    textAlign: "center",
  },
});

export default Tahmin;
