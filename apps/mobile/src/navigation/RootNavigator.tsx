import { useEffect, useRef } from "react";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "./types";
import { useAuthStore } from "@/stores/authStore";
import { registerForPushNotifications, setupNotificationListeners } from "@/services/notificationService";

import { AuthNavigator } from "./AuthNavigator";
import { MainNavigator } from "./MainNavigator";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, hasCompletedOnboarding } = useAuthStore();
  const navigationRef = useNavigationContainerRef();
  const pushRegistered = useRef(false);

  // Enregistrer les push notifications quand l'utilisateur est connecté
  useEffect(() => {
    if (!isAuthenticated || !hasCompletedOnboarding || pushRegistered.current) return;
    pushRegistered.current = true;

    registerForPushNotifications();

    const cleanup = setupNotificationListeners((data) => {
      // Navigation quand l'utilisateur tape sur une notification
      if (data.matchId && navigationRef.isReady()) {
        (navigationRef as never as { navigate: (screen: string, params?: { screen: string; params: { matchId: string } }) => void })
          .navigate("Main", { screen: "MatchDetail", params: { matchId: data.matchId as string } });
      }
    });

    return cleanup;
  }, [isAuthenticated, hasCompletedOnboarding, navigationRef]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated || !hasCompletedOnboarding ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
