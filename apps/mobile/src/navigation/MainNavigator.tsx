import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { MainStackParamList } from "./types";

import { TabNavigator } from "./TabNavigator";
import { MatchDetailScreen } from "@/screens/match/MatchDetailScreen";
import { NotificationsScreen } from "@/screens/notifications/NotificationsScreen";
import { PlayerProfileScreen } from "@/screens/player/PlayerProfileScreen";
import { PlayersScreen } from "@/screens/player/PlayersScreen";
import { ConversationsScreen } from "@/screens/chat/ConversationsScreen";
import { ChatScreen } from "@/screens/chat/ChatScreen";
import { MatchFeedbackScreen } from "@/screens/match/MatchFeedbackScreen";

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MatchDetail"
        component={MatchDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PlayerProfile"
        component={PlayerProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Players"
        component={PlayersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatConversation"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MatchFeedback"
        component={MatchFeedbackScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
