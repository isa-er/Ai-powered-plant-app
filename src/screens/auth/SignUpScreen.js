import React, { useState } from "react";
import {
  View,
  TextInput,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  SafeAreaView,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../../firebase"; // Firebase bağlantısı
import Icon from "react-native-vector-icons/FontAwesome";
import LottieView from "lottie-react-native";
import { Image } from "react-native-elements";

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [name, setName] = useState("");

  const handleSignUp = async () => {
    if (!email || !password || !password2 || !name) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    if (password !== password2) {
      Alert.alert("Hata", "Şifreler eşleşmiyor. Lütfen tekrar deneyin.");
      return;
    }

    try {
      // Firebase Authentication ile kullanıcı kaydı
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const userId = userCredential.user.uid;

      // Firestore'da kullanıcı profili oluşturma
      await setDoc(doc(db, "users", userId), {
        email: email,
        name: name,
        createdAt: new Date(),
      });

      Alert.alert("Başarılı", "Kayıt başarılı! Giriş yapabilirsiniz.");
      navigation.navigate("Login"); // Kayıttan sonra Login sayfasına yönlendirme
    } catch (error) {
      Alert.alert("Hata", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1, marginTop:30}}
        
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.header}>Kayıt Ol</Text>

            {/* <LottieView
              source={require("../../../assets/icons/r.json")} // Lottie animasyon dosyası
              autoPlay
              loop
              style={{ height: 150, width: 150 }}
            /> */}

            {<Image source={require('../../../assets/icons/leaf2.png')} style={{width:200, height:200}} />}

            <View style={styles.inputContainer}>
              <Icon name="user" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="İsim"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="envelope" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Şifre"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Şifre Yeniden"
                value={password2}
                onChangeText={setPassword2}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignUp}>
              <Text style={styles.buttonText}>Kaydol</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button2}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.linkText}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FBEAD7",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FBEAD7",
    padding: 20,
    
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 10,
    width: "90%",
    height: 50,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    width: "90%",
    height: 50,
    backgroundColor: "#5FC9C4",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
  },
  button2: {
    width: "90%",
    height: 50,
    backgroundColor: "blue",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkText: {
    fontWeight: "bold",
    color: "white",
    fontSize: 16,
  },
});

export default SignupScreen;
