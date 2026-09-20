
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Index from "../screens/index";
import Login from "../screens/login";
import Signup from "../screens/signup";

import PlaylistSongs from "../screens/PlaylistSongs";
import AudiobookChapters from "../screens/audiobookChapters";
import PodcastEpisodes from "../screens/podcastEpisodes";

import Audiobooks from "../screens/audiobooks";
import Podcasts from "../screens/podcasts";
import Songs from "../screens/songs";
import Videos from "../screens/videos";

import Categories from "../screens/categories";
import CategoryPlaylists from "../screens/categories/[id]";

import Playlist from "../screens/playlist";
import SearchResults from "../screens/search";

import AppTabs from "./AppTabs";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {/* Welcome / Authentication */}
        <Stack.Screen
          name="Welcome"
          component={Index}
        />

        <Stack.Screen
          name="Login"
          component={Login}
        />

        <Stack.Screen
          name="Signup"
          component={Signup}
        />

        {/* Main application */}
        <Stack.Screen
          name="AppTabs"
          component={AppTabs}
        />

        {/* Content screens */}
        <Stack.Screen
          name="Songs"
          component={Songs}
        />

        <Stack.Screen
          name="Podcasts"
          component={Podcasts}
        />

        <Stack.Screen
          name="Audiobooks"
          component={Audiobooks}
        />

        <Stack.Screen
          name="Videos"
          component={Videos}
        />

        {/* Categories */}
        <Stack.Screen
          name="Categories"
          component={Categories}
        />

        <Stack.Screen
          name="CategoryPlaylists"
          component={CategoryPlaylists}
        />

        {/* Podcast details */}
        <Stack.Screen
          name="PodcastEpisodes"
          component={PodcastEpisodes}
        />

        {/* Playlist details */}
        <Stack.Screen
          name="Playlist"
          component={Playlist}
        />

        <Stack.Screen
          name="PlaylistSongs"
          component={PlaylistSongs}
        />

        {/* Audiobook details */}
        <Stack.Screen
          name="AudiobookChapters"
          component={AudiobookChapters}
        />

        {/* Search */}
        <Stack.Screen
          name="Search"
          component={SearchResults}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}





