import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

export const KpiCard = ({ title, value, change, changeType = 'neutral', icon: Icon, iconColor }: KpiCardProps) => (
  <div className="rounded-lg border bg-card p-6 card-shadow hover:card-shadow-hover transition-default">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className={cn('rounded-lg p-2', iconColor || 'bg-primary/10 text-primary')}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <div className="mt-3">
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {change && (
        <p className={cn('mt-1 text-xs font-medium', {
          'text-success': changeType === 'positive',
          'text-destructive': changeType === 'negative',
          'text-muted-foreground': changeType === 'neutral',
        })}>
          {change}
        </p>
      )}
    </div>
  </div>
);
