import { useState } from "react";
import { View, Text, StyleSheet, Platform, TouchableOpacity } from "react-native";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import type { Match } from "@/types";
import { SPORTS } from "@smashi/shared/constants";
import { formatMatchDateShort } from "@/lib/dateUtils";
import type { TabToMainNavProp } from "@/navigation/types";

const SPORT_EMOJIS: Record<string, string> = {
  TENNIS: "🎾",
  PADEL: "🏓",
  SQUASH: "🟠",
};

interface MatchMapViewProps {
  matches: Match[];
  userLatitude?: number;
  userLongitude?: number;
  isMatchRecommended: (match: Match) => boolean;
}

function CustomMarker({ sport, isRecommended, isGhost }: { sport: string; isRecommended: boolean; isGhost: boolean }) {
  if (isGhost) {
    return (
      <View style={markerStyles.ghostContainer}>
        <View style={markerStyles.ghostDot} />
      </View>
    );
  }

  const emoji = SPORT_EMOJIS[sport] ?? "🏅";
  return (
    <View style={[
      markerStyles.container,
      { borderColor: isRecommended ? "#2ECC71" : "#D1D5DB" },
    ]}>
      <Text style={markerStyles.emoji}>{emoji}</Text>
      {isRecommended && (
        <View style={markerStyles.badge}>
          <Text style={markerStyles.badgeText}>★</Text>
        </View>
      )}
    </View>
  );
}

const markerStyles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emoji: {
    fontSize: 20,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2ECC71",
    borderWidth: 2,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 8,
    color: "white",
    fontWeight: "700",
  },
  ghostContainer: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#9CA3AF",
    opacity: 0.55,
    borderWidth: 2.5,
    borderColor: "#D1D5DB",
  },
});

export function MatchMapView({ matches, userLatitude, userLongitude, isMatchRecommended }: MatchMapViewProps) {
  const navigation = useNavigation<TabToMainNavProp>();
  const [showAll, setShowAll] = useState(false);

  const compatibleMatches = matches.filter(isMatchRecommended);
  const otherMatches = matches.filter((m) => !isMatchRecommended(m));
  const displayedCompatible = compatibleMatches.length;
  const displayedTotal = matches.length;

  return (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude: userLatitude ?? 43.2965,
          longitude: userLongitude ?? 5.3698,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Parties compatibles — toujours affichées */}
        {compatibleMatches.map((match) => {
          const sportEmoji = SPORT_EMOJIS[match.sport] ?? "🏅";
          return (
            <Marker
              key={match.id}
              coordinate={{ latitude: match.latitude, longitude: match.longitude }}
              zIndex={2}
            >
              <CustomMarker sport={match.sport} isRecommended isGhost={false} />
              <Callout onPress={() => navigation.navigate("MatchDetail", { matchId: match.id })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>
                    {sportEmoji} {match.title || `Partie de ${SPORTS[match.sport]?.label ?? match.sport}`}
                  </Text>
                  <Text style={styles.calloutInfo}>📍 {match.locationName}</Text>
                  <Text style={styles.calloutInfo}>📅 {formatMatchDateShort(match.scheduledAt)}</Text>
                  <Text style={styles.calloutInfo}>👥 {match.currentPlayers}/{match.maxPlayers} joueurs</Text>
                  <Text style={styles.calloutRecommended}>★ Recommandé pour toi</Text>
                  <Text style={styles.calloutCta}>Voir le détail →</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}

        {/* Parties non compatibles — grisées, affichées seulement si showAll */}
        {showAll && otherMatches.map((match) => {
          const sportEmoji = SPORT_EMOJIS[match.sport] ?? "🏅";
          return (
            <Marker
              key={match.id}
              coordinate={{ latitude: match.latitude, longitude: match.longitude }}
              zIndex={1}
              opacity={0.6}
            >
              <CustomMarker sport={match.sport} isRecommended={false} isGhost />
              <Callout onPress={() => navigation.navigate("MatchDetail", { matchId: match.id })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>
                    {sportEmoji} {match.title || `Partie de ${SPORTS[match.sport]?.label ?? match.sport}`}
                  </Text>
                  <Text style={styles.calloutInfo}>📍 {match.locationName}</Text>
                  <Text style={styles.calloutInfo}>📅 {formatMatchDateShort(match.scheduledAt)}</Text>
                  <Text style={styles.calloutInfo}>👥 {match.currentPlayers}/{match.maxPlayers} joueurs</Text>
                  <Text style={styles.calloutCta}>Voir le détail →</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Compteur */}
      <View style={styles.counterBadge}>
        <Text style={styles.counterText}>
          {showAll
            ? `${displayedTotal} partie${displayedTotal > 1 ? "s" : ""} sur la carte`
            : `${displayedCompatible} compatible${displayedCompatible > 1 ? "s" : ""} pour toi`
          }
        </Text>
      </View>

      {/* Toggle Compatibles / Toutes */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowAll((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={styles.filterToggleText}>
          {showAll ? "★ Compatibles" : `Toutes (${displayedTotal})`}
        </Text>
      </TouchableOpacity>

      {/* Légende */}
      <View style={styles.legend}>
        <View style={styles.legendSportsRow}>
          <Text style={styles.legendItem}>🎾 Tennis</Text>
          <Text style={styles.legendItem}>🏓 Padel</Text>
          <Text style={styles.legendItem}>🟠 Squash</Text>
        </View>
        <View style={styles.legendRecommendedRow}>
          <View style={styles.legendDotGreen} />
          <Text style={styles.legendGreenText}>Compatible</Text>
          <View style={styles.legendDotGray} />
          <Text style={styles.legendGrayText}>Autre</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  counterBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  counterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A2E",
  },
  filterToggle: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: "#2ECC71",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  filterToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A9B50",
  },
  legend: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    gap: 4,
  },
  legendSportsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  legendItem: {
    fontSize: 12,
    color: "#374151",
  },
  legendRecommendedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  legendDotGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#2ECC71",
    backgroundColor: "white",
  },
  legendGreenText: {
    fontSize: 11,
    color: "#2ECC71",
    fontWeight: "600",
    marginRight: 8,
  },
  legendDotGray: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D1D5DB",
    opacity: 0.7,
  },
  legendGrayText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  callout: {
    width: 210,
    padding: 4,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 4,
  },
  calloutInfo: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  calloutRecommended: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2ECC71",
    marginTop: 4,
  },
  calloutCta: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2ECC71",
    marginTop: 6,
    textAlign: "right",
  },
});
