import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { auth, db } from "../../../firebase";
import { signOut, updatePassword ,reauthenticateWithCredential,EmailAuthProvider} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";

const Profile = ({ navigation }) => {
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userCity, setUserCity] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Başarılı", "Çıkış yapıldı.");
      //navigation.replace("Login");
    } catch (error) {
      Alert.alert("Hata", "Çıkış yaparken bir sorun oluştu.");
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Hata", "Yeni şifreler eşleşmiyor.");
      return;
    }
  
    try {
      const user = auth.currentUser;
  
      if (!user) {
        Alert.alert("Hata", "Kullanıcı oturumu açmamış.");
        return;
      }
  
      // Kullanıcının e-posta adresini al
      const email = user.email;
      if (!email) {
        Alert.alert("Hata", "Kullanıcı e-posta adresi bulunamadı.");
        return;
      }
  
      // Eski şifreyi doğrula
      const credential = EmailAuthProvider.credential(email, oldPassword);
      await reauthenticateWithCredential(user, credential);
  
      // Şifreyi güncelle
      await updatePassword(user, newPassword);
      Alert.alert("Başarılı", "Şifre başarıyla değiştirildi.");
      setIsChangingPassword(false);
      setOldPassword(""); // Giriş alanlarını temizle
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      //console.error("Şifre değiştirme hatası:", error); // Hata detaylarını logla
      if (error.code === "auth/wrong-password") {
        Alert.alert("Hata", "Eski şifre yanlış.");
      } else if (error.code === "auth/too-many-requests") {
        Alert.alert(
          "Hata",
          "Çok fazla giriş denemesi yapıldı. Lütfen biraz bekleyin ve tekrar deneyin."
        );
      } else if (error.code === "auth/weak-password") {
        Alert.alert("Hata", "Yeni şifre çok zayıf. Daha güçlü bir şifre girin.");
      } else {
        Alert.alert("Hata", "Şifre değiştirilirken bir hata oluştu.");
      }
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userDoc);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserName(data.name || "Belirtilmemiş");
            setUserEmail(currentUser.email);
            setUserCity(data.city || "Belirtilmemiş");

            // createdAt'ı tarih formatına dönüştür
            const timestamp = data.createdAt;
            if (timestamp && timestamp.seconds) {
              const date = timestamp.toDate();
              setCreatedAt(date.toLocaleDateString());
            } else {
              setCreatedAt("Bilinmiyor");
            }
          }
        }
      } catch (error) {
        //console.error("Kullanıcı bilgisi alınırken hata:", error);
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <View style={styles.container}>


    <TouchableOpacity
            style={styles.infoButton}
            onPress={() => navigation.navigate("UserTabs", { screen: "Home" })}
          >
            
            <Icon name="arrow-back-ios" size={20} color="#FFF" />
          </TouchableOpacity>



      <Text style={styles.title}>Profil</Text>

      {/* Profil Resmi veya Kullanıcı Adının İlk Harfi */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {userName.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Kullanıcı Bilgileri */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Kullanıcı Bilgileri</Text>
        <Text style={styles.infoText}>Ad: {userName}</Text>
        <Text style={styles.infoText}>Email: {userEmail}</Text>
        <Text style={styles.infoText}>Şehir: {userCity}</Text>
        <Text style={styles.infoText}>Hesap Açılış Tarihi: {createdAt}</Text>
      </View>

      {/* Şifre Değiştir */}
      {isChangingPassword ? (
        <View style={styles.passwordBox}>
          <Text style={styles.infoTitle}>Şifre Değiştir</Text>
          <TextInput
            placeholder="Eski Şifre"
            style={styles.input}
            secureTextEntry
            onChangeText={setOldPassword}
          />
          <TextInput
            placeholder="Yeni Şifre"
            style={styles.input}
            secureTextEntry
            onChangeText={setNewPassword}
          />
          <TextInput
            placeholder="Yeni Şifre Tekrar"
            style={styles.input}
            secureTextEntry
            onChangeText={setConfirmNewPassword}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handlePasswordChange}
          >
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.passwordButton}
          onPress={() => setIsChangingPassword(true)}
        >
          <Icon name="lock" size={20} color="#FFF" />
          <Text style={styles.passwordButtonText}>Şifre Değiştir</Text>
        </TouchableOpacity>
      )}

      {/* Çıkış Yap Butonu */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="exit-to-app" size={20} color="#FFF" />
        <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
};
export default Profile;

const styles = StyleSheet.create({


  infoButton: {
    position: "absolute",
    top: 50,
    left: 20,
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
  container: {
    flex: 1,
    backgroundColor: "#F0F4F8",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 36,
    color: "#FFF",
    fontWeight: "bold",
  },
  infoBox: {
    width: "90%",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#555",
  },
  infoText: {
    fontSize: 16,
    marginBottom: 5,
    color: "#777",
  },
  passwordButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  passwordButtonText: {
    color: "#FFF",
    fontSize: 16,
    marginLeft: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF5C5C",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  logoutButtonText: {
    color: "#FFF",
    fontSize: 16,
    marginLeft: 10,
  },
  passwordBox: {
    width: "90%",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#F0F4F8",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
  },
});
