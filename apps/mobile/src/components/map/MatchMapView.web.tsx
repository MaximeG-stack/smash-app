import { useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { Match } from "@/types";
import type { TabToMainNavProp } from "@/navigation/types";
import L from "leaflet";
import "leaflet.markercluster";

const LEAFLET_CSS_ID = "leaflet-css";
const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const CLUSTER_CSS_ID = "leaflet-cluster-css";
const CLUSTER_CSS_URL = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css";
const CLUSTER_DEFAULT_CSS_ID = "leaflet-cluster-default-css";
const CLUSTER_DEFAULT_CSS_URL = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css";

function ensureCSS(id: string, href: string) {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function injectCustomCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("smashi-map-css")) return;
  const style = document.createElement("style");
  style.id = "smashi-map-css";
  style.textContent = `
    .smashi-cluster {
      background: rgba(46, 204, 113, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .smashi-cluster div {
      background: #2ECC71;
      color: white;
      border-radius: 50%;
      font-weight: 700;
      font-size: 14px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .smashi-filter-btn {
      cursor: pointer;
      user-select: none;
      transition: background 0.15s;
    }
    .smashi-filter-btn:hover {
      background: #EAFAF1 !important;
    }
  `;
  document.head.appendChild(style);
}

const SPORT_EMOJIS: Record<string, string> = {
  TENNIS: "🎾",
  PADEL: "🏓",
  SQUASH: "🟠",
};

const SPORT_LABELS: Record<string, string> = {
  TENNIS: "Tennis",
  PADEL: "Padel",
  SQUASH: "Squash",
};

interface MatchMapViewProps {
  matches: Match[];
  userLatitude?: number;
  userLongitude?: number;
  isMatchRecommended: (match: Match) => boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createCompatibleIcon(sport: string): L.DivIcon {
  const emoji = SPORT_EMOJIS[sport] ?? "🏅";
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 38px; height: 38px; border-radius: 50%;
      background: white; border: 3px solid #2ECC71;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; line-height: 1;
      position: relative;
    ">${emoji}<div style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#2ECC71;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:8px;color:white;">★</div></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -22],
  });
}

function createGhostIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width: 24px; height: 24px; border-radius: 50%;
      background: #9CA3AF; opacity: 0.55;
      border: 2.5px solid #D1D5DB;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

