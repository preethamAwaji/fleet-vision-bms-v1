import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Battery, MapPin, Zap, Activity, Thermometer, Gauge } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './EVMap.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface VehicleData {
  id: string;
  name: string;
  model: string;
  lat: number;
  lng: number;
  batteryLevel: number;
  batterySoH: number;
  status: 'active' | 'charging' | 'idle' | 'maintenance' | 'offline';
  lastLocation: string;
  driver: string;
  speed?: number;
  temperature?: number;
  power?: number;
  voltage?: number;
  lastUpdated: string;
  range: number;
}

interface EVMapProps {
  vehicles: VehicleData[];
  onVehicleClick?: (vehicle: VehicleData) => void;
}

const CustomPopup = ({ vehicle }: { vehicle: VehicleData }) => (
  <div className="p-4 min-w-[280px] bg-white rounded-lg shadow-lg">
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-3 h-3 rounded-full ${
        vehicle.status === 'active' ? 'bg-green-500' :
        vehicle.status === 'charging' ? 'bg-yellow-500' :
        vehicle.status === 'idle' ? 'bg-blue-500' :
        vehicle.status === 'maintenance' ? 'bg-red-500' :
        'bg-gray-500'
      }`} />
      <h3 className="font-bold text-lg">{vehicle.name}</h3>
    </div>
    
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-gray-500" />
        <span className="text-gray-700">{vehicle.lastLocation}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Battery className="h-4 w-4 text-gray-500" />
        <div className="flex-1">
          <div className="flex justify-between">
            <span className="text-gray-700">Battery Level</span>
            <span className={`font-semibold ${
              vehicle.batteryLevel > 50 ? 'text-green-600' :
              vehicle.batteryLevel > 20 ? 'text-yellow-600' :
              'text-red-600'
            }`}>{vehicle.batteryLevel}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className={`h-2 rounded-full ${
                vehicle.batteryLevel > 50 ? 'bg-green-500' :
                vehicle.batteryLevel > 20 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${vehicle.batteryLevel}%` }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Battery className="h-4 w-4 text-gray-500" />
        <div className="flex-1">
          <div className="flex justify-between">
            <span className="text-gray-700">Battery Health</span>
            <span className={`font-semibold ${
              vehicle.batterySoH > 90 ? 'text-green-600' :
              vehicle.batterySoH > 80 ? 'text-yellow-600' :
              'text-red-600'
            }`}>{vehicle.batterySoH}%</span>
          </div>
        </div>
      </div>
      
      {vehicle.speed !== undefined && (
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-gray-500" />
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="text-gray-700">Speed</span>
              <span className="font-semibold text-blue-600">{vehicle.speed} km/h</span>
            </div>
          </div>
        </div>
      )}
      
      {vehicle.temperature !== undefined && (
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-gray-500" />
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="text-gray-700">Temperature</span>
              <span className="font-semibold text-orange-600">{vehicle.temperature}°C</span>
            </div>
          </div>
        </div>
      )}
      
      {vehicle.power !== undefined && (
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-gray-500" />
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="text-gray-700">Power</span>
              <span className="font-semibold text-purple-600">{vehicle.power} kW</span>
            </div>
          </div>
        </div>
      )}
      
      {vehicle.voltage !== undefined && (
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-gray-500" />
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="text-gray-700">Voltage</span>
              <span className="font-semibold text-indigo-600">{vehicle.voltage} V</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs">Driver:</span>
        <span className="text-gray-700 text-sm font-medium">{vehicle.driver}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs">Status:</span>
        <span className={`text-xs font-medium px-2 py-1 rounded ${
          vehicle.status === 'active' ? 'bg-green-100 text-green-800' :
          vehicle.status === 'charging' ? 'bg-yellow-100 text-yellow-800' :
          vehicle.status === 'idle' ? 'bg-blue-100 text-blue-800' :
          vehicle.status === 'maintenance' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
        </span>
      </div>
      
      <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
        Last updated: {vehicle.lastUpdated}
      </div>
    </div>
  </div>
);

const DetailedVehiclePopup = ({ vehicle }: { vehicle: VehicleData }) => (
  <div className="p-4 min-w-[350px] bg-white rounded-lg shadow-lg">
    {/* Vehicle Header */}
    <div className="flex items-center gap-3 mb-4 pb-3 border-b">
      <div className={`w-4 h-4 rounded-full ${
        vehicle.status === 'active' ? 'bg-green-500' :
        vehicle.status === 'charging' ? 'bg-yellow-500' :
        vehicle.status === 'idle' ? 'bg-blue-500' :
        vehicle.status === 'maintenance' ? 'bg-red-500' :
        'bg-gray-500'
      }`} />
      <div>
        <h3 className="font-bold text-lg">{vehicle.name}</h3>
        <p className="text-sm text-gray-600">{vehicle.model}</p>
      </div>
    </div>
    
    {/* Vehicle Details Grid */}
    <div className="grid grid-cols-2 gap-4 mb-4">
      {/* Battery Information */}
      <div className="space-y-2">
        <h4 className="font-semibold text-xs text-gray-500 uppercase">Battery</h4>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm">Level</span>
            <span className={`font-bold text-sm ${
              vehicle.batteryLevel > 50 ? 'text-green-600' :
              vehicle.batteryLevel > 20 ? 'text-yellow-600' :
              'text-red-600'
            }`}>{vehicle.batteryLevel}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full ${
                vehicle.batteryLevel > 50 ? 'bg-green-500' :
                vehicle.batteryLevel > 20 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${vehicle.batteryLevel}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Health</span>
            <span className={`font-bold text-sm ${
              vehicle.batterySoH > 90 ? 'text-green-600' :
              vehicle.batterySoH > 80 ? 'text-yellow-600' :
              'text-red-600'
            }`}>{vehicle.batterySoH}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Range</span>
            <span className="font-bold text-sm text-blue-600">{vehicle.range} km</span>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="space-y-2">
        <h4 className="font-semibold text-xs text-gray-500 uppercase">Performance</h4>
        <div className="space-y-1">
          {vehicle.speed !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Speed</span>
              <span className="font-bold text-sm text-blue-600">{vehicle.speed} km/h</span>
            </div>
          )}
          {vehicle.temperature !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Temp</span>
              <span className="font-bold text-sm text-orange-600">{vehicle.temperature}°C</span>
            </div>
          )}
          {vehicle.power !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Power</span>
              <span className="font-bold text-sm text-purple-600">{vehicle.power} kW</span>
            </div>
          )}
          {vehicle.voltage !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Voltage</span>
              <span className="font-bold text-sm text-indigo-600">{vehicle.voltage} V</span>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Location & Driver Info */}
    <div className="grid grid-cols-2 gap-4 mb-4 pt-3 border-t">
      <div className="space-y-1">
        <h4 className="font-semibold text-xs text-gray-500 uppercase">Location</h4>
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-gray-400" />
          <span className="text-sm">{vehicle.lastLocation}</span>
        </div>
        <div className="text-xs text-gray-500">
          {vehicle.lat.toFixed(4)}, {vehicle.lng.toFixed(4)}
        </div>
      </div>
      
      <div className="space-y-1">
        <h4 className="font-semibold text-xs text-gray-500 uppercase">Driver</h4>
        <div className="text-sm font-medium">{vehicle.driver}</div>
        <div className="text-xs text-gray-500">{vehicle.lastUpdated}</div>
      </div>
    </div>

    {/* Status Badge */}
    <div className="pt-3 border-t">
      <span className={`text-xs font-medium px-2 py-1 rounded ${
        vehicle.status === 'active' ? 'bg-green-100 text-green-800' :
        vehicle.status === 'charging' ? 'bg-yellow-100 text-yellow-800' :
        vehicle.status === 'idle' ? 'bg-blue-100 text-blue-800' :
        vehicle.status === 'maintenance' ? 'bg-red-100 text-red-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
      </span>
    </div>
  </div>
);

const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const EVMap: React.FC<EVMapProps> = ({ vehicles, onVehicleClick }) => {
  // Calculate center of all vehicles
  const center: [number, number] = vehicles.length > 0 
    ? [
        vehicles.reduce((sum, v) => sum + v.lat, 0) / vehicles.length,
        vehicles.reduce((sum, v) => sum + v.lng, 0) / vehicles.length
      ]
    : [15.3647, 75.1240]; // Default to Hubli, Karnataka

  const handleMarkerClick = (vehicle: VehicleData) => {
    console.log('Marker clicked:', vehicle);
    if (onVehicleClick) {
      onVehicleClick(vehicle);
    }
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'active': return '#22c55e';
      case 'charging': return '#eab308';
      case 'idle': return '#3b82f6';
      case 'maintenance': return '#ef4444';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={center} zoom={12} />
        
        {vehicles.map((vehicle) => {
          const markerHtml = `<div style="background-color: ${getMarkerColor(vehicle.status)}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); cursor: pointer; transition: all 0.2s ease; z-index: 1000; position: relative;" onmouseover="this.style.transform='scale(1.4)'" onmouseout="this.style.transform='scale(1)'"></div>`;
          
          return (
            <Marker
              key={vehicle.id}
              position={[vehicle.lat, vehicle.lng]}
              eventHandlers={{
                click: (e) => {
                  console.log('Marker clicked:', vehicle);
                  e.originalEvent.preventDefault();
                  e.originalEvent.stopPropagation();
                  if (onVehicleClick) {
                    onVehicleClick(vehicle);
                  }
                  return false;
                }
              }}
              icon={L.divIcon({
                className: 'clickable-marker',
                html: markerHtml,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })}
            >
              <Popup 
                maxWidth={400}
                className="custom-vehicle-popup"
              >
                <DetailedVehiclePopup vehicle={vehicle} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default EVMap;
