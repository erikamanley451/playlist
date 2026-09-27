import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

    if (password.length < 8 || password.length > 64) {
      setError(
        "Password must be between 8 and 64 characters."
      );
      return;
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);

    if (
      !hasUppercase ||
      !hasLowercase ||
      !hasNumber ||
      !hasSpecialCharacter
    ) {
      setError(
        "Password must include uppercase, lowercase, a number, and a special character."
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

      await updateProfile(user, {
        displayName: cleanName,
      });

      // Make the name available to the profile UI immediately.
      await AsyncStorage.setItem("fullName", cleanName);

      /*
       * Save the profile in the background.
       * Do not await this because an offline Firestore
       * connection could prevent navigation.
       */
      void setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          fullName: cleanName,
          email: cleanEmail,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((firestoreError: any) => {
        console.error(
          "Account created, but profile did not synchronize:",
          firestoreError.code,
          firestoreError.message
        );
      });

      await sendEmailVerification(user);
      await signOut(auth);

      Alert.alert(
        "Verify your email",
        "We sent a verification link to your email address. Verify it before signing in.",
        [
          {
            text: "OK",
            onPress: () =>
              (navigation as any).reset({
                index: 0,
                routes: [{ name: "Login" }],
              }),
          },
        ]
      );
    } catch (error: any) {
      // Do not leave a newly-created, unverified account signed in when
      // profile or verification setup encounters an error.
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await signOut(auth).catch(() => {});
      }

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
    <SafeAreaView style={localStyles.safeArea}>
      <KeyboardAvoidingView
        style={localStyles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={localStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
      <View style={localStyles.header}>
        <Image
          source={require(
            "../assets/images/headphones2.gif"
          )}
          style={localStyles.logo}
        />

        <Text style={[styles.title, localStyles.title]}>PlayList</Text>
      </View>

      <View style={localStyles.form}>
        <TextInput
          placeholder="Full Name"
          style={[styles.input, localStyles.inputSpacing]}
          onChangeText={setFullName}
          value={fullName}
          autoCapitalize="words"
          autoComplete="name"
          editable={!isSigningUp}
        />

        <TextInput
          placeholder="Email Address"
          style={[styles.input, localStyles.inputSpacing]}
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
          style={[styles.input, localStyles.passwordInput]}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          editable={!isSigningUp}
          maxLength={64}
        />

        <Text style={localStyles.passwordHint}>
          Use 8–64 characters with uppercase, lowercase, a number, and a special character.
        </Text>

        <TextInput
          placeholder="Confirm Password"
          style={[styles.input, localStyles.inputSpacing]}
          onChangeText={setConfirmPassword}
          value={confirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          editable={!isSigningUp}
          maxLength={64}
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
        style={localStyles.bottomLink}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 22,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  title: {
    fontSize: 38,
    marginTop: 0,
  },
  form: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
  },
  inputSpacing: {
    height: 58,
    marginBottom: 14,
  },
  passwordInput: {
    height: 58,
    marginBottom: 6,
  },
  passwordHint: {
    color: "#666",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  bottomLink: {
    alignSelf: "center",
    marginTop: 18,
    padding: 10,
  },
});

export default SignUp;















