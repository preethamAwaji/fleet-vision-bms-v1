import { useParams, useNavigate } from 'react-router-dom';
import { mockVehicles, telemetryData, batteryTrendData } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { ArrowLeft, Battery, Gauge, MapPin, Thermometer, Zap, Activity, Wifi, Shield } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Battery3SDigitalTwin from '@/components/Battery3SDigitalTwin';
import { TripHistory } from '@/components/TripHistory';
import { useState, useEffect } from 'react';
import { getCurrentLocation, getAddressFromCoords, watchLocation, stopWatchingLocation, Location } from '@/utils/geolocation';

const GaugeChart = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => {
  const pct = (value / max) * 100;
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (pct / 100) * circumference * 0.75;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 140 100" className="w-40">
        <path d="M 10 90 A 60 60 0 1 1 130 90" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" strokeLinecap="round" />
        <path d="M 10 90 A 60 60 0 1 1 130 90" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75}`}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <text x="70" y="75" textAnchor="middle" className="fill-foreground text-2xl font-bold" style={{ fontSize: 24 }}>
          {value}%
        </text>
      </svg>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
};

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<any>(mockVehicles.find((v) => v.id === id));
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('Getting location...');
  const [locationError, setLocationError] = useState<string>('');
  const [watchId, setWatchId] = useState<number | null>(null);
  const [healthTrendData, setHealthTrendData] = useState<any[]>([]);

  // Fetch real-time vehicle data with BMS info
  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/vehicles/${id}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          console.log('🔍 Vehicle Data Received:', data.vehicle);
          console.log('🔍 BMS Data:', data.vehicle.bmsData);
          console.log('🔍 All Predictions:', data.vehicle.bmsData?.allPredictions);
          console.log('🔍 All Predictions Keys:', Object.keys(data.vehicle.bmsData?.allPredictions || {}));
          setVehicle(data.vehicle);
        }
      } catch (error) {
        console.error('Error fetching vehicle data:', error);
      }
    };

    fetchVehicleData();
    const interval = setInterval(fetchVehicleData, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [id]);

  // Fetch real-time battery health trend data
  useEffect(() => {
    const fetchHealthTrend = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/bms/history?hours=1&limit=200');
        const data = await response.json();
        
        if (data.status === 'success' && data.data.length > 0) {
          // Format data for health trend chart
          const formatted = data.data.reverse().map((item: any) => ({
            time: new Date(item.timestamp).toLocaleTimeString(),
            soh: item.soh,
            soc: item.soc
          }));
          setHealthTrendData(formatted);
        }
      } catch (error) {
        console.error('Error fetching health trend:', error);
      }
    };

    fetchHealthTrend();
    const interval = setInterval(fetchHealthTrend, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Get device location for EV-001
  useEffect(() => {
    if (vehicle?.id === 'EV-001') {
      const getLocation = async () => {
        try {
          const location = await getCurrentLocation();
          setCurrentLocation(location);
          
          // Get address from coordinates
          const address = await getAddressFromCoords(location.lat, location.lng);
          setLocationAddress(address);
          
          // Start watching location for real-time updates
          const id = watchLocation((newLocation) => {
            setCurrentLocation(newLocation);
            getAddressFromCoords(newLocation.lat, newLocation.lng).then(setLocationAddress);
          });
          setWatchId(id);
          
          setLocationError('');
        } catch (error) {
          console.error('Location error:', error);
          setLocationError('Unable to get device location. Please enable location services.');
          setLocationAddress('Location unavailable');
        }
      };

      getLocation();

      // Cleanup on unmount
      return () => {
        if (watchId) {
          stopWatchingLocation(watchId);
        }
      };
    }
  }, [vehicle?.id]);

  // Update vehicle location for EV-001 if we have device location
  const displayLocation = vehicle?.id === 'EV-001' && currentLocation 
    ? locationAddress 
    : vehicle?.lastLocation || 'Unknown';

  const displayLat = vehicle?.id === 'EV-001' && currentLocation 
    ? currentLocation.lat 
    : vehicle?.lat || 0;

  const displayLng = vehicle?.id === 'EV-001' && currentLocation 
    ? currentLocation.lng 
    : vehicle?.lng || 0;

  if (!vehicle) return <div className="p-6">Vehicle not found</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/vehicles')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-default">
        <ArrowLeft className="h-4 w-4" /> Back to Vehicles
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{vehicle.name}</h1>
            <StatusBadge status={vehicle.status} />
          </div>
          <p className="text-muted-foreground">{vehicle.vin} · {vehicle.model}</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Battery, label: 'Battery', value: `${vehicle.batteryLevel}%`, sub: `SoH: ${vehicle.batterySoH}%` },
          { icon: Gauge, label: 'Range', value: `${vehicle.range} mi`, sub: `${vehicle.mileage.toLocaleString()} mi total` },
          { icon: MapPin, label: 'Location', value: displayLocation, sub: (
            <div className="flex items-center gap-2">
              <span>{vehicle?.lastUpdated}</span>
              {vehicle?.id === 'EV-001' && currentLocation && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600 font-medium">Live Device Location</span>
                </div>
              )}
            </div>
          ) },
          { icon: Zap, label: 'Driver', value: vehicle.driver, sub: vehicle.status === 'charging' ? 'Currently charging' : '' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4 card-shadow">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <s.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <p className="text-lg font-semibold">{s.value}</p>
            {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="battery" className="space-y-4">
        <TabsList>
          <TabsTrigger value="battery">Battery Health</TabsTrigger>
          <TabsTrigger value="digital-twin" disabled={vehicle.id !== 'EV-001'}>
            {vehicle.id === 'EV-001' ? '3S Digital Twin' : 'Digital Twin (First Vehicle Only)'}
          </TabsTrigger>
          <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
          <TabsTrigger value="history">Trip History</TabsTrigger>
        </TabsList>

        <TabsContent value="battery" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Gauges with Real Data */}
            <div className="rounded-lg border bg-card p-6 card-shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Battery Status</h3>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              </div>
              <div className="flex justify-around">
                <GaugeChart 
                  value={vehicle.bmsData?.soc || vehicle.batteryLevel} 
                  max={100} 
                  label="State of Charge (SOC)" 
                  color="hsl(142,71%,45%)" 
                />
                <GaugeChart 
                  value={vehicle.bmsData?.soh || vehicle.batterySoH} 
                  max={100} 
                  label="State of Health (SOH)" 
                  color="hsl(217,91%,60%)" 
                />
              </div>
              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Pack Voltage:</span>
                  <span className="ml-2 font-medium">{vehicle.bmsData?.packVoltage?.toFixed(2) || 0}V</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Current:</span>
                  <span className="ml-2 font-medium">{vehicle.bmsData?.current?.toFixed(2) || 0}A</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Temp:</span>
                  <span className="ml-2 font-medium">{vehicle.bmsData?.avgTemp?.toFixed(1) || 0}°C</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Safety:</span>
                  <span className={`ml-2 font-medium ${vehicle.bmsData?.safety === 'SAFE' ? 'text-green-600' : 'text-red-600'}`}>
                    {vehicle.bmsData?.safety || 'UNKNOWN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Real-time SoH trend from database */}
            <div className="rounded-lg border bg-card p-6 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Battery Health Trend (Real-time)</h3>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={healthTrendData.length > 0 ? healthTrendData : batteryTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }} 
                    stroke="hsl(220,9%,46%)" 
                  />
                  <YAxis 
                    domain={['dataMin - 1', 'dataMax + 1']} 
                    tick={{ fontSize: 12 }} 
                    stroke="hsl(220,9%,46%)" 
                  />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(214,32%,91%)' }} />
                  <Line 
                    type="monotone" 
                    dataKey="soh" 
                    stroke="hsl(217,91%,60%)" 
                    strokeWidth={2} 
                    dot={{ r: 2 }}
                    name="SOH (%)"
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-2 text-xs text-muted-foreground text-center">
                Showing last {healthTrendData.length > 0 ? '1 hour' : 'sample data'} • Updates every 3s
              </div>
            </div>
          </div>

          {/* ML Predictions Section */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Anomaly Detection */}
            <div className="rounded-lg border bg-card p-6 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Anomaly Detection (ML Models)</h3>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              </div>
              
              {/* Debug Info */}
              <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
                <div>Debug: allPredictions exists? {vehicle.bmsData?.allPredictions ? 'YES' : 'NO'}</div>
                <div>Debug: allPredictions keys: {vehicle.bmsData?.allPredictions ? Object.keys(vehicle.bmsData.allPredictions).join(', ') : 'none'}</div>
                <div>Debug: allPredictions count: {vehicle.bmsData?.allPredictions ? Object.keys(vehicle.bmsData.allPredictions).length : 0}</div>
              </div>
              
              {/* All Anomaly Types Grid */}
              {(() => {
                const allPreds = vehicle.bmsData?.allPredictions;
                console.log('🎨 Rendering allPredictions:', allPreds);
                console.log('🎨 allPredictions type:', typeof allPreds);
                console.log('🎨 allPredictions keys:', allPreds ? Object.keys(allPreds) : 'null/undefined');
                
                return allPreds && Object.keys(allPreds).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(vehicle.bmsData.allPredictions)
                    .sort(([, a]: any, [, b]: any) => Math.max(b.rf_confidence, b.xgb_confidence) - Math.max(a.rf_confidence, a.xgb_confidence))
                    .map(([anomalyType, scores]: any) => {
                      const maxConfidence = Math.max(scores.rf_confidence, scores.xgb_confidence);
                      const isDetected = maxConfidence > 0.25 && anomalyType !== 'NORMAL';
                      const isNormal = anomalyType === 'NORMAL';
                      
                      // Determine background color based on confidence and type
                      const bgColor = isNormal 
                        ? (maxConfidence > 0.7 ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200')
                        : isDetected
                          ? maxConfidence > 0.8 ? 'bg-red-50 border-red-400' 
                            : maxConfidence > 0.6 ? 'bg-orange-50 border-orange-400'
                            : maxConfidence > 0.4 ? 'bg-yellow-50 border-yellow-400'
                            : 'bg-blue-50 border-blue-300'
                          : 'bg-gray-50 border-gray-200';
                      
                      const textColor = isNormal
                        ? (maxConfidence > 0.7 ? 'text-green-800' : 'text-gray-600')
                        : isDetected
                          ? maxConfidence > 0.8 ? 'text-red-800'
                            : maxConfidence > 0.6 ? 'text-orange-800'
                            : maxConfidence > 0.4 ? 'text-yellow-800'
                            : 'text-blue-800'
                          : 'text-gray-600';
                      
                      return (
                        <div 
                          key={anomalyType} 
                          className={`p-3 rounded-lg border-2 transition-all duration-300 ${bgColor} ${isDetected || (isNormal && maxConfidence > 0.7) ? 'shadow-md' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-semibold text-sm ${textColor}`}>
                              {anomalyType.replace(/_/g, ' ')}
                            </span>
                            {(isDetected || (isNormal && maxConfidence > 0.7)) && (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                isNormal ? 'bg-green-200 text-green-800' :
                                maxConfidence > 0.8 ? 'bg-red-200 text-red-800' :
                                maxConfidence > 0.6 ? 'bg-orange-200 text-orange-800' :
                                maxConfidence > 0.4 ? 'bg-yellow-200 text-yellow-800' :
                                'bg-blue-200 text-blue-800'
                              }`}>
                                {isNormal ? '✓ ACTIVE' : '⚠ DETECTED'}
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {/* Random Forest */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-muted-foreground">Random Forest</span>
                                <span className={`text-xs font-bold ${scores.rf_confidence > 0.5 ? textColor : 'text-gray-500'}`}>
                                  {(scores.rf_confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    isNormal ? 'bg-green-500' :
                                    scores.rf_confidence > 0.8 ? 'bg-red-500' :
                                    scores.rf_confidence > 0.6 ? 'bg-orange-500' :
                                    scores.rf_confidence > 0.4 ? 'bg-yellow-500' :
                                    'bg-blue-500'
                                  }`}
                                  style={{ width: `${scores.rf_confidence * 100}%` }}
                                />
                              </div>
                            </div>
                            
                            {/* XGBoost */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-muted-foreground">XGBoost</span>
                                <span className={`text-xs font-bold ${scores.xgb_confidence > 0.5 ? textColor : 'text-gray-500'}`}>
                                  {(scores.xgb_confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    isNormal ? 'bg-green-600' :
                                    scores.xgb_confidence > 0.8 ? 'bg-red-600' :
                                    scores.xgb_confidence > 0.6 ? 'bg-orange-600' :
                                    scores.xgb_confidence > 0.4 ? 'bg-yellow-600' :
                                    'bg-purple-500'
                                  }`}
                                  style={{ width: `${scores.xgb_confidence * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Max confidence indicator */}
                          {(isDetected || (isNormal && maxConfidence > 0.7)) && (
                            <div className="mt-2 pt-2 border-t border-current/20">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">Max Confidence:</span>
                                <span className="font-bold">{(maxConfidence * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No ML Data Available</p>
                  <p className="text-xs text-muted-foreground mt-1">Waiting for predictions...</p>
                </div>
              )
              })()}
              
              {/* Summary */}
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Top RF Prediction</div>
                    <div className="font-bold text-blue-800">{vehicle.bmsData?.rfAnomaly || 'UNKNOWN'}</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Top XGB Prediction</div>
                    <div className="font-bold text-purple-800">{vehicle.bmsData?.xgbAnomaly || 'UNKNOWN'}</div>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-muted-foreground mb-2">Confidence Levels:</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span>Critical (&gt;80%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    <span>High (60-80%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-500"></div>
                    <span>Medium (40-60%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span>Low (25-40%)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span>Normal (&gt;70%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cycle & Safety Info */}
            <div className="rounded-lg border bg-card p-6 card-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Battery Lifecycle & Safety</h3>
              </div>
              
              <div className="space-y-4">
                {/* Cycle Count */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-900">Charge Cycles</span>
                    <span className="text-2xl font-bold text-purple-600">
                      {vehicle.bmsData?.cycles?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                  <div className="text-xs text-purple-700">
                    Total charge/discharge cycles completed
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Expected lifetime: ~2000 cycles
                  </div>
                </div>

                {/* Safety Classification */}
                <div className={`p-4 rounded-lg border ${
                  vehicle.bmsData?.safety === 'SAFE' 
                    ? 'bg-green-50 border-green-200' 
                    : vehicle.bmsData?.safety === 'WARNING'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Safety Status</span>
                    <span className={`text-2xl font-bold ${
                      vehicle.bmsData?.safety === 'SAFE' 
                        ? 'text-green-600' 
                        : vehicle.bmsData?.safety === 'WARNING'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      {vehicle.bmsData?.safety || 'UNKNOWN'}
                    </span>
                  </div>
                  <div className={`text-xs ${
                    vehicle.bmsData?.safety === 'SAFE' 
                      ? 'text-green-700' 
                      : vehicle.bmsData?.safety === 'WARNING'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    ML-based safety classification
                  </div>
                </div>

                {/* Charging Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg border ${
                    vehicle.bmsData?.charging 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="text-xs text-muted-foreground mb-1">Charging</div>
                    <div className={`text-lg font-bold ${
                      vehicle.bmsData?.charging ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {vehicle.bmsData?.charging ? 'YES' : 'NO'}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${
                    vehicle.bmsData?.discharging 
                      ? 'bg-orange-50 border-orange-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="text-xs text-muted-foreground mb-1">Discharging</div>
                    <div className={`text-lg font-bold ${
                      vehicle.bmsData?.discharging ? 'text-orange-600' : 'text-gray-400'
                    }`}>
                      {vehicle.bmsData?.discharging ? 'YES' : 'NO'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Hardware Fault Codes Section */}
          <div className="rounded-lg border bg-card p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold">Hardware Fault Codes</h3>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            </div>
            
            {/* Current Fault Alert */}
            {vehicle.bmsData?.fault && vehicle.bmsData?.faultCode && vehicle.bmsData?.faultCode !== 'F00' && (
              <div className="mb-4">
                <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="font-semibold text-red-800">Hardware Fault Detected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-red-600">Fault Code:</span>
                      <span className="ml-2 font-mono font-bold text-red-800">{vehicle.bmsData.faultCode}</span>
                    </div>
                    <div>
                      <span className="text-xs text-red-600">Reason:</span>
                      <span className="ml-2 font-semibold text-red-800">{vehicle.bmsData.faultReason}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* All Fault Codes Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { code: 'F00', name: 'NORMAL', desc: 'No Fault' },
                { code: 'F01', name: 'OVERVOLT', desc: 'Cell Overvoltage' },
                { code: 'F02', name: 'OVERTEMP', desc: 'Cell Overtemperature' },
                { code: 'F03', name: 'OVERCURR', desc: 'Overcurrent Detected' },
                { code: 'F04', name: 'UNDERVOLT', desc: 'Cell Undervoltage' },
                { code: 'F05', name: 'IMBALANCE', desc: 'Cell Imbalance' },
                { code: 'F06', name: 'OVERPRES', desc: 'Pressure Too High' },
                { code: 'F07', name: 'THERMAL', desc: 'Thermal Runaway' },
              ].map((fault) => {
                const isActive = vehicle.bmsData?.faultCode === fault.code && vehicle.bmsData?.fault;
                const isNormal = fault.code === 'F00';
                return (
                  <div 
                    key={fault.code}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isActive 
                        ? 'bg-red-100 border-red-400 shadow-lg' 
                        : isNormal && !vehicle.bmsData?.fault
                        ? 'bg-green-50 border-green-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-mono font-bold text-sm ${
                        isActive ? 'text-red-700' : isNormal && !vehicle.bmsData?.fault ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {fault.code}
                      </span>
                      {isActive && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded animate-pulse">
                          ACTIVE
                        </span>
                      )}
                      {isNormal && !vehicle.bmsData?.fault && (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded">
                          OK
                        </span>
                      )}
                    </div>
                    <div className={`font-semibold text-sm mb-1 ${
                      isActive ? 'text-red-800' : isNormal && !vehicle.bmsData?.fault ? 'text-green-800' : 'text-gray-700'
                    }`}>
                      {fault.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {fault.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="digital-twin" className="space-y-4">
          {vehicle.id === 'EV-001' ? (
            <Battery3SDigitalTwin isVisible={true} />
          ) : (
            <div className="rounded-lg border bg-card p-6 card-shadow">
              <div className="text-center py-12">
                <Battery className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">3S Digital Twin</h3>
                <p className="text-sm text-muted-foreground">
                  The 3S Battery Digital Twin is only available for the first vehicle (EV-001 - Tata Nexon EV).
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Please select EV-001 from the vehicles list to view the detailed 3S battery digital twin.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="telemetry" className="space-y-4">
          {/* Real-time Telemetry Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary Metrics */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold">Primary Telemetry</h3>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-green-600">LIVE</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Pack Voltage</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{telemetryData[0].voltage * 3}V</div>
                  <div className="text-xs text-blue-700">3S Configuration</div>
                  <div className="mt-2 text-xs text-gray-600">Range: 10.2-12.6V</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Pack Current</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{telemetryData[0].power / 12}A</div>
                  <div className="text-xs text-green-700">Average per cell</div>
                  <div className="mt-2 text-xs text-gray-600">Range: -50A to 60A</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Pack Temperature</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">{telemetryData[0].temperature}°C</div>
                  <div className="text-xs text-orange-700">Average cell temp</div>
                  <div className="mt-2 text-xs text-gray-600">Range: 15-45°C</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Pack Pressure</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">2.1 bar</div>
                  <div className="text-xs text-purple-700">Internal pressure</div>
                  <div className="mt-2 text-xs text-gray-600">Range: 1.8-2.5 bar</div>
                </div>
              </div>
            </div>

            {/* Battery Metrics */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Battery className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold">Battery Metrics</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Battery className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">State of Charge</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{vehicle.batteryLevel}%</div>
                  <div className="text-xs text-green-700">Current level</div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-green-500 transition-all duration-500"
                        style={{ width: `${vehicle.batteryLevel}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">State of Health</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{vehicle.batterySoH}%</div>
                  <div className="text-xs text-blue-700">Battery health</div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${vehicle.batterySoH}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Cell Voltage Range</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">3.2-4.2V</div>
                  <div className="text-xs text-yellow-700">Min-Max per cell</div>
                  <div className="mt-2 text-xs text-gray-600">Imbalance: 0.04V</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Internal Resistance</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">2.5 mΩ</div>
                  <div className="text-xs text-red-700">Average per cell</div>
                  <div className="mt-2 text-xs text-gray-600">Range: 1.8-3.2 mΩ</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Telemetry Charts */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold">24-Hour Telemetry Trends</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card p-6 card-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-4 w-4 text-green-600" />
                  <h4 className="font-semibold">Speed Profile</h4>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={telemetryData}>
                    <defs>
                      <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142,71%,45%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(142,71%,45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" />
                    <Tooltip />
                    <Area type="monotone" dataKey="speed" stroke="hsl(142,71%,45%)" fill="url(#speedGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-lg border bg-card p-6 card-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Thermometer className="h-4 w-4 text-orange-600" />
                  <h4 className="font-semibold">Temperature Profile</h4>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={telemetryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" />
                    <Tooltip />
                    <Line type="monotone" dataKey="temperature" stroke="hsl(38,92%,50%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card p-6 card-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <h4 className="font-semibold">Power Consumption</h4>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={telemetryData}>
                    <defs>
                      <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(261,83%,58%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(261,83%,58%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" />
                    <Tooltip />
                    <Area type="monotone" dataKey="power" stroke="hsl(261,83%,58%)" fill="url(#powerGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-lg border bg-card p-6 card-shadow">
                <div className="flex items-center gap-2 mb-4">
                  <Battery className="h-4 w-4 text-green-600" />
                  <h4 className="font-semibold">Battery Level</h4>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={telemetryData}>
                    <defs>
                      <linearGradient id="batteryGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142,71%,45%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(142,71%,45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" />
                    <Tooltip />
                    <Area type="monotone" dataKey="batteryLevel" stroke="hsl(142,71%,45%)" fill="url(#batteryGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Real-time Status Panel */}
          <div className="rounded-lg border bg-card p-6 card-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Wifi className="h-4 w-4 text-green-600" />
              <h3 className="font-semibold">Real-time Status</h3>
              <div className="ml-auto text-xs text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg border">
                <div className="text-lg font-bold text-blue-600">{telemetryData[0].voltage * 3}V</div>
                <div className="text-xs text-gray-600">Pack Voltage</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border">
                <div className="text-lg font-bold text-green-600">{telemetryData[0].power / 12}A</div>
                <div className="text-xs text-gray-600">Pack Current</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border">
                <div className="text-lg font-bold text-orange-600">{telemetryData[0].temperature}°C</div>
                <div className="text-xs text-gray-600">Pack Temp</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border">
                <div className="text-lg font-bold text-purple-600">2.1 bar</div>
                <div className="text-xs text-gray-600">Pack Pressure</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border">
                <div className="text-lg font-bold text-green-600">{vehicle.batteryLevel}%</div>
                <div className="text-xs text-gray-600">SOC</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border">
                <div className="text-lg font-bold text-blue-600">{vehicle.batterySoH}%</div>
                <div className="text-xs text-gray-600">SOH</div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <TripHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VehicleDetail;
