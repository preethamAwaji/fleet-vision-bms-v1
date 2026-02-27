import { useState } from 'react';
import { KpiCard } from '@/components/KpiCard';
import { StatusBadge } from '@/components/StatusBadge';
import { mockVehicles, mockAlerts, fleetPerformanceData, telemetryData } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { Car, Battery, Zap, AlertTriangle, TrendingUp, Activity, ArrowRight, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import EVMap from '@/components/EVMap';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeVehicles = mockVehicles.filter((v) => v.status === 'active').length;
  const chargingVehicles = mockVehicles.filter((v) => v.status === 'charging').length;
  const criticalAlerts = mockAlerts.filter((a) => a.type === 'critical').length;
  const avgBattery = Math.round(mockVehicles.reduce((a, v) => a + v.batteryLevel, 0) / mockVehicles.length);

  // Enhanced vehicle data with additional parameters
  const enhancedVehicles = mockVehicles.map(vehicle => ({
    ...vehicle,
    speed: Math.floor(Math.random() * 60 + 20),
    temperature: Math.floor(Math.random() * 15 + 20),
    power: Math.floor(Math.random() * 80 + 10),
    voltage: Math.floor(Math.random() * 100 + 350),
  }));

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const handleVehicleClick = (vehicle: any) => {
    console.log('Vehicle clicked:', vehicle);
    setSelectedVehicle(vehicle);
  };

  // Role-specific quick actions
  const getQuickActions = () => {
    switch (user?.role) {
      case 'fleet_operator':
        return [
          { label: 'View Critical Alerts', path: '/alerts', count: criticalAlerts, urgent: criticalAlerts > 0 },
          { label: 'Check Vehicle Status', path: '/vehicles', count: activeVehicles },
          { label: 'Battery Analytics', path: '/analytics', count: null },
          { label: 'Generate Reports', path: '/reports', count: null },
        ];
      case 'maintenance_engineer':
        return [
          { label: 'Open Maintenance Alerts', path: '/alerts', count: criticalAlerts, urgent: criticalAlerts > 0 },
          { label: 'View Diagnostics', path: '/telemetry', count: null },
          { label: 'Maintenance Log', path: '/maintenance', count: null },
          { label: 'Update Vehicle Status', path: '/vehicles', count: null },
        ];
      case 'admin':
        return [
          { label: 'Manage Users', path: '/admin', count: null },
          { label: 'Fleet Configuration', path: '/vehicles', count: mockVehicles.length },
          { label: 'Charging Stations', path: '/charging', count: null },
          { label: 'System Analytics', path: '/analytics', count: null },
        ];
      default:
        return [];
    }
  };

  const quickActions = getQuickActions();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          Real-time overview
        </Badge>
      </div>

      {/* Role-specific Quick Actions */}
      <div className="rounded-lg border bg-card p-6 card-shadow">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:border-primary/40 hover:bg-muted/30 ${
                action.urgent ? 'border-destructive/30 bg-destructive/5' : 'border-border'
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{action.label}</span>
                {action.count !== null && (
                  <span className={`text-xs ${action.urgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {action.count} {action.urgent ? 'urgent' : 'items'}
                  </span>
                )}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Car} title="Active Vehicles" value={`${activeVehicles}/${mockVehicles.length}`} change="+2 from yesterday" changeType="positive" />
        <KpiCard icon={Battery} title="Avg Battery Level" value={`${avgBattery}%`} change="-3% from last week" changeType="negative" iconColor="bg-info/10 text-info" />
        <KpiCard icon={Zap} title="Charging Now" value={chargingVehicles} change="2 stations available" changeType="neutral" iconColor="bg-warning/10 text-warning" />
        <KpiCard icon={AlertTriangle} title="Critical Alerts" value={criticalAlerts} change="Requires attention" changeType="negative" iconColor="bg-destructive/10 text-destructive" />
      </div>

      {/* Full width map */}
      <div className="rounded-lg border bg-card p-6 card-shadow">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">EV Fleet Map - Karnataka Region</h3>
            <p className="text-sm text-muted-foreground">Real-time vehicle locations across Hubli, Dharwad, Gokarna & Gopankoppa</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs text-muted-foreground">Charging</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Idle</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-muted-foreground">Maintenance</span>
            </div>
          </div>
        </div>
        <div className="h-[500px] rounded-lg overflow-hidden border">
          <EVMap vehicles={enhancedVehicles} onVehicleClick={handleVehicleClick} />
        </div>
      </div>

      {/* Fleet energy and status summary row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Fleet energy */}
        <div className="rounded-lg border bg-card p-6 card-shadow">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Fleet Energy Consumption</h3>
              <p className="text-sm text-muted-foreground">24-hour overview</p>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={telemetryData}>
              <defs>
                <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142,71%,45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142,71%,45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(214,32%,91%)' }} />
              <Area type="monotone" dataKey="power" stroke="hsl(142,71%,45%)" fill="url(#energyGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle status summary */}
        <div className="rounded-lg border bg-card p-6 card-shadow">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Fleet Status Summary</h3>
              <p className="text-sm text-muted-foreground">Live vehicle status</p>
            </div>
            <Car className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="text-2xl font-bold text-green-700">{activeVehicles}</div>
              <div className="text-sm text-green-600">Active</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{chargingVehicles}</div>
              <div className="text-sm text-yellow-600">Charging</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">
                {mockVehicles.filter(v => v.status === 'idle').length}
              </div>
              <div className="text-sm text-blue-600">Idle</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="text-2xl font-bold text-red-700">
                {mockVehicles.filter(v => v.status === 'maintenance' || v.status === 'offline').length}
              </div>
              <div className="text-sm text-red-600">Maintenance/Offline</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent alerts only */}
      <div className="rounded-lg border bg-card card-shadow">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Recent Alerts</h3>
          <button onClick={() => navigate('/alerts')} className="text-sm text-primary hover:underline">View all</button>
        </div>
        <div className="divide-y">
          {mockAlerts.slice(0, 6).map((a) => (
            <div key={a.id} className="p-4">
              <div className="flex items-start gap-2">
                <StatusBadge status={a.type} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.vehicleName}</p>
                  <p className="text-xs text-muted-foreground">{a.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
