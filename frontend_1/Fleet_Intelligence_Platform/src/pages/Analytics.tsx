import { fleetPerformanceData, batteryTrendData, mockVehicles } from '@/data/mockData';
import { KpiCard } from '@/components/KpiCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Battery, Zap, Target } from 'lucide-react';

const statusData = [
  { name: 'Active', value: mockVehicles.filter((v) => v.status === 'active').length, color: 'hsl(142,71%,45%)' },
  { name: 'Charging', value: mockVehicles.filter((v) => v.status === 'charging').length, color: 'hsl(217,91%,60%)' },
  { name: 'Idle', value: mockVehicles.filter((v) => v.status === 'idle').length, color: 'hsl(220,9%,46%)' },
  { name: 'Maintenance', value: mockVehicles.filter((v) => v.status === 'maintenance').length, color: 'hsl(38,92%,50%)' },
  { name: 'Offline', value: mockVehicles.filter((v) => v.status === 'offline').length, color: 'hsl(0,84%,60%)' },
];

const Analytics = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">Predictive Analytics</h1>
      <p className="text-muted-foreground">Fleet performance insights and predictions</p>
    </div>

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard icon={TrendingUp} title="Fleet Efficiency" value="4.1 mi/kWh" change="+3.2% this month" changeType="positive" />
      <KpiCard icon={Battery} title="Avg Battery Health" value="93.2%" change="-0.4% degradation" changeType="neutral" iconColor="bg-info/10 text-info" />
      <KpiCard icon={Zap} title="Energy Cost Saved" value="$12,450" change="vs. diesel baseline" changeType="positive" iconColor="bg-warning/10 text-warning" />
      <KpiCard icon={Target} title="CO₂ Reduced" value="8.2 tons" change="This quarter" changeType="positive" iconColor="bg-success/10 text-success" />
    </div>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-lg border bg-card p-6 card-shadow">
        <h3 className="font-semibold mb-4">Zone Efficiency (mi/kWh)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={fleetPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
            <XAxis dataKey="zone" tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
            <Tooltip contentStyle={{ borderRadius: 8 }} />
            <Bar dataKey="efficiency" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border bg-card p-6 card-shadow">
        <h3 className="font-semibold mb-4">Fleet Status Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
              {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-1.5">
          {statusData.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span>{s.name}</span>
              </div>
              <span className="font-medium">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="rounded-lg border bg-card p-6 card-shadow">
      <h3 className="font-semibold mb-4">Battery Degradation Forecast</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={batteryTrendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
          <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} stroke="hsl(220,9%,46%)" />
          <Tooltip contentStyle={{ borderRadius: 8 }} />
          <Line type="monotone" dataKey="soh" stroke="hsl(217,91%,60%)" strokeWidth={2} name="SoH %" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default Analytics;
