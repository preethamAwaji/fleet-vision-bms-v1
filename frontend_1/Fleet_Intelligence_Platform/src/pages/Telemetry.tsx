import { telemetryData, mockVehicles } from '@/data/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useState, useEffect } from 'react';
import { Activity, Battery, Thermometer, Gauge, Download } from 'lucide-react';
import { bmsApi } from '@/services/bmsApi';
import { Button } from '@/components/ui/button';

const Telemetry = () => {
  const [vehicleId, setVehicleId] = useState('EV-001');
  const [vehicle, setVehicle] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('1'); // hours

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await bmsApi.getVehicleDetail(vehicleId);
        setVehicle(response.vehicle);
      } catch (error) {
        console.error('Error fetching vehicle:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [vehicleId]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/bms/history?hours=${timeRange}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          // Format data for charts - keep only last 200 points for smooth rendering
          const maxPoints = 200;
          const dataToUse = data.data.length > maxPoints 
            ? data.data.slice(-maxPoints) 
            : data.data;
          
          const formatted = dataToUse.reverse().map((item: any, index: number) => ({
            time: new Date(item.timestamp).toLocaleTimeString(),
            batteryLevel: item.soc,
            voltage: item.packVoltage,
            current: Math.abs(item.current),
            temperature: item.avgTemp,
            power: Math.abs(item.power),
            v1: item.voltages[0],
            v2: item.voltages[1],
            v3: item.voltages[2],
            soh: item.soh
          }));
          setHistoricalData(formatted);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 3000); // Update every 3 seconds for real-time
    return () => clearInterval(interval);
  }, [timeRange]);

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/export/csv?hours=${timeRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bms_data_${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const currentData = vehicle?.bmsData || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Real-Time Telemetry</h1>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-700">LIVE</span>
            </div>
          </div>
          <p className="text-muted-foreground">Live vehicle data streams with historical curves • Updates every 3s</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 1h</SelectItem>
              <SelectItem value="6">Last 6h</SelectItem>
              <SelectItem value="24">Last 24h</SelectItem>
              <SelectItem value="168">Last 7d</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Battery, label: 'Battery SOC', value: `${currentData.soc?.toFixed(1) || 0}%`, color: 'text-primary', status: currentData.charging ? '⚡ Charging' : currentData.discharging ? '🔋 Discharging' : '💤 Idle' },
          { icon: Gauge, label: 'Pack Voltage', value: `${currentData.packVoltage?.toFixed(2) || 0}V`, color: 'text-info', status: `SOH: ${currentData.soh?.toFixed(1) || 100}%` },
          { icon: Activity, label: 'Current', value: `${currentData.current?.toFixed(2) || 0}A`, color: 'text-warning', status: `Power: ${(currentData.packVoltage * currentData.current)?.toFixed(1) || 0}W` },
          { icon: Thermometer, label: 'Avg Temp', value: `${currentData.avgTemp?.toFixed(1) || 0}°C`, color: 'text-destructive', status: currentData.fault ? '🚨 Fault' : '✓ Normal' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-4 card-shadow transition-all hover:shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.status}</p>
          </div>
        ))}
      </div>

      {/* Historical Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[
          { title: 'Battery SOC (%)', key: 'batteryLevel', color: 'hsl(217,91%,60%)' },
          { title: 'Pack Voltage (V)', key: 'voltage', color: 'hsl(142,71%,45%)' },
          { title: 'Current (A)', key: 'current', color: 'hsl(38,92%,50%)' },
          { title: 'Temperature (°C)', key: 'temperature', color: 'hsl(0,84%,60%)' },
        ].map((chart) => (
          <div key={chart.key} className="rounded-lg border bg-card p-6 card-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{chart.title}</h3>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={historicalData.length > 0 ? historicalData : telemetryData}>
                <defs>
                  <linearGradient id={`grad-${chart.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chart.color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chart.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" />
                <Tooltip contentStyle={{ borderRadius: 8 }} />
                <Area 
                  type="monotone" 
                  dataKey={chart.key} 
                  stroke={chart.color} 
                  fill={`url(#grad-${chart.key})`} 
                  strokeWidth={2}
                  animationDuration={300}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Cell Voltage Comparison */}
      <div className="rounded-lg border bg-card p-6 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">3S Cell Voltage Comparison (V)</h3>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>
        <div className="flex gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(217,91%,60%)' }} />
            <span className="text-xs">Cell 1: {currentData.voltages?.[0]?.toFixed(3) || 0}V</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(142,71%,45%)' }} />
            <span className="text-xs">Cell 2: {currentData.voltages?.[1]?.toFixed(3) || 0}V</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(38,92%,50%)' }} />
            <span className="text-xs">Cell 3: {currentData.voltages?.[2]?.toFixed(3) || 0}V</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={historicalData.length > 0 ? historicalData : telemetryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" domain={['dataMin - 0.1', 'dataMax + 0.1']} />
            <Tooltip contentStyle={{ borderRadius: 8 }} />
            <Line 
              type="monotone" 
              dataKey="v1" 
              stroke="hsl(217,91%,60%)" 
              strokeWidth={2} 
              name="Cell 1" 
              dot={false}
              animationDuration={300}
              isAnimationActive={true}
            />
            <Line 
              type="monotone" 
              dataKey="v2" 
              stroke="hsl(142,71%,45%)" 
              strokeWidth={2} 
              name="Cell 2" 
              dot={false}
              animationDuration={300}
              isAnimationActive={true}
            />
            <Line 
              type="monotone" 
              dataKey="v3" 
              stroke="hsl(38,92%,50%)" 
              strokeWidth={2} 
              name="Cell 3" 
              dot={false}
              animationDuration={300}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SOH Trend */}
      <div className="rounded-lg border bg-card p-6 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Battery State of Health (SOH) Trend (%)</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Current: {currentData.soh?.toFixed(1) || 100}%</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={historicalData.length > 0 ? historicalData : telemetryData}>
            <defs>
              <linearGradient id="grad-soh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142,71%,45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142,71%,45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(220,9%,46%)" domain={[90, 100]} />
            <Tooltip contentStyle={{ borderRadius: 8 }} />
            <Area 
              type="monotone" 
              dataKey="soh" 
              stroke="hsl(142,71%,45%)" 
              fill="url(#grad-soh)" 
              strokeWidth={2}
              animationDuration={300}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Telemetry;
