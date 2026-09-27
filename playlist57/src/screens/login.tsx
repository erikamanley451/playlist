
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const onLogin = async () => {
    if (isLoggingIn) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setIsLoggingIn(true);
      setError("");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = userCredential.user;
      const fallbackName =
        user.displayName?.trim() ||
        user.email?.split("@")[0] ||
        "User";

      // Give the app a safe local display name immediately. A Firestore
      // profile can replace it later without blocking a successful login.
      await AsyncStorage.setItem("fullName", fallbackName);

      // Authentication succeeded, so enter the app immediately. Resetting the
      // stack prevents returning to Login with the back button.
      (navigation as any).reset({
        index: 0,
        routes: [{ name: "AppTabs" }],
      });

      // Profile synchronization is optional and must never turn a successful
      // Firebase Authentication result into a failed login.
      void (async () => {
        const userRef = doc(db, "users", user.uid);

        try {
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const profileName = userSnap.data().fullName;

            if (typeof profileName === "string" && profileName.trim()) {
              await AsyncStorage.setItem("fullName", profileName.trim());
            }
          } else {
            // Older Authentication accounts may not have a Firestore profile.
            await setDoc(
              userRef,
              {
                uid: user.uid,
                email: user.email ?? cleanEmail,
                fullName: fallbackName,
                createdAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
        } catch (profileError: any) {
          console.warn(
            "Signed in, but the profile is temporarily unavailable:",
            profileError?.code,
            profileError?.message
          );

          // Queue safe profile fields without overwriting an existing name.
          void setDoc(
            userRef,
            {
              uid: user.uid,
              email: user.email ?? cleanEmail,
              lastLoginAt: serverTimestamp(),
            },
            { merge: true }
          ).catch(() => {});
        }
      })();
    } catch (error: any) {
      console.error("Login error:", error?.code, error?.message);

      switch (error?.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setError("Incorrect email or password.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/network-request-failed":
          setError("Unable to connect. Please check your internet connection.");
          break;

        case "auth/too-many-requests":
          setError("Too many attempts. Please try again later.");
          break;

        default:
          setError("Unable to sign in. Please try again.");
      }
    } finally {
      setIsLoggingIn(false);
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
          autoCorrect={false}
          autoComplete="email"
          editable={!isLoggingIn}
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          editable={!isLoggingIn}
          onSubmitEditing={onLogin}
        />

        {error !== "" && (
          <Text style={{ color: "red", marginBottom: 10 }}>
            {error}
          </Text>
        )}

        <MyButton
          title={isLoggingIn ? "SIGNING IN..." : "LOGIN"}
          onPress={onLogin}
          disabled={isLoggingIn}
        />
      </View>

      <TouchableOpacity onPress={onSignUp} disabled={isLoggingIn}>
        <Text style={[styles.signUpText, isLoggingIn && { opacity: 0.5 }]}>
          Don't Have an Account? Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;