export function MatchMapView({ matches, userLatitude, userLongitude, isMatchRecommended }: MatchMapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const ghostLayerRef = useRef<L.LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigation = useNavigation<TabToMainNavProp>();
  const [showAll, setShowAll] = useState(false);

  const compatibleMatches = matches.filter(isMatchRecommended);
  const otherMatches = matches.filter((m) => !isMatchRecommended(m));

  // Charger les CSS
  useEffect(() => {
    ensureCSS(LEAFLET_CSS_ID, LEAFLET_CSS_URL);
    ensureCSS(CLUSTER_CSS_ID, CLUSTER_CSS_URL);
    ensureCSS(CLUSTER_DEFAULT_CSS_ID, CLUSTER_DEFAULT_CSS_URL);
    injectCustomCSS();
  }, []);

  // Initialiser la carte
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const lat = userLatitude ?? 43.2965;
    const lng = userLongitude ?? 5.3698;

    const map = L.map(containerRef.current).setView([lat, lng], 12);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Cluster pour les compatibles
    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 50,
      iconCreateFunction: (clusterObj: any) => {
        const count = clusterObj.getChildCount();
        return L.divIcon({
          html: `<div class="smashi-cluster"><div>${count}</div></div>`,
          className: "",
          iconSize: L.point(48, 48),
        });
      },
    });
    clusterRef.current = cluster;
    map.addLayer(cluster);

    // Layer group pour les non-compatibles (ghost)
    const ghostLayer = L.layerGroup();
    ghostLayerRef.current = ghostLayer;

    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      ghostLayerRef.current = null;
    };
  }, [userLatitude, userLongitude]);

  // Mettre à jour les markers compatibles
  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    cluster.clearLayers();

    compatibleMatches.forEach((match) => {
      const icon = createCompatibleIcon(match.sport);
      const sportEmoji = SPORT_EMOJIS[match.sport] ?? "🏅";
      const sportLabel = SPORT_LABELS[match.sport] ?? match.sport;
      const title = match.title || `Partie de ${sportLabel}`;

      const popupHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; min-width: 200px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #1A1A2E;">
            ${sportEmoji} ${title}
          </div>
          <div style="font-size: 12px; color: #6B7280; margin-bottom: 3px;">📍 ${match.locationName}</div>
          <div style="font-size: 12px; color: #6B7280; margin-bottom: 3px;">📅 ${formatDate(match.scheduledAt)}</div>
          <div style="font-size: 12px; color: #6B7280; margin-bottom: 3px;">👥 ${match.currentPlayers}/${match.maxPlayers} joueurs</div>
          <div style="font-size: 12px; font-weight: 600; color: #2ECC71; margin-top: 4px;">★ Recommandé pour toi</div>
          <div id="popup-link-${match.id}" style="font-size: 13px; font-weight: 600; color: #2ECC71; margin-top: 8px; cursor: pointer; text-align: right;">
            Voir le détail →
          </div>
        </div>
      `;

      const marker = L.marker([match.latitude, match.longitude], { icon, zIndexOffset: 1000 });
      marker.bindPopup(popupHtml);
      marker.on("popupopen", () => {
        const linkEl = document.getElementById(`popup-link-${match.id}`);
        if (linkEl) {
          linkEl.onclick = () => navigation.navigate("MatchDetail", { matchId: match.id });
        }
      });
      cluster.addLayer(marker);
    });
  }, [compatibleMatches, navigation]);

  // Mettre à jour les markers non-compatibles (ghost)
  useEffect(() => {
    const map = mapRef.current;
    const ghostLayer = ghostLayerRef.current;
    if (!map || !ghostLayer) return;

    ghostLayer.clearLayers();

    if (showAll) {
      otherMatches.forEach((match) => {
        const icon = createGhostIcon();
        const sportEmoji = SPORT_EMOJIS[match.sport] ?? "🏅";
        const sportLabel = SPORT_LABELS[match.sport] ?? match.sport;
        const title = match.title || `Partie de ${sportLabel}`;

        const popupHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; min-width: 200px;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #9CA3AF;">
              ${sportEmoji} ${title}
            </div>
            <div style="font-size: 12px; color: #9CA3AF; margin-bottom: 3px;">📍 ${match.locationName}</div>
            <div style="font-size: 12px; color: #9CA3AF; margin-bottom: 3px;">📅 ${formatDate(match.scheduledAt)}</div>
            <div style="font-size: 12px; color: #9CA3AF; margin-bottom: 3px;">👥 ${match.currentPlayers}/${match.maxPlayers} joueurs</div>
            <div id="popup-link-${match.id}" style="font-size: 13px; font-weight: 600; color: #2ECC71; margin-top: 8px; cursor: pointer; text-align: right;">
              Voir le détail →
            </div>
          </div>
        `;

        const marker = L.marker([match.latitude, match.longitude], { icon, zIndexOffset: 0 });
        marker.bindPopup(popupHtml);
        marker.on("popupopen", () => {
          const linkEl = document.getElementById(`popup-link-${match.id}`);
          if (linkEl) {
            linkEl.onclick = () => navigation.navigate("MatchDetail", { matchId: match.id });
          }
        });
        ghostLayer.addLayer(marker);
      });
      map.addLayer(ghostLayer);
    } else {
      map.removeLayer(ghostLayer);
    }
  }, [showAll, otherMatches, navigation]);

  const displayCount = showAll ? matches.length : compatibleMatches.length;

  return (
    <div style={{ flex: 1, position: "relative", marginLeft: 20, marginRight: 20, marginBottom: 8 }}>
      {/* Compteur */}
      <div style={{
        position: "absolute", top: 90, left: 12, zIndex: 1000,
        background: "white", borderRadius: 20, padding: "6px 14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 13, fontWeight: 600, color: "#1A1A2E",
      }}>
        {showAll
          ? `${displayCount} partie${displayCount > 1 ? "s" : ""} sur la carte`
          : `${displayCount} compatible${displayCount > 1 ? "s" : ""} pour toi`
        }
      </div>

      {/* Toggle */}
      <div
        className="smashi-filter-btn"
        onClick={() => setShowAll((v) => !v)}
        style={{
          position: "absolute", top: 12, right: 12, zIndex: 1000,
          background: "white", borderRadius: 20, padding: "6px 14px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          border: "1.5px solid #2ECC71",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 12, fontWeight: 600, color: "#1A9B50",
        }}
      >
        {showAll ? "★ Compatibles" : `Toutes (${matches.length})`}
      </div>

      {/* Légende */}
      <div style={{
        position: "absolute", bottom: 12, left: 12, zIndex: 1000,
        background: "rgba(255,255,255,0.95)", borderRadius: 12, padding: "8px 14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 12, color: "#374151",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span>🎾 Tennis</span>
          <span>🏓 Padel</span>
          <span>🟠 Squash</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span style={{
            display: "inline-block", width: 12, height: 12, borderRadius: "50%",
            border: "2px solid #2ECC71", background: "white",
          }} />
          <span style={{ color: "#2ECC71", fontWeight: 600 }}>Compatible</span>
          <span style={{
            display: "inline-block", width: 10, height: 10, borderRadius: "50%",
            background: "#D1D5DB", opacity: 0.7, marginLeft: 8,
          }} />
          <span style={{ color: "#9CA3AF" }}>Autre</span>
        </div>
      </div>

      {/* Carte */}
      <div
        ref={containerRef}
        style={{
          width: "100%", height: "100%",
          borderRadius: 16, overflow: "hidden",
          minHeight: 400,
        }}
      />
    </div>
  );
}
