import { Text, TouchableOpacity } from "react-native";
import { styles } from "@/styles/style";

const MyButton = ({title, onPress}) => {
   return (
       <TouchableOpacity
            activeOpacity = {0.6}
            style={styles.myButton}
            onPress={onPress}>
           <Text style={styles.myButtonText}>{title}</Text>
       </TouchableOpacity>
   );
};

export default MyButton;
