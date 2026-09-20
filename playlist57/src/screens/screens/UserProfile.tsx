
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../services/firebase";

const UserAccountScreen = () => {
  const navigation = useNavigation();

  const [userData, setUserData] = useState<any>(null);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;

      if (user) {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          setUserData(data);

          setFormData({
            fullName: data.fullName || "",
            email: data.email || "",
            phone: data.phone || "",
          });
        }
      }
    };

    fetchUserProfile();
  }, []);

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);

      navigation.navigate("Login" as never);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Save updated account information
  const handleSave = async () => {
    const user = auth.currentUser;

    if (!user) return;

    try {
      console.log("User data to update:", formData);

      // Update user data in Firestore
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      });

      // Update local user data
      setUserData({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      });

      // Exit editing mode
      setEditing(false);
    } catch (error: any) {
      console.error("Error when updating account details:", error);

      Alert.alert("Error", error.message);
    }
  };

  // Cancel editing and restore previous values
  const handleCancel = () => {
    setFormData({
      fullName: userData?.fullName || "",
      email: userData?.email || "",
      phone: userData?.phone || "",
    });

    setEditing(false);
  };

  // Update form fields
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("AppTabs" as never)}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      {/* Header + Divider */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/myicon.png")}
            style={styles.icon}
          />

          <Text style={styles.headerText}>User Account</Text>
        </View>

        <View style={styles.divider} />
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Image
          source={require("../../assets/images/userProfileImage.jpg")}
          style={styles.profileImage}
        />

        <View style={styles.profileDetails}>
          {/* Name */}
          <Text style={styles.detailLabel}>Name:</Text>

          {editing ? (
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) =>
                handleChange("fullName", text)
              }
            />
          ) : (
            <Text style={styles.detailValue}>
              {userData?.fullName || "Loading..."}
            </Text>
          )}

          {/* Email - not editable */}
          <Text style={styles.detailLabel}>Email:</Text>

          <Text style={styles.detailValue}>
            {userData?.email || "Loading..."}
          </Text>

          {/* Phone */}
          <Text style={styles.detailLabel}>Phone:</Text>

          {editing ? (
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) =>
                handleChange("phone", text)
              }
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.detailValue}>
              {userData?.phone || "Loading..."}
            </Text>
          )}
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        {editing ? (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleCancel}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setEditing(true)}
            >
              <Text style={styles.buttonText}>
                Update Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={logout}
            >
              <Text style={styles.buttonText}>Log Out</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default UserAccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,
  },

  headerContainer: {
    width: "90%",
    alignSelf: "center",
    marginBottom: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 10,
  },

  icon: {
    marginRight: 10,
    width: 50,
    height: 50,
  },

  headerText: {
    fontSize: 20,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#000",
    width: "100%",
  },

  profileCard: {
    flexDirection: "row",
    backgroundColor: "#E0E8FF",
    borderWidth: 2,
    borderColor: "#00C853",
    borderRadius: 12,
    padding: 20,
    alignSelf: "center",
    width: "90%",
    height: 200,
    marginBottom: 20,
  },

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 20,
    backgroundColor: "#ccc",
  },

  profileDetails: {
    flex: 1,
    justifyContent: "center",
  },

  detailLabel: {
    fontWeight: "600",
    fontSize: 16,
  },

  detailValue: {
    fontSize: 16,
    marginBottom: 10,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "center",
    width: "90%",
    marginTop: 10,
  },

  button: {
    backgroundColor: "#1DB954",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    flex: 0.45,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  backButton: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 999,
  },

  input: {
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#888",
    marginBottom: 10,
    paddingVertical: 4,
  },
});










