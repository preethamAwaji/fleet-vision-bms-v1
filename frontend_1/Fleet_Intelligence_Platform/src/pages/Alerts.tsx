import { mockAlerts } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { Bell, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const Alerts = () => {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filtered = alerts.filter((a) => filter === 'all' || a.type === filter);

  const acknowledge = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alerts & Notifications</h1>
        <p className="text-muted-foreground">Monitor and manage fleet alerts</p>
      </div>

      <div className="flex gap-2">
        {(['all', 'critical', 'warning', 'info'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-default',
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {f} {f !== 'all' && `(${alerts.filter((a) => a.type === f).length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((a) => (
          <div key={a.id} className={cn('flex items-start justify-between gap-4 rounded-lg border bg-card p-4 card-shadow transition-default', !a.acknowledged && 'border-l-4', a.type === 'critical' && !a.acknowledged && 'border-l-destructive', a.type === 'warning' && !a.acknowledged && 'border-l-warning')}>
            <div className="flex items-start gap-3 min-w-0">
              <Bell className={cn('h-5 w-5 mt-0.5 shrink-0', a.type === 'critical' ? 'text-destructive' : a.type === 'warning' ? 'text-warning' : 'text-info')} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm">{a.title}</h3>
                  <StatusBadge status={a.type} />
                </div>
                <p className="text-sm text-muted-foreground">{a.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.vehicleName} · {a.timestamp}</p>
              </div>
            </div>
            {!a.acknowledged && (
              <button onClick={() => acknowledge(a.id)} className="shrink-0 flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 transition-default">
                <CheckCircle className="h-3 w-3" /> Ack
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;
