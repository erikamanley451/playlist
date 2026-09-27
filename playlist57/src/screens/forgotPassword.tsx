import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import {
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
import { auth } from "../services/firebase";
import { styles } from "../styles/style";

const ForgotPassword = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const initialEmail =
    (route.params as { email?: string } | undefined)?.email ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const sendResetLink = async () => {
    if (isSending) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage("");
      setError("Please enter your email address.");
      return;
    }

    try {
      setIsSending(true);
      setError("");
      setMessage("");

      await sendPasswordResetEmail(auth, cleanEmail);

      setMessage(
        "Password reset link sent. Check your email and follow the link to create a new password."
      );
    } catch (resetError: any) {
      console.warn(
        "Password reset request failed:",
        resetError?.code,
        resetError?.message
      );

      if (resetError?.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (resetError?.code === "auth/network-request-failed") {
        setError("Unable to connect. Please check your internet connection.");
      } else if (resetError?.code === "auth/too-many-requests") {
        setError("Too many requests. Please wait and try again.");
      } else {
        // Keep the response general so the screen does not reveal whether
        // a particular email address has an account.
        setMessage(
          "If an account exists for that email, a password reset link has been sent."
        );
      }
    } finally {
      setIsSending(false);
    }
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
          <TouchableOpacity
            style={localStyles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isSending}
          >
            <Ionicons name="arrow-back" size={26} color="black" />
          </TouchableOpacity>

          <View style={localStyles.content}>
            <Image
              source={require("../assets/images/headphones2.gif")}
              style={localStyles.logo}
            />

            <Text style={localStyles.heading}>Reset Password</Text>
            <Text style={localStyles.instructions}>
              Enter the email connected to your account. We’ll send you a
              secure link to create a new password.
            </Text>

            <TextInput
              placeholder="Email Address"
              style={[styles.input, localStyles.emailInput]}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setError("");
                setMessage("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!isSending}
              onSubmitEditing={() => void sendResetLink()}
              returnKeyType="send"
            />

            {error !== "" && (
              <Text style={localStyles.errorText}>{error}</Text>
            )}

            {message !== "" && (
              <Text style={localStyles.successText}>{message}</Text>
            )}

            <MyButton
              title={isSending ? "SENDING..." : "SEND RESET LINK"}
              onPress={() => void sendResetLink()}
              disabled={isSending}
            />

            <TouchableOpacity
              style={localStyles.loginLink}
              onPress={() => navigation.navigate("Login")}
              disabled={isSending}
            >
              <Text style={localStyles.loginText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
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
  backButton: {
    position: "absolute",
    top: 12,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  content: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 14,
  },
  heading: {
    color: "#111",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  instructions: {
    color: "#666",
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 24,
  },
  emailInput: {
    width: "100%",
    height: 58,
    marginBottom: 14,
  },
  errorText: {
    width: "100%",
    color: "red",
    marginBottom: 12,
  },
  successText: {
    width: "100%",
    color: "#168A42",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 14,
  },
  loginLink: {
    marginTop: 22,
    padding: 10,
  },
  loginText: {
    color: "#1DB954",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default ForgotPassword;

