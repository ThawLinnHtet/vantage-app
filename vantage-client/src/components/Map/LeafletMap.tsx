import { useEffect, useCallback, memo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair } from 'lucide-react';
import type { POI, POICategory } from '../../types';

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  pois: POI[];
  userLocation?: { lat: number; lng: number } | null;
  locationStatus?: 'idle' | 'loading' | 'success' | 'error';
  locationError?: string | null;
  addMode?: boolean;
  selectedPOI?: POI | null;
  onMapClick?: (lat: number, lng: number) => void;
  onLocateClick?: () => void;
  onPOIClick?: (poi: POI) => void;
  onMapLongPress?: (lat: number, lng: number) => void;
}

const CATEGORY_COLORS: Record<POICategory, { bg: string; border: string }> = {
  restaurant: { bg: '#ffc6c6', border: '#ff9999' },
  hotel: { bg: '#ffd8f4', border: '#f4a8c4' },
  activity: { bg: '#c3faf5', border: '#8fdde6' },
  transport: { bg: '#ffe6cd', border: '#ffcc99' },
  attractions: { bg: '#fff8c6', border: '#efe8a8' },
  other: { bg: '#d4f5d9', border: '#a8dcb0' },
};

const CATEGORY_ICONS: Record<POICategory, string> = {
  restaurant: `<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>`,
  hotel: `<path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>`,
  activity: `<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>`,
  transport: `<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>`,
  attractions: `<path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"/>`,
  other: `<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>`,
};

const createCategoryIcon = (category: POICategory, isConfirmed: boolean) => {
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  const size = isConfirmed ? 40 : 32;
  const iconPath = CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
  const pulseAnimation = isConfirmed ? `
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }
      .confirmed-marker {
        animation: pulse 2s ease-in-out infinite;
      }
    </style>
  ` : '';
  const animateIn = `
    <style>
      @keyframes markerPopIn {
        0% { transform: scale(0); opacity: 0; }
        60% { transform: scale(1.15); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      .marker-container {
        animation: markerPopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
    </style>
  `;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      ${pulseAnimation}
      ${animateIn}
      <div class="${isConfirmed ? 'confirmed-marker' : ''}" style="
        width: ${size}px;
        height: ${size}px;
        background: ${colors.bg};
        border: 3px solid ${colors.border};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ${isConfirmed ? 'transform: scale(1.1);' : ''}
      ">
        <svg width="${size * 0.55}" height="${size * 0.55}" viewBox="0 0 24 24" fill="${colors.border}">
          ${iconPath}
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #5b76fe;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 8px rgba(91, 118, 254, 0.3), 0 2px 8px rgba(0,0,0,0.2);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapClickHandler({ 
  onClick, 
  enabled, 
  onMapClick,
  isMobile 
}: { 
  onClick: (lat: number, lng: number) => void; 
  enabled: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  isMobile?: boolean;
}) {
  useMapEvents({
    click: (e) => {
      if (enabled && onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      } else if (onMapClick && !enabled) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
    contextmenu: (e) => {
      if (isMobile && onMapClick && !enabled) {
        e.originalEvent.preventDefault();
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapController({ center, zoom }: { center?: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

function POIMarker({ poi, onClick }: { poi: POI; onClick?: (poi: POI) => void }) {
  const icon = createCategoryIcon(poi.category, poi.status === 'confirmed');
  
  return (
    <Marker
      position={[poi.lat, poi.lng]}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(poi),
      }}
    >
      <Popup>
        <div style={{ minWidth: 180, fontFamily: 'system-ui, sans-serif' }}>
          <h4 style={{ margin: '0 0 6px', fontWeight: 600, color: '#1c1c1e', fontSize: 15 }}>{poi.name}</h4>
          {poi.description && (
            <p style={{ margin: '0 0 8px', fontSize: 13, color: '#555a6a', lineHeight: 1.4 }}>{poi.description}</p>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ 
              fontSize: 11, 
              padding: '3px 8px', 
              borderRadius: 12,
              background: CATEGORY_COLORS[poi.category].bg,
              color: '#1c1c1e',
              fontWeight: 500
            }}>
              {poi.category}
            </span>
            {poi.status === 'confirmed' && (
              <span style={{ fontSize: 11, color: '#00b473', fontWeight: 600 }}>✓ Confirmed</span>
            )}
          </div>
          {poi.cost ? (
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1c1c1e', marginBottom: 6 }}>
              {poi.currency || 'USD'} {poi.cost.toLocaleString()}
            </div>
          ) : null}
          <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', justifyContent: 'space-between' }}>
            <span>👍 {(poi.votes?.length || 0) === 0 ? 'No votes yet' : `${(poi.votes?.length || 0)} ${((poi.votes?.length || 0) === 1 ? 'vote' : 'votes')}`}</span>
            {poi.createdAt && (
              <span>{new Date(poi.createdAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function LeafletMapComponent({
  center,
  zoom = 13,
  pois,
  userLocation,
  locationStatus = 'idle',
  locationError,
  addMode = false,
  selectedPOI,
  onMapClick,
  onLocateClick,
  onPOIClick,
  onMapLongPress,
}: LeafletMapProps) {
  const defaultCenter: [number, number] = center || [48.8566, 2.3522];
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    onMapClick?.(lat, lng);
  }, [onMapClick]);

  const handleMapLongPress = useCallback((lat: number, lng: number) => {
    onMapLongPress?.(lat, lng);
  }, [onMapLongPress]);

  function SelectedPOIFlyTo({ poi, zoom }: { poi: POI | null | undefined; zoom: number }) {
    const map = useMap();
    useEffect(() => {
      const lat = Number(poi?.lat);
      const lng = Number(poi?.lng);
      if (poi && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        map.flyTo([lat, lng], zoom, { duration: 1 });
      }
    }, [poi, zoom, map]);
    return null;
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 300, position: 'relative' }}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <MapController center={center} zoom={zoom} />
        <SelectedPOIFlyTo poi={selectedPOI} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler 
          onClick={handleMapClick} 
          enabled={addMode} 
          onMapClick={handleMapLongPress}
          isMobile={isMobile}
        />
        
        {/* User Location Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon}>
            <Popup>
              <div style={{ fontSize: 14 }}>
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* POI Markers */}
        {pois.map((poi) => (
          <POIMarker key={poi._id} poi={poi} onClick={onPOIClick} />
        ))}
      </MapContainer>
      
      {/* Location Status Indicator */}
      {locationStatus === 'loading' && (
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'white',
          color: '#374151',
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 13,
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ 
            width: 12, 
            height: 12, 
            borderRadius: '50%', 
            border: '2px solid #5b76fe',
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite'
          }} />
          Locating...
        </div>
      )}

      {locationStatus === 'error' && (
        <div style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: '#fef2f2',
          color: '#dc2626',
          padding: '8px 12px',
          borderRadius: 8,
          fontSize: 13,
          zIndex: 1000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          ⚠️ {locationError || 'Location unavailable'}
        </div>
      )}

      {/* Locate Me Button */}
      <button
        onClick={onLocateClick}
        disabled={!userLocation}
        title="Center on my location"
        style={{
          position: 'absolute',
          bottom: 24,
          right: 16,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: userLocation ? 'white' : '#f3f4f6',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          cursor: userLocation ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          transition: 'all 0.2s',
        }}
      >
        <Crosshair 
          size={20} 
          color={userLocation ? '#5b76fe' : '#9ca3af'} 
        />
      </button>
    </div>
  );
}

const LeafletMap = memo(LeafletMapComponent);
export default LeafletMap;