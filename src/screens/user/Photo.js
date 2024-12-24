import React, { useState } from "react";
import { View, Alert, StyleSheet, Text, TouchableOpacity, Image ,Modal,FlatList} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase"; // Firestore bağlantısını import ediyoruz
import { getAuth } from "firebase/auth";
import Icon from "react-native-vector-icons/FontAwesome";
import TahminEdiliyor from "../../components/TahminEdiliyor";

const Photo = ({navigation}) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error("No user is logged in.");
    return <Text>Error: No user is logged in.</Text>;
  }

  const userEmail = currentUser.email; // Oturum açmış kullanıcının e-posta adresi
  //console.log("User Email from Firebase Auth:", userEmail);

  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);


   // Meyve Listesi
   const fruitList = [
    { id: "1", name: "Elma", image: require("../../../assets/icons/apple.png") },
    { id: "2", name: "Üzüm", image: require("../../../assets/icons/grape.png") },
    { id: "3", name: "Kiraz", image: require("../../../assets/icons/cherries.png") },
    { id: "4", name: "Dolma Biber", image: require("../../../assets/icons/food-and-restaurant.png") },
    { id: "5", name: "Kahve", image: require("../../../assets/icons/coffee-beans.png") },
    { id: "6", name: "Mısır", image: require("../../../assets/icons/corn.png") },
    { id: "7", name: "Pamuk", image: require("../../../assets/icons/cotton.png") },
    { id: "8", name: "Şeftali", image: require("../../../assets/icons/peach.png") },
    { id: "9", name: "Patates", image: require("../../../assets/icons/potato.png") },
    { id: "10", name: "Pirinç", image: require("../../../assets/icons/rice.png") },
    { id: "11", name: "Çilek", image: require("../../../assets/icons/strawberry.png") },
    { id: "12", name: "Şeker Kamışı", image: require("../../../assets/icons/sugarcane.png") },
    { id: "13", name: "Domates", image: require("../../../assets/icons/tomato.png") },
    { id: "14", name: "Bal Kabağı", image: require("../../../assets/icons/food.png") },
  ];

  const renderFruit = ({ item }) => (
    <View style={styles.fruitItem}>
      <Image source={item.image} style={styles.fruitImage} />
      <Text style={styles.fruitName}>{item.name}</Text>
    </View>
  );




  // Kullanıcı uyarısı
  const showWarningAndProceed = async (action) => {
    Alert.alert(
      "Uyarı",
      "Tahmin işlemleri kesinlikle doğru sonuç olmayabilir. Lütfen yetkili birimlere başvurmayı unutmayınız.",
      [
        {
          text: "Tamam",
          onPress: action, // Kullanıcı Tamam'a bastığında işlem devam eder
        },
      ],
      { cancelable: true }
    );
  };

  // Galeriden resim seçme işlemi
  const pickImage = async () => {
    const proceed = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need access to your gallery to select an image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    };

    showWarningAndProceed(proceed);
  };

  // Kameradan fotoğraf çekme işlemi
  const takePhoto = async () => {
    const proceed = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "İzin reddedildi",
          "Fotoğraf çekmek için kamera iznine ihtiyacımız var!"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    };

    showWarningAndProceed(proceed);
  };

  if (loading) {
    return <TahminEdiliyor />;
  }


  // Resmi yükle ve tahmin işlemi yap
  const uploadAndPredict = async () => {

    setLoading(true)

    if (!image) {
      Alert.alert("Resim Yok", "Resim yükleyin veya çekin");
      return;
    }

    const storage = getStorage();
    const filename = image.substring(image.lastIndexOf("/") + 1);
    const storageRef = ref(storage, `user_images/${filename}`);

    try {
      // Firebase Storage'a resmi yükle
      const response = await fetch(image);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      const imageUrl = await getDownloadURL(storageRef);

      // API'ye resmi gönder ve tahmin al
      const formData = new FormData();
      formData.append("file", {
        uri: image,
        name: "image.jpg",
        type: "image/jpeg",
      });

      // https://fastapi-backend-3-q9m9.onrender.com/predict/
      // http://192.168.1.148:8000/predict/
      const apiResponse = await fetch(
        "https://fastapi-backend-3-q9m9.onrender.com/predict/",
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const predictionResult = await apiResponse.json();
      setResult(predictionResult);


      if (predictionResult.entropy > 0.5) {
        Alert.alert(
          "Hatalı Resim",
          `Lütfen geçerli bir resim yükleyin.\n\nEntropi: ${predictionResult.entropy.toFixed(2)}
          `
        );
        setLoading(false);
        setImage(false)
        
        return;
      }

      // Tahmin sonuçlarını veritabanına kaydet
      await savePredictionToFirestore(userEmail, imageUrl, predictionResult);
      setLoading(false)
      
      Alert.alert("Başarılı", "Tahmin işlemi tamamlandı!");
      navigation.navigate("Tahmin")

      
    } catch (error) {
      console.error("Error during upload or predict:", error);
      Alert.alert("Error", "An error occurred while processing the image.");
    }
  };

  const savePredictionToFirestore = async (userEmail, imageUrl, predictionResult) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", userEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("User not found");
      }

      const userDocRef = querySnapshot.docs[0].ref;
      const predictionsRef = collection(userDocRef, "predictions");

      await addDoc(predictionsRef, {
        imageUrl: imageUrl,
        result: predictionResult.predicted_class_name,
        confidence: predictionResult.confidence,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error saving prediction to Firestore:", error);
      Alert.alert("Error", "Failed to save prediction.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Icon name="upload" size={50} color="#FFF" style={styles.icon} />
        <Text style={styles.buttonText}>Galeriden Yükle</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.cameraButton]} onPress={takePhoto}>
        <Icon name="camera" size={50} color="#FFF" style={styles.icon} />
        <Text style={styles.buttonText}>Fotoğraf Çek</Text>
      </TouchableOpacity>


      {/* Info Butonu */}
      <TouchableOpacity
        style={styles.infoButton}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="info" size={20} color="#FFF" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Tüm bitki çeşitlerimiz şunlardır:</Text>
          <FlatList
            data={fruitList}
            keyExtractor={(item) => item.id}
            renderItem={renderFruit}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </Modal>


      {image && (
        <>
          <Image source={{ uri: image }} style={styles.image} />
          <TouchableOpacity style={[styles.button, styles.predictButton]} onPress={uploadAndPredict}>
            <Icon name="cloud-upload" size={50} color="#FFF" style={styles.icon} />
            <Text style={styles.buttonText}>Tahmin Et</Text>
          </TouchableOpacity>
        </>
      )}

{result && result.entropy <= 0.5 && (
  <View style={styles.resultCard}>
    <Text style={styles.resultText}>
      Sınıf: {result.predicted_class_name}
    </Text>
    <Text style={styles.resultText}>
      Güvenilirlik: {result.confidence ? result.confidence.toFixed(2) : "HATA"}
    </Text>
  </View>
)}

      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F0F4F8",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // tahmindeki butonları ayarlıyordun
    backgroundColor: "#5FC9C4",
    width: "80%",
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  cameraButton: {
    backgroundColor: "#A47EDE",
  },
  predictButton: {
    backgroundColor: "#FF8C00",
    marginTop: 20,
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 20,
    borderRadius: 20,
  },
  resultCard: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#FFF",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    alignItems: "center",
    width: "80%",
  },
  resultText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },

  infoButton: {
    position: "absolute",
    bottom: 50,
    right: 20,
    backgroundColor: "#FF8C00",
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    marginTop: "30%",
    marginHorizontal: "5%",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  fruitItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  fruitImage: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  fruitName: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 20,
    alignSelf: "center",
    backgroundColor: "#FF5C5C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },



});

export default Photo;