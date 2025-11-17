// Google Maps component for displaying POI with category-colored markers
import { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { getCategoryConfig } from '../../config/brands';

export interface POIMarker {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  category: string;
  isBrand?: boolean;
  brandName?: string;
  address?: string;
  types?: string[];
}

interface POIMapProps {
  center: {
    lat: number;
    lng: number;
  };
  markers: POIMarker[];
  selectedCategory?: string;
  onMarkerClick?: (marker: POIMarker) => void;
  zoom?: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

const defaultCenter = {
  lat: 45.4642,
  lng: 9.19,
};

export const POIMap = ({
  center = defaultCenter,
  markers = [],
  selectedCategory,
  onMarkerClick,
  zoom = 15,
}: POIMapProps) => {
  const [selectedMarker, setSelectedMarker] = useState<POIMarker | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    // Load API key from settings
    const settingsData = localStorage.getItem('storebot_settings');
    if (settingsData) {
      try {
        const settings = JSON.parse(settingsData);
        setApiKey(settings.apiKeys?.googleMaps || '');
      } catch (error) {
        console.error('Error loading Google Maps API key:', error);
      }
    }
  }, []);

  // Filter markers by selected category
  const filteredMarkers = selectedCategory
    ? markers.filter((marker) => marker.category === selectedCategory)
    : markers;

  // Get marker icon based on category
  const getMarkerIcon = (marker: POIMarker) => {
    const categoryConfig = getCategoryConfig(marker.category);
    if (!categoryConfig) return undefined;

    return {
      path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
      fillColor: categoryConfig.color,
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: marker.isBrand ? 8 : 6,
    };
  };

  const handleMarkerClick = (marker: POIMarker) => {
    setSelectedMarker(marker);
    if (onMarkerClick) {
      onMarkerClick(marker);
    }
  };

  if (!apiKey) {
    return (
      <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center p-6">
          <p className="text-gray-600 mb-2">
            Configura la chiave API di Google Maps nelle impostazioni
          </p>
          <p className="text-sm text-gray-500">
            Settings ’ API Keys ’ Google Maps
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {filteredMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            onClick={() => handleMarkerClick(marker)}
            icon={getMarkerIcon(marker)}
            title={marker.name}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-semibold text-sm mb-1">
                {selectedMarker.name}
              </h3>
              {selectedMarker.isBrand && selectedMarker.brandName && (
                <p className="text-xs text-blue-600 mb-1">
                  <â {selectedMarker.brandName}
                </p>
              )}
              {selectedMarker.address && (
                <p className="text-xs text-gray-600 mb-1">
                  =Í {selectedMarker.address}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {getCategoryConfig(selectedMarker.category)?.icon || ''}{' '}
                {selectedMarker.category}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};
