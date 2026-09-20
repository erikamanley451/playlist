
import { useNavigation } from "@react-navigation/native";
import { Image, View } from "react-native";
import MyButton from "../components/MyButton";

const GetStarted = () => {
  const navigation = useNavigation<any>();

  const getStarted = () => {
    navigation.navigate("Login");
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image
        source={require("../assets/images/myicon.png")}
        style={{
          width: "100%",
          height: 400,
        }}
        resizeMode="center"
      />

      <MyButton
        title="GET STARTED"
        onPress={getStarted}
      />
    </View>
  );
};

export default GetStarted;

