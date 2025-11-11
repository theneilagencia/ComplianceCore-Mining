/**
 * Mapbox 3D Radar Component
 * Displays mining operations on an interactive 3D map with clustering
 */

import { useState, useEffect, useRef } from 'react';
// @ts-ignore - react-map-gl types may not be fully compatible
import Map, { Marker, Popup, NavigationControl, ScaleControl, FullscreenControl } from 'react-map-gl';
import { AlertCircle } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MiningOperation {
  id: string;
  name: string;
  country: string;
  continent: string;
  mineral: string;
  status: 'active' | 'inactive' | 'planned';
  operator: string;
  latitude: number;
  longitude: number;
  source: string;
  lastUpdate: string;
}

interface MapboxRadarProps {
  operations: MiningOperation[];
  onOperationClick?: (operation: MiningOperation) => void;
  darkMode?: boolean;
}

// Mapbox public token (replace with your own or use environment variable)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoicWl2b21pbmluZyIsImEiOiJjbTJxeXo4ZGowMDFsMnFzN3Z5YzN4NTBmIn0.example';

export default function MapboxRadar({ operations, onOperationClick, darkMode = false }: MapboxRadarProps) {
  const [viewState, setViewState] = useState<any>({
    longitude: -50,
    latitude: -10,
    zoom: 2,
    pitch: 45,
    bearing: 0,
  });

  const [selectedOperation, setSelectedOperation] = useState<MiningOperation | null>(null);
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef<any>(null);

  // Fit bounds to show all operations
  useEffect(() => {
    if (operations.length > 0 && mapRef.current) {
      const bounds = operations.reduce(
        (acc, op) => {
          return {
            minLng: Math.min(acc.minLng, op.longitude),
            maxLng: Math.max(acc.maxLng, op.longitude),
            minLat: Math.min(acc.minLat, op.latitude),
            maxLat: Math.max(acc.maxLat, op.latitude),
          };
        },
        {
          minLng: Infinity,
          maxLng: -Infinity,
          minLat: Infinity,
          maxLat: -Infinity,
        }
      );

      if (bounds.minLng !== Infinity) {
        mapRef.current?.fitBounds(
          [
            [bounds.minLng, bounds.minLat],
            [bounds.maxLng, bounds.maxLat],
          ],
          {
            padding: 50,
            maxZoom: 10,
            duration: 1000,
          }
        );
      }
    }
  }, [operations]);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#22c55e'; // green
      case 'inactive':
        return '#ef4444'; // red
      case 'planned':
        return '#eab308'; // yellow
      default:
        return '#6b7280'; // gray
    }
  };

  const handleMarkerClick = (operation: MiningOperation) => {
    setSelectedOperation(operation);
    if (onOperationClick) {
      onOperationClick(operation);
    }
  };

  if (mapError || !MAPBOX_TOKEN || MAPBOX_TOKEN.includes('example')) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#171a4a] dark:bg-gray-800">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Mapbox 3D Indisponível</h3>
          <p className="text-sm text-gray-400 dark:text-gray-400 mb-4">
            Configure a variável de ambiente VITE_MAPBOX_TOKEN para habilitar o mapa 3D.
          </p>
          <p className="text-xs text-gray-500">
            Fallback: Use a visualização de lista ou configure o Mapbox token.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        mapStyle={darkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/satellite-streets-v12'}
        mapboxAccessToken={MAPBOX_TOKEN}
        onError={() => setMapError(true)}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        fog={{
          range: [0.8, 8],
          color: darkMode ? '#1a1a2e' : '#dce4f0',
          'horizon-blend': 0.1,
        }}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />
        <ScaleControl />
        <FullscreenControl />

        {/* Mining Operation Markers */}
        {operations.map((operation) => (
          <Marker
            key={operation.id}
            longitude={operation.longitude}
            latitude={operation.latitude}
            anchor="bottom"
            onClick={(e: any) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(operation);
            }}
          >
            <div
              className="cursor-pointer transition-transform hover:scale-110"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: getMarkerColor(operation.status),
                border: '3px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
          </Marker>
        ))}

        {/* Popup for selected operation */}
        {selectedOperation && (
          <Popup
            longitude={selectedOperation.longitude}
            latitude={selectedOperation.latitude}
            anchor="top"
            onClose={() => setSelectedOperation(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-sm mb-1">{selectedOperation.name}</h3>
              <div className="text-xs space-y-1">
                <p>
                  <span className="font-semibold">País:</span> {selectedOperation.country}
                </p>
                <p>
                  <span className="font-semibold">Mineral:</span> {selectedOperation.mineral}
                </p>
                <p>
                  <span className="font-semibold">Operador:</span> {selectedOperation.operator}
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{' '}
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      selectedOperation.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : selectedOperation.status === 'inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {selectedOperation.status}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Fonte: {selectedOperation.source}
                </p>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/5 dark:bg-gray-800 p-3 rounded-lg shadow-lg">
        <h4 className="text-xs font-semibold mb-2">Status das Operações</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Ativa</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Planejada</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Inativa</span>
          </div>
        </div>
      </div>

      {/* Operations Count */}
      <div className="absolute top-4 left-4 bg-white/5 dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
        <p className="text-sm font-semibold">
          {operations.length} operações minerárias
        </p>
      </div>
    </div>
  );
}

