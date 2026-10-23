import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { colors, radius, spacing, typography } from '../theme';
import type { LocationFreshness } from '../types/db';

export interface MapPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracyM?: number | null;
  title: string;
  description?: string;
  freshness: LocationFreshness;
}

const markerColor: Record<LocationFreshness, string> = {
  fresh: colors.safe,
  delayed: '#E0A100',
  stale: colors.danger,
  none: colors.textMuted,
};

const OPEN_STREET_MAP_HTML = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <style>
      html, body, #map { height: 100%; width: 100%; margin: 0; background: #eef2f6; }
      .leaflet-popup-content { font: 14px -apple-system, BlinkMacSystemFont, sans-serif; }
      .location-title { display: block; font-weight: 700; margin-bottom: 4px; }
      .location-description { color: #4f5d75; }
    </style>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map('map', { zoomControl: true }).setView([0, 0], 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
      }).addTo(map);
      const locations = L.featureGroup().addTo(map);

      window.updatePoints = function(points, fitMap) {
        locations.clearLayers();
        points.forEach(function(point) {
          const marker = L.circleMarker([point.latitude, point.longitude], {
            radius: 9,
            color: point.color,
            fillColor: point.color,
            fillOpacity: 0.9,
            weight: 2
          }).addTo(locations);
          const popup = document.createElement('div');
          const title = document.createElement('strong');
          title.className = 'location-title';
          title.textContent = point.title;
          popup.appendChild(title);
          if (point.description) {
            const description = document.createElement('div');
            description.className = 'location-description';
            description.textContent = point.description;
            popup.appendChild(description);
          }
          marker.bindPopup(popup);
          marker.on('click', function() {
            window.ReactNativeWebView.postMessage(String(point.id));
          });
          if (point.accuracyM > 0) {
            L.circle([point.latitude, point.longitude], {
              radius: point.accuracyM,
              color: point.color,
              fillColor: point.color,
              fillOpacity: 0.12,
              weight: 1
            }).addTo(locations);
          }
        });
        if (fitMap && points.length === 1) {
          map.setView([points[0].latitude, points[0].longitude], 15);
        } else if (fitMap && points.length > 1 && locations.getBounds().isValid()) {
          map.fitBounds(locations.getBounds().pad(0.2), { maxZoom: 15 });
        }
      };

      window.ReactNativeWebView.postMessage('ready');
    </script>
  </body>
</html>`;

function OpenStreetMap({ points, onSelect }: { points: MapPoint[]; onSelect?: (id: string) => void }) {
  const webView = useRef<WebView<object> | null>(null);
  const [ready, setReady] = useState(false);
  const previousViewportKey = useRef('');
  const viewportKey = points.map((point) =>
    points.length === 1 ? `${point.id}:${point.latitude}:${point.longitude}` : point.id,
  ).join('|');
  const pointsJson = JSON.stringify(points.map((point) => ({
    id: point.id,
    latitude: point.latitude,
    longitude: point.longitude,
    accuracyM: point.accuracyM ?? null,
    title: point.title,
    description: point.description ?? '',
    color: markerColor[point.freshness],
  }))).replace(/</g, '\\u003c');

  useEffect(() => {
    if (!ready) return;
    const fitMap = previousViewportKey.current !== viewportKey;
    previousViewportKey.current = viewportKey;
    webView.current?.injectJavaScript(`window.updatePoints(${pointsJson}, ${fitMap}); true;`);
  }, [pointsJson, ready, viewportKey]);

  const handleMessage = (event: WebViewMessageEvent) => {
    const selectedId = event.nativeEvent.data;
    if (points.some((point) => point.id === selectedId)) onSelect?.(selectedId);
    if (selectedId === 'ready') setReady(true);
  };

  return (
    <View style={styles.mapWrap} testID="in-app-map-panel">
      <WebView<object>
        ref={webView}
        testID="in-app-map"
        source={{ html: OPEN_STREET_MAP_HTML }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled={false}
        setSupportMultipleWindows={false}
        onMessage={handleMessage}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.mapState}>
            <ActivityIndicator color={colors.navy} />
            <Text style={typography.small}>Loading map…</Text>
          </View>
        )}
        renderError={() => (
          <View style={styles.mapState}>
            <Text style={typography.bodyMuted}>Map could not load. Check your internet connection.</Text>
          </View>
        )}
        accessibilityLabel="Live map of shared locations"
      />
      <Text style={styles.attribution}>© OpenStreetMap contributors · Internet required</Text>
    </View>
  );
}

/** Free in-app OpenStreetMap view. Map tiles need an internet connection. */
export function MapPanel({ points, height = 260, onSelect, emptyText = 'No location to show yet.' }: {
  points: MapPoint[];
  height?: number;
  onSelect?: (id: string) => void;
  emptyText?: string;
}) {
  if (points.length === 0) {
    return (
      <View style={[styles.empty, { minHeight: 100 }]}>
        <Text style={typography.bodyMuted}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={{ height }}>
      <OpenStreetMap points={points} onSelect={onSelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.navyLight,
  },
  mapState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  attribution: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    overflow: 'hidden',
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    color: colors.textMuted,
    fontSize: 10,
  },
  empty: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.navyLight,
    padding: spacing.lg,
    marginBottom: spacing.md,
    justifyContent: 'center',
  },
});
