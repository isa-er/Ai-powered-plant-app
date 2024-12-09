import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, Image, FlatList } from "react-native";
import { collection, query, where, onSnapshot, doc,getDocs} from "firebase/firestore";
import { db } from "../../../firebase";
import { getAuth } from "firebase/auth";
import Loading from "../../components/Loading";

const Profile = () => {



  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error("No user is logged in.");
    return <Text>Error: No user is logged in.</Text>;
  }

  const userEmail = currentUser.email; // Oturum açmış kullanıcının e-posta adresi
  console.log("User Email from Firebase Auth:", userEmail)

  const [predictions, setPredictions] = useState([]);

  const getUserIdByEmail = async (email) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("No user found with the given email");
    }

    return querySnapshot.docs[0].id; // Belge ID'si (userId)
  };

  useEffect(() => {
    let unsubscribe; // Dinleyiciyi sonlandırmak için referans

    const subscribeToPredictions = async () => {
      try {
        // Kullanıcı ID'sini email'e göre bul
        const userId = await getUserIdByEmail(userEmail);

        // predictions alt koleksiyonuna eriş
        const predictionsRef = collection(db, "users", userId, "predictions");

        // Firestore realtime listener
        unsubscribe = onSnapshot(predictionsRef, (snapshot) => {
          const updatedPredictions = [];
          snapshot.forEach((doc) => {
            updatedPredictions.push({ id: doc.id, ...doc.data() });
          });
          setPredictions(updatedPredictions);
        });
      } catch (error) {
        console.error("Error fetching predictions:", error);
        Alert.alert("Error", "Failed to fetch predictions.");
      }
    };

    subscribeToPredictions();

    // Cleanup: Dinleyiciyi kaldır
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userEmail]);

  const renderPrediction = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <Text style={styles.resultText}>Class: {item.result}</Text>
      <Text style={styles.resultText}>
        Confidence: {item.confidence.toFixed(2)}
      </Text>
      <Text style={styles.timestamp}>
        Date: {new Date(item.timestamp?.seconds * 1000).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tahminler</Text>
      <FlatList
        data={predictions}
        keyExtractor={(item) => item.id}
        renderItem={renderPrediction}
        ListEmptyComponent={<Loading/>}
      />
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
  timestamp: {
    fontSize: 14,
    color: "gray",
  },
});

export default Profile;
