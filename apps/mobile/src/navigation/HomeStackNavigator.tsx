import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { HomeStackParamList } from "./types";
import { HomeScreen } from "@/screens/home/HomeScreen";
import { ConversationsScreen } from "@/screens/chat/ConversationsScreen";
import { ChatScreen } from "@/screens/chat/ChatScreen";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Conversations" component={ConversationsScreen} />
      <Stack.Screen name="ChatConversation" component={ChatScreen} />
    </Stack.Navigator>
  );
}
