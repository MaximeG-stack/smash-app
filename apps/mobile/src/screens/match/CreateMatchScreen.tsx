import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { TabToMainNavProp } from "@/navigation/types";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/services/api";
import type { Sport, PlayerLevel } from "@/types";
import { SPORTS, PLAYER_LEVELS, MATCH_PLAYERS_COUNT } from "@smashi/shared/constants";
import { PACA_CITIES_LIST, getCityCoords } from "@/constants/cities";
import {
  getNextDays,
  getTimeSlots,
  formatDayChip,
  buildDateTime,
  isSameDay,
  formatDuration,
} from "@/lib/dateUtils";

const DURATIONS = [60, 90, 120];

export function CreateMatchScreen() {
  const navigation = useNavigation<TabToMainNavProp>();
  const { user } = useAuthStore();

  // Valeurs par défaut basées sur le profil utilisateur
  const defaultSport: Sport = (user?.profile?.primarySport as Sport) ?? "PADEL";
  const defaultCity = PACA_CITIES_LIST.includes(user?.profile?.city ?? "")
    ? user!.profile!.city!
    : "Marseille";

  // État du formulaire
  const [sport, setSport] = useState<Sport>(defaultSport);
  const [title, setTitle] = useState("");
  const [locationName, setLocationName] = useState("");
  const [selectedCity, setSelectedCity] = useState(defaultCity);
  const [selectedDate, setSelectedDate] = useState<Date>(getNextDays(1)[0]);
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [duration, setDuration] = useState(60);
  const [requiredLevel, setRequiredLevel] = useState<PlayerLevel | null>(null);
  const [maxPlayers, setMaxPlayers] = useState(MATCH_PLAYERS_COUNT[defaultSport].default);
  const [description, setDescription] = useState("");

  // UI state
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const days = getNextDays(14);
  const timeSlots = getTimeSlots();

  // Adapter maxPlayers et durée quand le sport change
  useEffect(() => {
    const counts = MATCH_PLAYERS_COUNT[sport];
    setMaxPlayers(counts.default);
  }, [sport]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!locationName.trim()) e.locationName = "Indique le lieu de la partie";
    const scheduledAt = buildDateTime(selectedDate, selectedHour, selectedMinute);
    if (scheduledAt <= new Date()) e.date = "La date doit être dans le futur";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);

    try {
      const { latitude, longitude } = getCityCoords(selectedCity);
      const scheduledAt = buildDateTime(selectedDate, selectedHour, selectedMinute);

      const { data } = await api.post("/api/matches", {
        sport,
        title: title.trim() || null,
        locationName: locationName.trim(),
        latitude,
        longitude,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: duration,
        requiredLevel: requiredLevel || undefined,
        levelFlexibility: 1,
        maxPlayers,
        description: description.trim() || null,
        isPublic: true,
      });

      // Naviguer vers le détail de la partie créée
      navigation.navigate("MatchDetail", { matchId: data.match.id });

      // Réinitialiser le formulaire
      setTitle("");
      setLocationName("");
      setDescription("");
      setSelectedDate(getNextDays(1)[0]);
      setSelectedHour(10);
      setSelectedMinute(0);
      setDuration(60);
      setRequiredLevel(null);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erreur lors de la création de la partie";
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Erreur", msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Créer une partie</Text>
          <Text style={styles.pageSubtitle}>Définis les détails de ta partie</Text>
        </View>

        {/* ── Sport ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Sport *</Text>
          <View style={styles.chipRow}>
            {(Object.keys(SPORTS) as Sport[]).map((s) => {
              const sp = SPORTS[s];
              const isSelected = sport === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.chip,
                    isSelected && { backgroundColor: sp.bg, borderColor: sp.color },
                  ]}
                  onPress={() => setSport(s)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && { color: sp.text, fontWeight: "700" }]}>
                    {sp.emoji} {sp.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Lieu ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Lieu *</Text>
          <TextInput
            style={[styles.textInput, errors.locationName ? styles.inputError : null]}
            placeholder="Ex : Club de Padel Marseille Nord"
            placeholderTextColor="#9CA3AF"
            value={locationName}
            onChangeText={(t) => { setLocationName(t); setErrors((e) => ({ ...e, locationName: "" })); }}
          />
          {errors.locationName ? <Text style={styles.errorText}>{errors.locationName}</Text> : null}

          <TouchableOpacity style={styles.cityPicker} onPress={() => setShowCityPicker(true)}>
            <Text style={styles.cityPickerLabel}>📍 Ville</Text>
            <Text style={styles.cityPickerValue}>{selectedCity} ›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Date ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date *</Text>
          {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {days.map((day, idx) => {
              const chip = formatDayChip(day);
              const isSelected = isSameDay(day, selectedDate);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                  onPress={() => { setSelectedDate(day); setErrors((e) => ({ ...e, date: "" })); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dateChipDay, isSelected && styles.dateChipTextSelected]}>
                    {chip.dayName}
                  </Text>
                  <Text style={[styles.dateChipNum, isSelected && styles.dateChipTextSelected]}>
                    {chip.dayNum}
                  </Text>
                  <Text style={[styles.dateChipMonth, isSelected && styles.dateChipTextSelected]}>
                    {chip.monthName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Heure ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Heure *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {timeSlots.map((slot, idx) => {
              const isSelected = slot.hour === selectedHour && slot.minute === selectedMinute;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                  onPress={() => { setSelectedHour(slot.hour); setSelectedMinute(slot.minute); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeChipText, isSelected && styles.timeChipTextSelected]}>
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Durée ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Durée</Text>
          <View style={styles.chipRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, duration === d && styles.chipSelected]}
                onPress={() => setDuration(d)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, duration === d && styles.chipTextSelected]}>
                  {formatDuration(d)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Niveau ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Niveau souhaité</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {/* Option "Tous niveaux" */}
            <TouchableOpacity
              style={[styles.levelChip, requiredLevel === null && styles.levelChipSelected]}
              onPress={() => setRequiredLevel(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.levelChipText, requiredLevel === null && styles.levelChipTextSelected]}>
                Tous niveaux
              </Text>
            </TouchableOpacity>
            {(Object.keys(PLAYER_LEVELS) as PlayerLevel[]).map((l) => {
              const lv = PLAYER_LEVELS[l];
              const isSelected = requiredLevel === l;
              return (
                <TouchableOpacity
                  key={l}
                  style={[
                    styles.levelChip,
                    isSelected && { backgroundColor: lv.bg, borderColor: lv.color },
                  ]}
                  onPress={() => setRequiredLevel(l)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.levelChipText, isSelected && { color: lv.text, fontWeight: "700" }]}>
                    {lv.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Nombre de joueurs ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Nombre de joueurs</Text>
          {sport === "PADEL" ? (
            <View style={styles.fixedPlayers}>
              <Text style={styles.fixedPlayersText}>4 joueurs (Padel uniquement)</Text>
            </View>
          ) : sport === "SQUASH" ? (
            <View style={styles.fixedPlayers}>
              <Text style={styles.fixedPlayersText}>2 joueurs (Squash uniquement)</Text>
            </View>
          ) : (
            /* Tennis : 2 ou 4 */
            <View style={styles.chipRow}>
              {[2, 4].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.chip, maxPlayers === n && styles.chipSelected]}
                  onPress={() => setMaxPlayers(n)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, maxPlayers === n && styles.chipTextSelected]}>
                    {n} joueurs
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Titre (optionnel) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Titre (optionnel)</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`Ex : Partie de ${SPORTS[sport].label} le week-end`}
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />
        </View>

        {/* ── Description (optionnel) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description (optionnel)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Infos supplémentaires, niveau attendu, équipement..."
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={500}
          />
        </View>

        {/* ── Bouton créer ── */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Créer la partie 🎾</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Modal sélection de ville ── */}
      <Modal visible={showCityPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir une ville</Text>
              <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={PACA_CITIES_LIST}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.cityItem,
                    selectedCity === item && styles.cityItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCity(item);
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={[
                    styles.cityItemText,
                    selectedCity === item && styles.cityItemTextSelected,
                  ]}>
                    {item}
                  </Text>
                  {selectedCity === item && <Text style={styles.cityCheck}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  chipSelected: {
    backgroundColor: "#EAFAF1",
    borderColor: "#2ECC71",
  },
  chipText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "#1A9B50",
    fontWeight: "700",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1A1A2E",
  },
  textArea: {
    height: 88,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  inputError: {
    borderColor: "#E74C3C",
  },
  errorText: {
    fontSize: 12,
    color: "#E74C3C",
    marginTop: 4,
  },
  cityPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  cityPickerLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  cityPickerValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A9B50",
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  dateChip: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    marginRight: 8,
    minWidth: 60,
  },
  dateChipSelected: {
    backgroundColor: "#EAFAF1",
    borderColor: "#2ECC71",
  },
  dateChipDay: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  dateChipNum: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A2E",
    marginVertical: 2,
  },
  dateChipMonth: {
    fontSize: 11,
    color: "#6B7280",
  },
  dateChipTextSelected: {
    color: "#1A9B50",
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  timeChipSelected: {
    backgroundColor: "#EAFAF1",
    borderColor: "#2ECC71",
  },
  timeChipText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  timeChipTextSelected: {
    color: "#1A9B50",
    fontWeight: "700",
  },
  levelChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    marginRight: 8,
  },
  levelChipSelected: {
    backgroundColor: "#EAFAF1",
    borderColor: "#2ECC71",
  },
  levelChipText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  levelChipTextSelected: {
    color: "#1A9B50",
    fontWeight: "700",
  },
  fixedPlayers: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
  },
  fixedPlayersText: {
    fontSize: 14,
    color: "#6B7280",
  },
  submitButton: {
    backgroundColor: "#2ECC71",
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#2ECC71",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  // Modal ville
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
  },
  modalClose: {
    fontSize: 18,
    color: "#6B7280",
    padding: 4,
  },
  cityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cityItemSelected: {
    backgroundColor: "#EAFAF1",
  },
  cityItemText: {
    fontSize: 15,
    color: "#1A1A2E",
  },
  cityItemTextSelected: {
    color: "#1A9B50",
    fontWeight: "600",
  },
  cityCheck: {
    fontSize: 16,
    color: "#2ECC71",
    fontWeight: "700",
  },
});
