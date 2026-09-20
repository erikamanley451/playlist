
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useState } from "react";
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MyButton from "../components/MyButton";
import { auth, db } from "../services/firebase";
import { styles } from "../styles/style";

const Login = () => {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      console.log("Login successful:", user.uid);

      // Fetch user profile from Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        console.log("User Data:", userData);

        if (userData.fullName) {
          await AsyncStorage.setItem("fullName", userData.fullName);
        } else {
          console.warn("userData.fullName is undefined");
        }
      }

      setError("");

      // Navigate to the main app
      navigation.navigate("AppTabs" as never);
    } catch (error: any) {
      setError("Login failed: " + error.message);
    }
  };

  const onSignUp = () => {
    navigation.navigate("Signup" as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../assets/images/headphones2.gif")}
          style={styles.logoImage}
        />

        <Text style={styles.title}>PlayList</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          placeholder="Email Address"
          style={styles.input}
          onChangeText={setEmail}
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
        />

        {error !== "" && (
          <Text style={{ color: "red", marginBottom: 10 }}>
            {error}
          </Text>
        )}

        <MyButton title="LOGIN" onPress={onLogin} />
      </View>

      <TouchableOpacity onPress={onSignUp}>
        <Text style={styles.signUpText}>
          Don't Have an Account? Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;


