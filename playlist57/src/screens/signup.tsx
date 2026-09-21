import { useNavigation } from "@react-navigation/native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
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
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [error, setError] = useState("");
  const [isSigningUp, setIsSigningUp] =
    useState(false);

  const onSignUp = async () => {
    // Prevent multiple signup requests.
    if (isSigningUp) {
      return;
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    setError("");

    if (
      !cleanName ||
      !cleanEmail ||
      !password ||
      !confirmPassword
    ) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setIsSigningUp(true);

      /*
       * Firebase creates the account and automatically
       * signs the new user in.
       */
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const user = userCredential.user;

      /*
       * Save the profile in the background.
       * Do not await this because an offline Firestore
       * connection could prevent navigation.
       */
      void setDoc(doc(db, "users", user.uid), {
        fullName: cleanName,
        email: cleanEmail,
        createdAt: serverTimestamp(),
      }).catch((firestoreError: any) => {
        console.error(
          "Account created, but profile did not synchronize:",
          firestoreError.code,
          firestoreError.message
        );
      });

      /*
       * The account is created and the user is signed in.
       * Reset navigation so they cannot go back to signup.
       */
      (navigation as any).reset({
        index: 0,
        routes: [{ name: "AppTabs" }],
      });
    } catch (error: any) {
      console.error(
        "Signup error:",
        error.code,
        error.message
      );

      switch (error.code) {
        case "auth/email-already-in-use":
          setError(
            "An account with this email already exists."
          );
          break;

        case "auth/invalid-email":
          setError(
            "Please enter a valid email address."
          );
          break;

        case "auth/weak-password":
          setError(
            "Please choose a stronger password."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Unable to connect. Please check your internet connection."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many attempts. Please try again later."
          );
          break;

        default:
          setError(
            "Unable to create your account. Please try again."
          );
      }
    } finally {
      setIsSigningUp(false);
    }
  };

  const onLogin = () => {
    if (isSigningUp) {
      return;
    }

    navigation.navigate("Login" as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require(
            "../assets/images/headphones2.gif"
          )}
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
          editable={!isSigningUp}
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
          editable={!isSigningUp}
        />

        <TextInput
          placeholder="Password"
          style={styles.input}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          editable={!isSigningUp}
        />

        <TextInput
          placeholder="Confirm Password"
          style={styles.input}
          onChangeText={setConfirmPassword}
          value={confirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          editable={!isSigningUp}
          onSubmitEditing={onSignUp}
        />

        {error !== "" && (
          <Text
            style={{
              color: "red",
              marginBottom: 10,
            }}
          >
            {error}
          </Text>
        )}

        <MyButton
          title={
            isSigningUp
              ? "CREATING ACCOUNT..."
              : "SIGN UP"
          }
          onPress={onSignUp}
          disabled={isSigningUp}
        />
      </View>

      <TouchableOpacity
        onPress={onLogin}
        disabled={isSigningUp}
      >
        <Text
          style={[
            styles.signUpText,
            isSigningUp && { opacity: 0.5 },
          ]}
        >
          Already Have an Account? Login
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignUp;



