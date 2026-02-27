import { mockChargingStations } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { KpiCard } from '@/components/KpiCard';
import { Zap, PlugZap, AlertTriangle, TrendingUp } from 'lucide-react';

const Charging = () => {
  const available = mockChargingStations.filter((s) => s.status === 'available').length;
  const occupied = mockChargingStations.filter((s) => s.status === 'occupied').length;
  const offline = mockChargingStations.filter((s) => s.status === 'offline' || s.status === 'maintenance').length;
  const avgUtil = Math.round(mockChargingStations.filter(s => s.utilization > 0).reduce((a, s) => a + s.utilization, 0) / mockChargingStations.filter(s => s.utilization > 0).length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Charging Infrastructure</h1>
        <p className="text-muted-foreground">Monitor and manage charging stations</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Zap} title="Available" value={available} change={`of ${mockChargingStations.length} total`} />
        <KpiCard icon={PlugZap} title="Occupied" value={occupied} iconColor="bg-info/10 text-info" />
        <KpiCard icon={AlertTriangle} title="Offline" value={offline} changeType="negative" iconColor="bg-destructive/10 text-destructive" />
        <KpiCard icon={TrendingUp} title="Avg Utilization" value={`${avgUtil}%`} change="+5% this week" changeType="positive" iconColor="bg-warning/10 text-warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockChargingStations.map((station) => (
          <div key={station.id} className="rounded-lg border bg-card p-5 card-shadow hover:card-shadow-hover transition-default">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{station.name}</h3>
              <StatusBadge status={station.status} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{station.location}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Power</span><span>{station.power} kW</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Connector</span><span>{station.connectorType}</span></div>
              {station.currentVehicle && (
                <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span className="text-info font-medium">{station.currentVehicle}</span></div>
              )}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Utilization</span>
                  <span className="font-medium">{station.utilization}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-default" style={{ width: `${station.utilization}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Charging;
