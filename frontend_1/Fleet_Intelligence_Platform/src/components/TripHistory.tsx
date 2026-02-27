import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, Battery, Zap, Clock, TrendingDown } from 'lucide-react';

interface Trip {
  id: number;
  vehicleId: string;
  tripStart: string;
  tripEnd: string | null;
  startSoc: number;
  endSoc: number | null;
  energyConsumed: number | null;
  distance: number | null;
  avgSpeed: number | null;
  maxTemp: number | null;
  status: string;
}

export const TripHistory = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/trips');
        const data = await response.json();
        
        if (data.status === 'success') {
          setTrips(data.trips);
        }
      } catch (error) {
        console.error('Error fetching trips:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
    const interval = setInterval(fetchTrips, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString();
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return 'Ongoing';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return <div className="text-center py-8">Loading trip history...</div>;
  }

  return (
    <div className="rounded-lg border bg-card card-shadow">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Trip History
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Recorded discharge cycles and energy consumption
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trip ID</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>SOC Change</TableHead>
              <TableHead>Energy Used</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No trips recorded yet. Start discharging to record a trip.
                </TableCell>
              </TableRow>
            ) : (
              trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">#{trip.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {formatDateTime(trip.tripStart)}
                    </div>
                  </TableCell>
                  <TableCell>{formatDuration(trip.tripStart, trip.tripEnd)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Battery className="h-4 w-4 text-primary" />
                      <span>{trip.startSoc?.toFixed(1)}%</span>
                      <TrendingDown className="h-3 w-3 text-muted-foreground" />
                      <span>{trip.endSoc?.toFixed(1) || '—'}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-warning" />
                      {trip.energyConsumed ? `${trip.energyConsumed.toFixed(2)} kWh` : '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={trip.status === 'active' ? 'default' : 'secondary'}>
                      {trip.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
