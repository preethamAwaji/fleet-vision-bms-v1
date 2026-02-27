import { cn } from '@/lib/utils';

type StatusType = 'healthy' | 'warning' | 'critical' | 'active' | 'charging' | 'idle' | 'maintenance' | 'offline' | 'available' | 'occupied' | 'pending' | 'in_progress' | 'completed' | 'info';

const statusStyles: Record<StatusType, string> = {
  healthy: 'bg-success/10 text-success',
  active: 'bg-success/10 text-success',
  available: 'bg-success/10 text-success',
  completed: 'bg-success/10 text-success',
  charging: 'bg-info/10 text-info',
  info: 'bg-info/10 text-info',
  idle: 'bg-muted text-muted-foreground',
  warning: 'bg-warning/10 text-warning',
  pending: 'bg-warning/10 text-warning',
  in_progress: 'bg-info/10 text-info',
  critical: 'bg-destructive/10 text-destructive',
  maintenance: 'bg-warning/10 text-warning',
  offline: 'bg-muted text-muted-foreground',
  occupied: 'bg-info/10 text-info',
};

const dotStyles: Record<StatusType, string> = {
  healthy: 'bg-success',
  active: 'bg-success',
  available: 'bg-success',
  completed: 'bg-success',
  charging: 'bg-info animate-pulse-green',
  info: 'bg-info',
  idle: 'bg-muted-foreground',
  warning: 'bg-warning',
  pending: 'bg-warning',
  in_progress: 'bg-info animate-pulse-green',
  critical: 'bg-destructive animate-pulse-green',
  maintenance: 'bg-warning',
  offline: 'bg-muted-foreground',
  occupied: 'bg-info',
};

export const StatusBadge = ({ status, className }: { status: string; className?: string }) => {
  const s = status as StatusType;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', statusStyles[s] || 'bg-muted text-muted-foreground', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[s] || 'bg-muted-foreground')} />
      {status.replace('_', ' ')}
    </span>
  );
};
