import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Octicons from "@expo/vector-icons/Octicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { FC } from "react";
import Dashboard from "../screens/dashboard";
import Playlist from "../screens/playlist";
import Downloads from "../screens/screens/Downloads";
import UserProfile from "../screens/screens/UserProfile";

const Tab = createBottomTabNavigator();

const TabNavigator: FC = () => {
  return (
      <Tab.Navigator screenOptions={{
        tabBarStyle: {
          backgroundColor: '#f5f5f5',
          borderTopWidth: 0,
          flexDirection: 'row',
          justifyContent: 'space-around', //to have even spacing between icons
          alignItems: 'center',
        },
        
        headerShown: false, //to remove the header 
        tabBarShowLabel: false, //hide icon text labels
          
        tabBarIconStyle: { marginBottom: 0 }, 
        
        
      }}
      >
        <Tab.Screen 
          name="Home"
          component={Dashboard}
          options = {{
              tabBarLabel: "Home",
              headerShown: false,
              tabBarLabelStyle: {color: "white"},
              tabBarIcon: ({focused}) =>
                focused? (
                  <Entypo name="home" size={24} color="black" />
                ): (<AntDesign name="home" size={24} color="black" />) }}
        />

        <Tab.Screen 
          name="Playlists" 
          component={Playlist}
          options = {{
            tabBarLabel: "Playlists",
            headerShown: false,
            tabBarLabelStyle: {color: "white"},
            tabBarIcon: ({focused}) =>
              focused? (
                <MaterialCommunityIcons name="playlist-music" size={24} color="black" />
              ): (<MaterialCommunityIcons name="playlist-music-outline" size={24} color="black" />) }}
        />

        <Tab.Screen 
          name="Downloads" 
          component={Downloads}
          options = {{
            tabBarLabel: "Downloads",
            headerShown: false,
            tabBarLabelStyle: {color: "white"},
            tabBarIcon: ({focused}) =>
              focused? (
                <Ionicons name="download" size={24} color="black" />
              ): (<Ionicons name="download-outline" size={24} color="black" />) }}
        />

        <Tab.Screen 
          name="Profile" 
          component={UserProfile}
           options = {{
            tabBarLabel: "Profile",
            headerShown: false,
            tabBarLabelStyle: {color: "white"},
            tabBarIcon: ({focused}) =>
              focused? (
                <Octicons name="person-fill" size={24} color="black" />
              ): (<Octicons name="person" size={24} color="black" />) }}
        />





      </Tab.Navigator>
  );
};

export default TabNavigator;