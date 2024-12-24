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
import { Image } from "react-native-elements";
import { Picker } from "@react-native-picker/picker"; // Dropdown için picker

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [name, setName] = useState("");
  const [selectedCity, setSelectedCity] = useState(""); // Şehir seçimi

  const cities = [
    { label: "Adana", value: "Adana" },
    { label: "Adıyaman", value: "Adiyaman" },
    { label: "Afyonkarahisar", value: "Afyonkarahisar" },
    { label: "Ağrı", value: "Agri" },
    { label: "Aksaray", value: "Aksaray" },
    { label: "Amasya", value: "Amasya" },
    { label: "Ankara", value: "Ankara" },
    { label: "Antalya", value: "Antalya" },
    { label: "Ardahan", value: "Ardahan" },
    { label: "Artvin", value: "Artvin" },
    { label: "Aydın", value: "Aydin" },
    { label: "Balıkesir", value: "Balikesir" },
    { label: "Bartın", value: "Bartin" },
    { label: "Batman", value: "Batman" },
    { label: "Bayburt", value: "Bayburt" },
    { label: "Bilecik", value: "Bilecik" },
    { label: "Bingöl", value: "Bingol" },
    { label: "Bitlis", value: "Bitlis" },
    { label: "Bolu", value: "Bolu" },
    { label: "Burdur", value: "Burdur" },
    { label: "Bursa", value: "Bursa" },
    { label: "Çanakkale", value: "Canakkale" },
    { label: "Çankırı", value: "Cankiri" },
    { label: "Çorum", value: "Corum" },
    { label: "Denizli", value: "Denizli" },
    { label: "Diyarbakır", value: "Diyarbakir" },
    { label: "Düzce", value: "Duzce" },
    { label: "Edirne", value: "Edirne" },
    { label: "Elazığ", value: "Elazig" },
    { label: "Erzincan", value: "Erzincan" },
    { label: "Erzurum", value: "Erzurum" },
    { label: "Eskişehir", value: "Eskisehir" },
    { label: "Gaziantep", value: "Gaziantep" },
    { label: "Giresun", value: "Giresun" },
    { label: "Gümüşhane", value: "Gumushane" },
    { label: "Hakkari", value: "Hakkari" },
    { label: "Hatay", value: "Hatay" },
    { label: "Iğdır", value: "Igdir" },
    { label: "Isparta", value: "Isparta" },
    { label: "İstanbul", value: "Istanbul" },
    { label: "İzmir", value: "Izmir" },
    { label: "Kahramanmaraş", value: "Kahramanmaras" },
    { label: "Karabük", value: "Karabuk" },
    { label: "Karaman", value: "Karaman" },
    { label: "Kars", value: "Kars" },
    { label: "Kastamonu", value: "Kastamonu" },
    { label: "Kayseri", value: "Kayseri" },
    { label: "Kırıkkale", value: "Kirikkale" },
    { label: "Kırklareli", value: "Kirklareli" },
    { label: "Kırşehir", value: "Kirsehir" },
    { label: "Kilis", value: "Kilis" },
    { label: "Kocaeli", value: "Kocaeli" },
    { label: "Konya", value: "Konya" },
    { label: "Kütahya", value: "Kutahya" },
    { label: "Malatya", value: "Malatya" },
    { label: "Manisa", value: "Manisa" },
    { label: "Mardin", value: "Mardin" },
    { label: "Mersin", value: "Mersin" },
    { label: "Muğla", value: "Mugla" },
    { label: "Muş", value: "Mus" },
    { label: "Nevşehir", value: "Nevsehir" },
    { label: "Niğde", value: "Nigde" },
    { label: "Ordu", value: "Ordu" },
    { label: "Osmaniye", value: "Osmaniye" },
    { label: "Rize", value: "Rize" },
    { label: "Sakarya", value: "Sakarya" },
    { label: "Samsun", value: "Samsun" },
    { label: "Siirt", value: "Siirt" },
    { label: "Sinop", value: "Sinop" },
    { label: "Sivas", value: "Sivas" },
    { label: "Şanlıurfa", value: "Sanliurfa" },
    { label: "Şırnak", value: "Sirnak" },
    { label: "Tekirdağ", value: "Tekirdag" },
    { label: "Tokat", value: "Tokat" },
    { label: "Trabzon", value: "Trabzon" },
    { label: "Tunceli", value: "Tunceli" },
    { label: "Uşak", value: "Usak" },
    { label: "Van", value: "Van" },
    { label: "Yalova", value: "Yalova" },
    { label: "Yozgat", value: "Yozgat" },
    { label: "Zonguldak", value: "Zonguldak" },
  ];
  

  const handleSignUp = async () => {
    if (!email || !password || !password2 || !name || !selectedCity) {
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
        city: selectedCity, // Seçilen şehir kaydediliyor
        createdAt: new Date(),
      });

      Alert.alert("Başarılı", "Kayıt başarılı!");
      // navigation.navigate("Login"); // Kayıttan sonra Login sayfasına yönlendirme
    } catch (error) {
      Alert.alert("Hata", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1, marginTop: 30 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.header}>Kayıt Ol</Text>
            <Image
              source={require("../../../assets/icons/leaf2.png")}
              style={{ width: 200, height: 200 }}
            />

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
                onChangeText={(text) => setEmail(text.toLocaleLowerCase())}
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

            {/* Şehir Seçimi Dropdown */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>Şehir Seçin</Text>
              <Picker
                selectedValue={selectedCity}
                onValueChange={(itemValue) => setSelectedCity(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Şehir Seçin" value="" />
                {cities.map((city) => (
                  <Picker.Item
                    key={city.value}
                    label={city.label}
                    value={city.value}
                  />
                ))}
              </Picker>
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
  dropdownContainer: {
    width: "90%",
    marginBottom: 15,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  picker: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
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
