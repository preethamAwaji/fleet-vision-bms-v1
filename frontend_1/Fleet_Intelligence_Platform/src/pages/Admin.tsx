import { useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { Users, Shield, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const mockUsers = [
  { id: '1', name: 'Admin User', email: 'admin@evolve.3x.com', role: 'Fleet Operator', status: 'active', lastLogin: '2 min ago' },
  { id: '2', name: 'Maintenance User', email: 'maintenance@evolve.3x.com', role: 'Maintenance Engineer', status: 'active', lastLogin: '1 hr ago' },
  { id: '3', name: 'Admin User', email: 'admin@evolve.3x.com', role: 'Admin', status: 'active', lastLogin: '5 min ago' },
  { id: '4', name: 'Maintenance User', email: 'maintenance@evolve.3x.com', role: 'Maintenance Engineer', status: 'active', lastLogin: '3 hrs ago' },
  { id: '5', name: 'Fleet User', email: 'fleet@evolve.3x.com', role: 'Fleet Operator', status: 'idle', lastLogin: '2 days ago' },
];

const systemLogs = [
  { time: '14:32:01', event: 'User login', user: 'Admin User', level: 'info' },
  { time: '14:28:15', event: 'Vehicle EV-004 entered maintenance mode', user: 'System', level: 'warning' },
  { time: '14:15:42', event: 'Alert acknowledged: ALT-003', user: 'Maintenance User', level: 'info' },
  { time: '13:55:00', event: 'Charging station CS-005 went offline', user: 'System', level: 'critical' },
  { time: '13:42:11', event: 'Report generated: Fleet Performance Summary', user: 'Admin User', level: 'info' },
  { time: '13:30:00', event: 'OTA update deployed to EV-003', user: 'System', level: 'info' },
];

const Admin = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <p className="text-muted-foreground">Manage users, fleet configuration, and system settings</p>
    </div>

    <Tabs defaultValue="users" className="space-y-4">
      <TabsList>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="logs">System Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{mockUsers.length} users</p>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-default">
            <Plus className="h-4 w-4" /> Add User
          </button>
        </div>
        <div className="rounded-lg border bg-card card-shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Role</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Last Login</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-default">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {u.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      {u.role}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{u.lastLogin}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="rounded-md p-1.5 hover:bg-muted transition-default text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>

      <TabsContent value="logs" className="space-y-4">
        <div className="rounded-lg border bg-card card-shadow overflow-hidden">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground font-sans">Time</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground font-sans">Event</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground font-sans hidden md:table-cell">User</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground font-sans">Level</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {systemLogs.map((log, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-default">
                  <td className="px-4 py-3 text-muted-foreground">{log.time}</td>
                  <td className="px-4 py-3">{log.event}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{log.user}</td>
                  <td className="px-4 py-3"><StatusBadge status={log.level} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  </div>
);

export default Admin;
