// ==================== ENUMS ====================

export type Sport = "TENNIS" | "PADEL" | "SQUASH";

export type PlayerLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export type MatchStatus = "OPEN" | "FULL" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type RequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED";

export type MatchFeedbackLevel = "TOO_LOW" | "BALANCED" | "TOO_HIGH";

export type CourtSurface = "CLAY" | "HARD" | "GRASS" | "SYNTHETIC";

export type ClubSubscription = "FREE" | "STANDARD" | "PREMIUM";

export type UserRole = "PLAYER" | "CLUB_MANAGER" | "ADMIN";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type NotificationType =
  | "MATCH_SUGGESTION"
  | "REQUEST_RECEIVED"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED"
  | "MATCH_FULL"
  | "MATCH_REMINDER"
  | "MATCH_COMPLETED"
  | "BOOKING_CONFIRMED"
  | "GENERAL";

// ==================== ENTITÉS ====================

export interface User {
  id: string;
  email: string;
  firebaseUid: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: UserRole;
  profile?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  sports: Sport[];
  primarySport?: Sport;
  level: PlayerLevel;
  fftRanking?: string;
  tenupScore?: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  postalCode?: string;
  searchRadius: number;
  availabilities?: WeeklyAvailability;
  preferredPosition?: string;
  isHandisport: boolean;
  handicapDetails?: string;
  comfortLevelMin?: number;
  comfortLevelMax?: number;
  totalMatchesPlayed: number;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Match {
  id: string;
  creatorId: string;
  creator?: User;
  sport: Sport;
  title?: string;
  description?: string;
  locationName: string;
  latitude: number;
  longitude: number;
  clubId?: string;
  club?: Club;
  courtId?: string;
  court?: Court;
  scheduledAt: string;
  durationMinutes: number;
  requiredLevel?: PlayerLevel;
  levelFlexibility: number;
  maxPlayers: number;
  currentPlayers: number;
  status: MatchStatus;
  isPublic: boolean;
  players?: MatchPlayer[];
  requests?: MatchRequest[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchPlayer {
  id: string;
  matchId: string;
  userId: string;
  user?: User;
  joinedAt: string;
}

export interface MatchRequest {
  id: string;
  matchId: string;
  match?: Match;
  userId: string;
  user?: User;
  status: RequestStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MatchFeedback {
  id: string;
  matchId: string;
  userId: string;
  levelRating: MatchFeedbackLevel;
  comment?: string;
  createdAt: string;
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  sports: Sport[];
  isHandisportFriendly: boolean;
  subscription: ClubSubscription;
  courts?: Court[];
  createdAt: string;
  updatedAt: string;
}

export interface Court {
  id: string;
  clubId: string;
  club?: Club;
  name: string;
  sport: Sport;
  surface?: CourtSurface;
  isIndoor: boolean;
  isLighted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  matchId?: string;
  userId: string;
  user?: User;
  clubId: string;
  club?: Club;
  courtId: string;
  court?: Court;
  date: string;
  startTime: string;
  endTime: string;
  priceInCents: number;
  commissionInCents: number;
  stripePaymentId?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ==================== MATCHING ====================

export interface CompatibilityScore {
  overall: number;
  levelMatch: number;
  proximity: number;
  availability: number;
  socialFit: number;
}

// ==================== DISPONIBILITÉS ====================

export interface DayAvailability {
  enabled: boolean;
  slots: { start: string; end: string }[];
}

export interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

// ==================== API ====================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ==================== FILTRES ====================

export interface MatchFilters {
  sport?: Sport;
  level?: PlayerLevel;
  city?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  date?: string;
  status?: MatchStatus;
  isHandisport?: boolean;
}

export interface PlayerFilters {
  sport?: Sport;
  level?: PlayerLevel;
  city?: string;
  isHandisport?: boolean;
}
