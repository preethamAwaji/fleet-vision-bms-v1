import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockVehicles } from '@/data/mockData';
import { StatusBadge } from '@/components/StatusBadge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, Search } from 'lucide-react';

const Vehicles = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const filtered = mockVehicles.filter((v) => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase()) || v.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <p className="text-muted-foreground">Manage and monitor your fleet vehicles</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search vehicles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="charging">Charging</SelectItem>
            <SelectItem value="idle">Idle</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vehicle</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Battery</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Range</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Driver</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Location</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((v) => (
                <tr key={v.id} onClick={() => navigate(`/vehicles/${v.id}`)} className="cursor-pointer hover:bg-muted/30 transition-default">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Car className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-default" style={{ width: `${v.batteryLevel}%` }} />
                      </div>
                      <span className="text-xs font-medium">{v.batteryLevel}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">{v.range} mi</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{v.driver}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{v.lastLocation}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Vehicles;
