import { useNavigation } from "@react-navigation/native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  const onSignUp = async () => {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    setError("");

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setIsSigningUp(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fullName: cleanName,
        email: cleanEmail,
        createdAt: serverTimestamp(),
      });

      navigation.navigate("AppTabs" as never);
    } catch (error: any) {
      console.error("Signup error:", error.code, error.message);

      switch (error.code) {
        case "auth/email-already-in-use":
          setError("An account with this email already exists.");
          break;
        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;
        case "auth/weak-password":
          setError("Please choose a stronger password.");
          break;
        case "auth/network-request-failed":
          setError("Unable to connect. Please check your internet connection.");
          break;
        default:
          setError(error.message ?? "Unable to create your account.");
      }
    } finally {
      setIsSigningUp(false);
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
          autoCapitalize="words"
          autoComplete="name"
        />

        <TextInput
          placeholder="Email Address"
          style={styles.input}
          onChangeText={setEmail}
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
        />

        <TextInput
          placeholder="Confirm Password"
          style={styles.input}
          onChangeText={setConfirmPassword}
          value={confirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          onSubmitEditing={onSignUp}
        />

        {error !== "" && (
          <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>
        )}

        <MyButton
          title={isSigningUp ? "SIGNING UP..." : "SIGN UP"}
          onPress={onSignUp}
          disabled={isSigningUp}
        />
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



