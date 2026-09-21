import { useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
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

type UserProfile = {
  fullName: string;
  email: string;
};

const UserAccountScreen = () => {
  const navigation = useNavigation();

  const [userData, setUserData] =
    useState<UserProfile | null>(null);

  const [formData, setFormData] = useState<UserProfile>({
    fullName: "",
    email: "",
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const documentSnapshot = await getDoc(userRef);

        if (documentSnapshot.exists()) {
          const data = documentSnapshot.data();

          const profileData: UserProfile = {
            fullName: data.fullName || "",
            email: data.email || user.email || "",
          };

          setUserData(profileData);
          setFormData(profileData);
        } else {
          const profileData: UserProfile = {
            fullName: "",
            email: user.email || "",
          };

          setUserData(profileData);
          setFormData(profileData);

          console.log(
            "User profile does not exist in Firestore."
          );
        }
      } catch (error: any) {
        console.error(
          "Error loading user profile:",
          error.code,
          error.message
        );

        // Authentication can still work when Firestore is offline.
        const fallbackData: UserProfile = {
          fullName: "",
          email: user.email || "",
        };

        setUserData(fallbackData);
        setFormData(fallbackData);

        Alert.alert(
          "Unable to load profile",
          "Your account is signed in, but the profile could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      navigation.navigate("Login" as never);
    } catch (error: any) {
      console.error(
        "Logout error:",
        error.code,
        error.message
      );

      Alert.alert(
        "Logout Error",
        error.message || "Unable to log out."
      );
    }
  };

  const handleSave = () => {
    const user = auth.currentUser;
    const updatedFullName = formData.fullName.trim();

    if (!user) {
      Alert.alert(
        "Error",
        "No user is currently signed in."
      );
      return;
    }

    if (!updatedFullName) {
      Alert.alert("Error", "Full name is required.");
      return;
    }

    /*
     * Update the screen immediately.
     * This does not wait for Firestore.
     */
    setUserData((previousData) => ({
      fullName: updatedFullName,
      email:
        previousData?.email ||
        user.email ||
        formData.email,
    }));

    setFormData((previousData) => ({
      ...previousData,
      fullName: updatedFullName,
    }));

    // Close editing mode immediately.
    setEditing(false);

    const userRef = doc(db, "users", user.uid);

    /*
     * Start the Firestore write in the background.
     * A slow or offline connection will not leave the UI stuck.
     */
    void setDoc(
      userRef,
      {
        fullName: updatedFullName,
        email: user.email || formData.email,
      },
      {
        merge: true,
      }
    )
      .then(() => {
        console.log(
          "Profile synchronized with Firestore."
        );
      })
      .catch((error: any) => {
        console.error(
          "Error synchronizing profile:",
          error.code,
          error.message
        );

        Alert.alert(
          "Profile not synchronized",
          "The new name is displayed, but it could not be saved to Firebase. Please check your connection."
        );
      });
  };

  const handleCancel = () => {
    setFormData({
      fullName: userData?.fullName || "",
      email:
        userData?.email ||
        auth.currentUser?.email ||
        "",
    });

    setEditing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <Image
            source={require(
              "../../assets/images/myicon.png"
            )}
            style={styles.icon}
          />

          <Text style={styles.headerText}>
            User Account
          </Text>
        </View>

        <View style={styles.divider} />
      </View>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <Image
          source={require(
            "../../assets/images/userProfileImage.jpg"
          )}
          style={styles.profileImage}
        />

        <View style={styles.profileDetails}>
          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.detailLabel}>Name:</Text>

            {editing ? (
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(text) =>
                  setFormData((previousData) => ({
                    ...previousData,
                    fullName: text,
                  }))
                }
                placeholder="Full Name"
                autoCapitalize="words"
                autoCorrect={false}
                onSubmitEditing={handleSave}
              />
            ) : (
              <Text style={styles.detailValue}>
                {loading
                  ? "Loading..."
                  : userData?.fullName ||
                    "No name provided"}
              </Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.detailLabel}>Email:</Text>

            <Text style={styles.detailValue}>
              {loading
                ? "Loading..."
                : userData?.email ||
                  auth.currentUser?.email ||
                  "No email available"}
            </Text>
          </View>
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
              <Text style={styles.buttonText}>
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleCancel}
            >
              <Text style={styles.buttonText}>
                Cancel
              </Text>
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
              <Text style={styles.buttonText}>
                Log Out
              </Text>
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
    width: 50,
    height: 50,
    marginRight: 10,
  },

  headerText: {
    fontSize: 20,
    fontWeight: "600",
  },

  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#000",
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    width: "90%",
    minHeight: 200,
    padding: 20,
    marginBottom: 20,
    backgroundColor: "#E0E8FF",
    borderWidth: 2,
    borderColor: "#00C853",
    borderRadius: 12,
  },

  profileImage: {
    width: 120,
    height: 120,
    marginRight: 20,
    backgroundColor: "#ccc",
    borderRadius: 12,
  },

  profileDetails: {
    flex: 1,
    justifyContent: "center",
  },

  fieldGroup: {
    marginBottom: 18,
  },

  detailLabel: {
    fontSize: 16,
    fontWeight: "600",
  },

  detailValue: {
    marginTop: 5,
    fontSize: 16,
  },

  input: {
    marginTop: 5,
    paddingVertical: 4,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#888",
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "center",
    width: "90%",
    marginTop: 10,
  },

  button: {
    flex: 0.45,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#1DB954",
    borderRadius: 25,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});









