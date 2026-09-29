
import { useNavigation } from "@react-navigation/native";
import { Image, Text, View } from "react-native";
import MyButton from "../components/MyButton";
import { styles } from "../styles/style";

export default function Index() {
  const navigation = useNavigation();

  const getStarted = () => {
    navigation.navigate("Login" as never);
  };

  return (
    <View style={styles.indexContainer}>
      <View>
        <Image
          source={require("../assets/images/headphones2.gif")}
          style={styles.logoImage}
        />
        <Text style={styles.title}>PlayList</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.welcomeText}>Welcome to PlayList</Text>

        <Text style={styles.description}>
          Your media. Your mood. Your PlayList.{"\n"}
          Discover songs, podcasts, audiobooks, and videos — all in one
          beautifully integrated multimedia companion.
        </Text>

        <View style={styles.buttonContainer}>
          <MyButton title="GET STARTED" onPress={getStarted} />
        </View>
      </View>
    </View>
  );
}

