import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "./types";

import { WelcomeScreen } from "@/screens/auth/WelcomeScreen";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { RegisterScreen } from "@/screens/auth/RegisterScreen";
import { ForgotPasswordScreen } from "@/screens/auth/ForgotPasswordScreen";
import { OnboardingSportScreen } from "@/screens/auth/OnboardingSportScreen";
import { OnboardingLevelScreen } from "@/screens/auth/OnboardingLevelScreen";
import { OnboardingLocationScreen } from "@/screens/auth/OnboardingLocationScreen";
import { OnboardingAvailabilityScreen } from "@/screens/auth/OnboardingAvailabilityScreen";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="OnboardingSport" component={OnboardingSportScreen} />
      <Stack.Screen name="OnboardingLevel" component={OnboardingLevelScreen} />
      <Stack.Screen name="OnboardingLocation" component={OnboardingLocationScreen} />
      <Stack.Screen name="OnboardingAvailability" component={OnboardingAvailabilityScreen} />
    </Stack.Navigator>
  );
}
