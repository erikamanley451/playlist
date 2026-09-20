
import { useNavigation } from "@react-navigation/native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
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

const SignUp = () => {
  const navigation = useNavigation();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSignUp = async () => {
    if (!email || !password || !fullName || !phone) {
      setError("All fields are required");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Save to Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        phone,
        createdAt: new Date(),
      });

      setError("");

      // Navigate to the main app after successful signup
      navigation.navigate("AppTabs" as never);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const onLogin = () => {
    navigation.navigate("Login" as never);
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
          placeholder="Full Name"
          style={styles.input}
          onChangeText={setFullName}
          value={fullName}
        />

        <TextInput
          placeholder="Phone Number"
          style={styles.input}
          onChangeText={setPhone}
          value={phone}
          keyboardType="phone-pad"
        />

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

        <MyButton title="SIGN UP" onPress={onSignUp} />
      </View>

      <TouchableOpacity onPress={onLogin}>
        <Text style={styles.signUpText}>
          Already Have an Account? Login
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignUp;

