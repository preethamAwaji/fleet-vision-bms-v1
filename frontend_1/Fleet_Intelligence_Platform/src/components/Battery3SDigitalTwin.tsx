import { useState, useEffect } from 'react';
import { Battery, Zap, Thermometer, AlertTriangle, Activity, Gauge, Wifi, Clock, TrendingUp, TrendingDown, Power, Cpu, Shield } from 'lucide-react';
import { bmsApi } from '@/services/bmsApi';

interface Battery3SCell {
  id: string;
  voltage: number;
  temperature: number;
  resistance: number;
  capacity: number;
  health: number;
  status: 'normal' | 'warning' | 'critical';
  current: number;
  power: number;
  soc: number;
}

interface TelemetryData {
  timestamp: string;
  packVoltage: number;
  packCurrent: number;
  packPower: number;
  packTemp: number;
  packSOC: number;
  packHealth: number;
  cellImbalance: number;
  efficiency: number;
  energyIn: number;
  energyOut: number;
  regenEnergy: number;
  cycleCount: number;
  chargeCycles: number;
  dischargeCycles: number;
}

interface Battery3SDigitalTwinProps {
  isVisible: boolean;
}

const Battery3SDigitalTwin: React.FC<Battery3SDigitalTwinProps> = ({ isVisible }) => {
  const [cells, setCells] = useState<Battery3SCell[]>([
    { id: 'Cell 1', voltage: 3.85, temperature: 24.5, resistance: 0.002, capacity: 95, health: 98, status: 'normal', current: 15.1, power: 58.2, soc: 78 },
    { id: 'Cell 2', voltage: 3.83, temperature: 25.2, resistance: 0.0025, capacity: 94, health: 97, status: 'normal', current: 15.1, power: 57.8, soc: 77 },
    { id: 'Cell 3', voltage: 3.87, temperature: 23.8, resistance: 0.0018, capacity: 96, health: 99, status: 'normal', current: 15.1, power: 58.4, soc: 79 },
  ]);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    timestamp: new Date().toLocaleTimeString(),
    packVoltage: 11.55,
    packCurrent: 45.2,
    packPower: 522,
    packTemp: 24.5,
    packSOC: 78,
    packHealth: 98,
    cellImbalance: 0.04,
    efficiency: 94.2,
    energyIn: 125.8,
    energyOut: 98.4,
    regenEnergy: 12.6,
    cycleCount: 574,
    chargeCycles: 287,
    dischargeCycles: 287,
  });

  const [historicalData, setHistoricalData] = useState<TelemetryData[]>([]);
  const [isCharging, setIsCharging] = useState(false);
  const [bmsStatus, setBmsStatus] = useState('ACTIVE');
  const [faultCodes, setFaultCodes] = useState<string[]>([]);

  // Fetch real-time data from BMS API
  useEffect(() => {
    if (!isVisible) return;

    const fetchBMSData = async () => {
      try {
        const response = await bmsApi.getVehicleDetail('EV-001');
        const bmsData = response.vehicle.bmsData;
        
        if (!bmsData) return;

        const currentTime = new Date().toLocaleTimeString();
        const voltages = bmsData.voltages || [0, 0, 0];
        const temperatures = bmsData.temperatures || [0, 0, 0];
        const current = bmsData.current || 0;
        const packVoltage = bmsData.packVoltage || voltages.reduce((a, b) => a + b, 0);
        const packSOC = bmsData.soc || 0;
        const packHealth = bmsData.soh || 100;
        
        // Update cells with real data
        setCells(voltages.map((voltage, index) => {
          const temp = temperatures[index] || 0;
          const cellCurrent = current / 3;
          const cellPower = Math.abs(cellCurrent * voltage);
          const cellHealth = packHealth - (Math.random() * 2); // Slight variation per cell
          
          return {
            id: `Cell ${index + 1}`,
            voltage: voltage,
            temperature: temp,
            resistance: 0.002 + (Math.random() * 0.001),
            capacity: 95 + (Math.random() * 5),
            health: cellHealth,
            status: cellHealth < 96 ? 'warning' : cellHealth < 94 ? 'critical' : 'normal',
            current: cellCurrent,
            power: cellPower,
            soc: packSOC + (Math.random() * 4 - 2) // Slight variation per cell
          };
        }));

        // Determine charging state
        const charging = bmsData.charging || current < 0;
        const discharging = bmsData.discharging || current > 0;
        setIsCharging(charging);

        // Determine BMS status
        if (bmsData.fault) {
          setBmsStatus('FAULT');
        } else if (charging) {
          setBmsStatus('CHARGING');
        } else if (discharging) {
          setBmsStatus('DISCHARGING');
        } else {
          setBmsStatus('ACTIVE');
        }

        // Update fault codes
        if (bmsData.fault && bmsData.faultReason) {
          setFaultCodes(prev => {
            const newFaults = [...prev, bmsData.faultReason];
            return newFaults.slice(-3); // Keep last 3 faults
          });
        }

        // Calculate cell imbalance
        const maxVoltage = Math.max(...voltages);
        const minVoltage = Math.min(...voltages);
        const cellImbalance = maxVoltage - minVoltage;

        // Update telemetry with real data
        const newTelemetry: TelemetryData = {
          timestamp: currentTime,
          packVoltage: packVoltage,
          packCurrent: current,
          packPower: Math.abs(current * packVoltage),
          packTemp: bmsData.avgTemp || temperatures.reduce((a, b) => a + b, 0) / 3,
          packSOC: packSOC,
          packHealth: packHealth,
          cellImbalance: cellImbalance,
          efficiency: 92 + Math.random() * 4,
          energyIn: telemetry.energyIn + (charging ? Math.abs(current * packVoltage / 1000) * (3/3600) : 0),
          energyOut: telemetry.energyOut + (discharging ? Math.abs(current * packVoltage / 1000) * (3/3600) : 0),
          regenEnergy: telemetry.regenEnergy + (current < 0 ? Math.abs(current * packVoltage / 1000) * (3/3600) : 0),
          cycleCount: telemetry.cycleCount,
          chargeCycles: telemetry.chargeCycles + (charging ? 0.001 : 0),
          dischargeCycles: telemetry.dischargeCycles + (discharging ? 0.001 : 0),
        };

        setTelemetry(newTelemetry);
        setHistoricalData(prev => [...prev.slice(-19), newTelemetry]);

      } catch (error) {
        console.error('Failed to fetch BMS data:', error);
      }
    };

    // Fetch immediately
    fetchBMSData();

    // Then fetch every 3 seconds
    const interval = setInterval(fetchBMSData, 3000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const getCellColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 98) return 'text-green-600';
    if (health >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100';
      case 'CHARGING': return 'text-blue-600 bg-blue-100';
      case 'DISCHARGING': return 'text-orange-600 bg-orange-100';
      case 'BALANCING': return 'text-purple-600 bg-purple-100';
      case 'FAULT': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Live Status */}
      <div className="rounded-lg border bg-card p-6 card-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Battery className="h-6 w-6 text-green-600" />
            <h3 className="font-semibold text-xl">3S Battery Pack Digital Twin - Tata Nexon EV #01</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-600 font-medium">LIVE</span>
              <Wifi className="h-4 w-4 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{telemetry.timestamp}</span>
          </div>
        </div>

        {/* BMS Status and Faults */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-600" />
              <span className="font-medium">BMS Status</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bmsStatus)}`}>
              {bmsStatus}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium">Protection</span>
            </div>
            <span className="text-sm text-green-600">ACTIVE</span>
          </div>
        </div>

        {faultCodes.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">Active Fault Codes</span>
            </div>
            <div className="space-y-1">
              {faultCodes.map((fault, index) => (
                <div key={index} className="text-sm text-red-700">• {fault}</div>
              ))}
            </div>
          </div>
        )}

        {/* 2D Battery Pack Visualization */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Battery Container - Realistic 2D Representation */}
            <div className="relative">
              {/* Main Battery Pack */}
              <div className="w-96 h-48 border-4 border-gray-800 rounded-xl relative bg-gradient-to-b from-gray-200 to-gray-300 shadow-2xl">
                {/* Battery Label */}
                <div className="absolute top-2 left-2 text-xs font-bold text-gray-700">3S2P 11.1V 45Ah</div>
                <div className="absolute top-2 right-2 text-xs text-gray-600">LFP</div>
                
                {/* Cell Modules */}
                <div className="absolute inset-4 flex gap-2 p-2">
                  {cells.map((cell, index) => (
                    <div key={cell.id} className="flex-1 relative">
                      {/* Individual Cell */}
                      <div className={`h-full ${getCellColor(cell.status)} rounded-lg flex flex-col items-center justify-center text-white font-bold shadow-inner relative`}>
                        {/* Cell Label */}
                        <div className="absolute top-1 left-1 text-xs bg-black bg-opacity-30 px-1 rounded">
                          {index + 1}
                        </div>
                        
                        {/* Voltage Display */}
                        <div className="text-sm font-bold">{cell.voltage.toFixed(2)}V</div>
                        
                        {/* Temperature */}
                        <div className="text-xs">{cell.temperature.toFixed(1)}°C</div>
                        
                        {/* Current Flow Indicator */}
                        <div className="absolute bottom-1 left-1 right-1 flex justify-between">
                          <div className={`w-1 h-1 rounded-full ${isCharging ? 'bg-blue-300' : 'bg-orange-300'} animate-pulse`} />
                          <div className={`w-1 h-1 rounded-full ${isCharging ? 'bg-blue-300' : 'bg-orange-300'} animate-pulse`} />
                        </div>
                      </div>
                      
                      {/* Health Badge */}
                      <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full ${getCellColor(cell.status)} border-2 border-white flex items-center justify-center shadow-lg`}>
                        <span className="text-xs text-white font-bold">{Math.round(cell.health)}</span>
                      </div>
                      
                      {/* SOC Bar */}
                      <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gray-600 rounded-full">
                        <div 
                          className={`h-full rounded-full ${cell.soc > 80 ? 'bg-green-400' : cell.soc > 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${cell.soc}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Battery Terminals */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                  <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-gray-800"></div>
                  <div className="w-4 h-4 bg-black rounded-full border-2 border-gray-800"></div>
                </div>
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                  <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-gray-800"></div>
                  <div className="w-4 h-4 bg-black rounded-full border-2 border-gray-800"></div>
                </div>
                
                {/* Ventilation Grilles */}
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 space-y-1">
                  <div className="w-1 h-2 bg-gray-600 rounded"></div>
                  <div className="w-1 h-2 bg-gray-600 rounded"></div>
                  <div className="w-1 h-2 bg-gray-600 rounded"></div>
                </div>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 space-y-1">
                  <div className="w-1 h-2 bg-gray-600 rounded"></div>
                  <div className="w-1 h-2 bg-gray-600 rounded"></div>
                  <div className="w-1 h-2 bg-gray-600 rounded"></div>
                </div>
              </div>
              
              {/* Current Flow Animation */}
              {isCharging && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-blue-500 animate-pulse" />
                    <span className="text-xs text-blue-600 font-medium">CHARGING</span>
                    <Zap className="h-4 w-4 text-blue-500 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comprehensive Telemetry Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pack Metrics */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wider">Pack Metrics</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xl font-bold text-blue-600">{telemetry.packVoltage.toFixed(2)}V</div>
                <div className="text-xs text-blue-700">Pack Voltage</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xl font-bold text-green-600">{telemetry.packSOC.toFixed(1)}%</div>
                <div className="text-xs text-green-700">State of Charge</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-xl font-bold text-orange-600">{telemetry.packCurrent.toFixed(1)}A</div>
                <div className="text-xs text-orange-700">{isCharging ? 'Charging' : 'Discharging'}</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-xl font-bold text-purple-600">{telemetry.packPower.toFixed(0)}W</div>
                <div className="text-xs text-purple-700">Power</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-xl font-bold text-red-600">{telemetry.packTemp.toFixed(1)}°C</div>
                <div className="text-xs text-red-700">Pack Temp</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-xl font-bold text-yellow-600">{telemetry.packHealth.toFixed(1)}%</div>
                <div className="text-xs text-yellow-700">Pack Health</div>
              </div>
            </div>
          </div>

          {/* Energy & Efficiency */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wider">Energy & Efficiency</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Energy In</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{telemetry.energyIn.toFixed(2)} kWh</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Energy Out</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{telemetry.energyOut.toFixed(2)} kWh</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Regen Energy</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{telemetry.regenEnergy.toFixed(2)} kWh</div>
                  <div className="text-xs text-gray-500">Recovered</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Efficiency</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{telemetry.efficiency.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">Round-trip</div>
                </div>
              </div>
            </div>
          </div>

          {/* Cycle Life */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wider">Cycle Life</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Total Cycles</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{telemetry.cycleCount}</div>
                  <div className="text-xs text-gray-500">Count</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Charge Cycles</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{telemetry.chargeCycles}</div>
                  <div className="text-xs text-gray-500">Count</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Discharge Cycles</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{telemetry.dischargeCycles}</div>
                  <div className="text-xs text-gray-500">Count</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Cell Analysis */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wider">Cell Analysis</h4>
          <div className="space-y-2">
            {cells.map((cell, index) => (
              <div key={cell.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full ${getCellColor(cell.status)}`} />
                  <div>
                    <div className="font-medium">{cell.id}</div>
                    <div className="text-xs text-gray-500">Health: {cell.health.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="flex items-center gap-8 text-sm">
                  <div className="text-center">
                    <div className="font-bold">{cell.voltage.toFixed(3)}V</div>
                    <div className="text-xs text-gray-500">Voltage</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{cell.temperature.toFixed(1)}°C</div>
                    <div className="text-xs text-gray-500">Temp</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{(cell.resistance * 1000).toFixed(2)}mΩ</div>
                    <div className="text-xs text-gray-500">Resistance</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{cell.current.toFixed(1)}A</div>
                    <div className="text-xs text-gray-500">Current</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{cell.power.toFixed(1)}W</div>
                    <div className="text-xs text-gray-500">Power</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{cell.soc.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">SOC</div>
                  </div>
                  <div className="text-center">
                    <div className={`font-bold ${getHealthColor(cell.health)}`}>
                      {cell.status === 'normal' ? 'OK' : cell.status === 'warning' ? 'WARN' : 'CRIT'}
                    </div>
                    <div className="text-xs text-gray-500">Status</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pack Health Summary */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gauge className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Pack Health</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {telemetry.packHealth.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Overall Health</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-orange-600" />
                <span className="font-semibold">Cell Imbalance</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {telemetry.cellImbalance.toFixed(3)}V
              </div>
              <div className="text-xs text-gray-600">Max-Min Difference</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Power className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Efficiency</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {telemetry.efficiency.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Round-trip Efficiency</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Battery3SDigitalTwin;
