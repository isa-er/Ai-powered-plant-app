import React, { useState } from "react";
import { View, Button, Image, Alert, StyleSheet, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase"; // Firestore bağlantısını import ediyoruz
import { getAuth } from "firebase/auth";

const Photo = () => {


  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error("No user is logged in.");
    return <Text>Error: No user is logged in.</Text>;
  }

  const userEmail = currentUser.email; // Oturum açmış kullanıcının e-posta adresi
  console.log("User Email from Firebase Auth:", userEmail);



  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);

  // Kullanıcının Firestore belgesini e-posta ile bulma
  const getUserDocumentByEmail = async (email) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("User not found");
    }

    return querySnapshot.docs[0].ref;
  };

  // Resim seçme işlemi
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "We need access to your gallery to select an image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Firebase'e fotoğraf yükleme ve tahmin sonuçlarını kaydetme
  const uploadImage = async () => {
    if (!image) {
      Alert.alert("No Image", "Please select an image first.");
      return;
    }

    const storage = getStorage();
    const filename = image.substring(image.lastIndexOf("/") + 1);
    const storageRef = ref(storage, `user_images/${filename}`);

    try {
      // Firebase Storage'a resmi yükleme
      const response = await fetch(image);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      const imageUrl = await getDownloadURL(storageRef);

      // Tahmin işlemi
      const formData = new FormData();
      formData.append("file", {
        uri: image,
        name: "image.jpg",
        type: "image/jpeg",
      });

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

      // Firestore'a tahmin sonuçlarını kaydetme
      await savePredictionToFirestore(userEmail, imageUrl, predictionResult);

      setImage(null);
      setResult(null);
      Alert.alert("Success", "Prediction completed and state reset.");

    } catch (error) {
      console.error("Error during upload or save:", error);
      Alert.alert("Error", "An error occurred while uploading the image.");
    }
  };

  const savePredictionToFirestore = async (userEmail, imageUrl, predictionResult) => {
    try {
      // Kullanıcının belgesine e-posta ile ulaş
      const userRef = await getUserDocumentByEmail(userEmail);

      // predictions alt koleksiyonuna referans
      const predictionsRef = collection(userRef, "predictions");

      // Yeni tahmin ekle
      await addDoc(predictionsRef, {
        imageUrl: imageUrl,
        result: predictionResult.predicted_class_name,
        confidence: predictionResult.confidence,
        timestamp: new Date(),
      });

      Alert.alert("Success", "Prediction saved successfully.");
    } catch (error) {
      console.error("Error saving prediction to Firestore:", error);
      Alert.alert("Error", "Failed to save prediction.");
    }
  };


  console.log("Received userEmail:", userEmail);

  return (
    <View style={styles.container}>
      <Button title="Select Image" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
      {image && <Button title="Upload & Predict" onPress={uploadImage} />}
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            Predicted Class: {result.predicted_class_name}
          </Text>
          <Text style={styles.resultText}>Confidence: {result.confidence}</Text>
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
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 20,
  },
  resultContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  resultText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Photo;
