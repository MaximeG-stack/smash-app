import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, Text } from "react-native";
import type { MainTabParamList } from "./types";

import { HomeScreen } from "@/screens/home/HomeScreen";
import { SearchScreen } from "@/screens/search/SearchScreen";
import { CreateMatchScreen } from "@/screens/match/CreateMatchScreen";
import { MyMatchesScreen } from "@/screens/match/MyMatchesScreen";
import { ProfileScreen } from "@/screens/profile/ProfileScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View className="items-center gap-0.5">
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text
        style={{
          fontSize: 10,
          fontWeight: focused ? "600" : "400",
          color: focused ? "#2ECC71" : "#6B7280",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Accueil" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔍" label="Rechercher" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="CreateMatch"
        component={CreateMatchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "#2ECC71",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 4,
                shadowColor: "#2ECC71",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Text style={{ fontSize: 26, color: "#fff" }}>+</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="MyMatches"
        component={MyMatchesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎯" label="Mes matchs" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profil" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
