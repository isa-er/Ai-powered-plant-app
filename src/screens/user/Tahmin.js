import React, { useEffect, useState } from "react";
import {
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

const Tahmin = ({ navigation }) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error("No user is logged in.");
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
      console.error("No user found with the given email");
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
        console.error("Error fetching predictions:", error);
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
    backgroundColor: "white",
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 10,
    borderRadius: 10,
  },
  resultText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  detailButton: {
    marginTop: 10,
    backgroundColor: "#FF8C00",
    padding: 10,
    borderRadius: 10,
  },
  detailButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    marginTop: "40%",
    marginBottom: "40%",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(23, 175, 68)",
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
    color: "black",
  },
  modalDetail: {
    fontSize: 18,
    fontWeight: "500",
    color: "black",
    marginTop: 5,
  },
  treatmentButton: {
    marginTop: 20,
    width: "50%",
    backgroundColor: "#5FC9C4",
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
    backgroundColor: "#FF5C5C",
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
    color: "#888",
    textAlign: "center",
  },
});

export default Tahmin;
