import { mockMaintenanceLogs } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { Wrench } from 'lucide-react';

const Maintenance = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">Maintenance Logs</h1>
      <p className="text-muted-foreground">Track and manage vehicle maintenance activities</p>
    </div>

    <div className="rounded-lg border bg-card card-shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vehicle</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Description</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Assignee</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mockMaintenanceLogs.map((log) => (
              <tr key={log.id} className="hover:bg-muted/30 transition-default">
                <td className="px-4 py-3 font-medium">{log.id}</td>
                <td className="px-4 py-3">{log.vehicleName}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                    {log.type}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{log.description}</td>
                <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                <td className="px-4 py-3 hidden lg:table-cell">{log.assignee}</td>
                <td className="px-4 py-3 text-muted-foreground">{log.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default Maintenance;
