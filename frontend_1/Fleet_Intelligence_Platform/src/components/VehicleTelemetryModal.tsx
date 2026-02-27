import { useState, useEffect } from 'react';
import { X, Battery, Zap, Activity, Thermometer, Gauge, MapPin, User, Clock, AlertTriangle, TrendingUp, TrendingDown, Power, Wifi } from 'lucide-react';

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

interface VehicleTelemetryModalProps {
  vehicle: VehicleData | null;
  isOpen: boolean;
  onClose: () => void;
}

const VehicleTelemetryModal: React.FC<VehicleTelemetryModalProps> = ({ vehicle, isOpen, onClose }) => {
  const [liveData, setLiveData] = useState({
    speed: vehicle?.speed || 0,
    temperature: vehicle?.temperature || 0,
    power: vehicle?.power || 0,
    voltage: vehicle?.voltage || 0,
    batteryLevel: vehicle?.batteryLevel || 0,
    efficiency: 85,
    motorRPM: 2500,
    regenPower: 5,
  });

  const [historicalData, setHistoricalData] = useState([
    { time: '10:00', speed: 45, power: 25, battery: 78 },
    { time: '10:15', speed: 52, power: 35, battery: 76 },
    { time: '10:30', speed: 48, power: 28, battery: 74 },
    { time: '10:45', speed: 55, power: 40, battery: 72 },
    { time: '11:00', speed: 50, power: 32, battery: 70 },
  ]);

  // Simulate live data updates
  useEffect(() => {
    if (!isOpen || !vehicle) return;

    const interval = setInterval(() => {
      setLiveData(prev => ({
        ...prev,
        speed: Math.max(0, prev.speed + (Math.random() - 0.5) * 5),
        temperature: Math.max(15, Math.min(40, prev.temperature + (Math.random() - 0.5) * 2)),
        power: Math.max(0, prev.power + (Math.random() - 0.5) * 10),
        voltage: Math.max(350, Math.min(420, prev.voltage + (Math.random() - 0.5) * 5)),
        batteryLevel: Math.max(0, prev.batteryLevel - 0.1),
        efficiency: Math.min(100, Math.max(70, prev.efficiency + (Math.random() - 0.5) * 3)),
        motorRPM: Math.max(0, prev.motorRPM + (Math.random() - 0.5) * 200),
        regenPower: Math.max(0, Math.min(20, prev.regenPower + (Math.random() - 0.5) * 2)),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, vehicle]);

  if (!isOpen || !vehicle) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'charging': return 'text-yellow-600 bg-yellow-100';
      case 'idle': return 'text-blue-600 bg-blue-100';
      case 'maintenance': return 'text-red-600 bg-red-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'bg-green-500';
    if (level > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{vehicle.name}</h2>
              <p className="text-blue-100">{vehicle.model}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(vehicle.status)}`}>
                  {vehicle.status.toUpperCase()}
                </span>
                <div className="flex items-center gap-1 text-blue-100">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm">LIVE</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Speed */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">LIVE</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{Math.round(liveData.speed)}</div>
              <div className="text-sm text-blue-700">km/h</div>
              <div className="flex items-center gap-1 mt-2">
                {liveData.speed > (vehicle.speed || 0) ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className="text-xs text-gray-600">
                  {Math.abs(Math.round(liveData.speed - (vehicle.speed || 0)))} km/h
                </span>
              </div>
            </div>

            {/* Battery */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <Battery className="h-5 w-5 text-green-600" />
                <span className="text-xs text-green-600 font-medium">HEALTH</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{Math.round(liveData.batteryLevel)}%</div>
              <div className="text-sm text-green-700">Battery Level</div>
              <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${getBatteryColor(liveData.batteryLevel)}`}
                  style={{ width: `${liveData.batteryLevel}%` }}
                />
              </div>
            </div>

            {/* Temperature */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <Thermometer className="h-5 w-5 text-orange-600" />
                <span className="text-xs text-orange-600 font-medium">TEMP</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{Math.round(liveData.temperature)}°C</div>
              <div className="text-sm text-orange-700">Motor Temp</div>
              <div className="text-xs text-gray-600 mt-2">
                Optimal: 20-30°C
              </div>
            </div>

            {/* Power */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Power className="h-5 w-5 text-purple-600" />
                <span className="text-xs text-purple-600 font-medium">POWER</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{Math.round(liveData.power)}</div>
              <div className="text-sm text-purple-700">kW Output</div>
              <div className="text-xs text-gray-600 mt-2">
                Regen: {liveData.regenPower} kW
              </div>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Efficiency</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{Math.round(liveData.efficiency)}%</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Motor RPM</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{Math.round(liveData.motorRPM)}</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <Battery className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Voltage</span>
              </div>
              <div className="text-xl font-bold text-gray-900">{Math.round(liveData.voltage)}V</div>
            </div>
          </div>

          {/* Location & Driver Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Location</span>
              </div>
              <div className="text-lg font-semibold text-blue-900">{vehicle.lastLocation}</div>
              <div className="text-sm text-blue-700">
                GPS: {vehicle.lat.toFixed(4)}, {vehicle.lng.toFixed(4)}
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Last updated: {vehicle.lastUpdated}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Driver</span>
              </div>
              <div className="text-lg font-semibold text-green-900">{vehicle.driver}</div>
              <div className="text-sm text-green-700">
                Shift: Active • Duration: 4h 23m
              </div>
              <div className="text-xs text-gray-600 mt-2">
                Driver ID: DRV-{vehicle.id.split('-')[1]}
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-700">Active Alerts</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-yellow-800">Battery Health Warning</span>
                <span className="text-xs text-yellow-600">2 min ago</span>
              </div>
              <div className="text-xs text-yellow-700">
                Battery health at {vehicle.batterySoH}% - Schedule maintenance recommended
              </div>
            </div>
          </div>

          {/* Historical Performance Chart */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Performance Trend</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {historicalData.map((data, index) => (
                <div key={index} className="bg-white rounded p-3 border">
                  <div className="text-xs text-gray-600 mb-1">{data.time}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Speed:</span>
                      <span className="font-medium">{data.speed} km/h</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Power:</span>
                      <span className="font-medium">{data.power} kW</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Battery:</span>
                      <span className="font-medium">{data.battery}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleTelemetryModal;
