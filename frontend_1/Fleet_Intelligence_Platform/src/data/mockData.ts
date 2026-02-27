export type UserRole = 'fleet_operator' | 'maintenance_engineer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  vin: string;
  model: string;
  status: 'active' | 'charging' | 'idle' | 'maintenance' | 'offline';
  batteryLevel: number;
  batterySoH: number;
  range: number;
  mileage: number;
  lastLocation: string;
  driver: string;
  lastUpdated: string;
  lat: number;
  lng: number;
}

export interface Alert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignee: string;
  date: string;
  cost?: number;
}

export interface ChargingStation {
  id: string;
  name: string;
  location: string;
  status: 'available' | 'occupied' | 'offline' | 'maintenance';
  power: number;
  connectorType: string;
  currentVehicle?: string;
  utilization: number;
}

export const mockUser: User = {
  id: '1',
  name: 'fleetoperator.xyz',
  email: 'admin@evolve.3x.com',
  role: 'fleet_operator',
};

export const mockVehicles: Vehicle[] = [
  { id: 'EV-001', name: 'Tata Nexon EV #01', vin: '5YJ3E1EA1MF000001', model: 'Tata Nexon EV', status: 'active', batteryLevel: 78, batterySoH: 96, range: 245, mileage: 34521, lastLocation: 'Hubli Vidyanagar', driver: 'Raj Kumar', lastUpdated: '2 min ago', lat: 15.3647, lng: 75.1240 },
  { id: 'EV-002', name: 'MG ZS EV #02', vin: 'LGXCE6CB1P0000002', model: 'MG ZS EV', status: 'charging', batteryLevel: 42, batterySoH: 94, range: 132, mileage: 28750, lastLocation: 'Dharwad - KSRTC Bus Stand', driver: 'Anjali Nair', lastUpdated: '5 min ago', lat: 15.4589, lng: 75.0078 },
  { id: 'EV-003', name: 'Mahindra XUV400 #03', vin: '7FCTGAAL3NN000003', model: 'Mahindra XUV400', status: 'idle', batteryLevel: 91, batterySoH: 98, range: 295, mileage: 12300, lastLocation: 'Gokarna Beach', driver: 'Unassigned', lastUpdated: '15 min ago', lat: 14.5434, lng: 74.3219 },
  { id: 'EV-004', name: 'Tata Tigor EV #04', vin: '1N4AZ1CP7MC000004', model: 'Tata Tigor EV', status: 'maintenance', batteryLevel: 55, batterySoH: 82, range: 110, mileage: 67890, lastLocation: 'Gopankoppa Market', driver: 'Amit Singh', lastUpdated: '1 hr ago', lat: 15.4629, lng: 75.0565 },
  { id: 'EV-005', name: 'Hyundai Kona Electric #05', vin: '1FTFW1E57NF000005', model: 'Hyundai Kona Electric', status: 'active', batteryLevel: 63, batterySoH: 95, range: 190, mileage: 21450, lastLocation: 'Hubli - Railway Station', driver: 'Kavita Reddy', lastUpdated: '1 min ago', lat: 15.3519, lng: 75.1297 },
  { id: 'EV-006', name: 'Ather 450X #06', vin: '1G1FY6S0XP4000006', model: 'Ather 450X', status: 'offline', batteryLevel: 12, batterySoH: 88, range: 30, mileage: 45200, lastLocation: 'Dharwad - College Area', driver: 'Unassigned', lastUpdated: '3 hrs ago', lat: 15.4667, lng: 74.9833 },
  { id: 'EV-007', name: 'Ola S1 Pro #07', vin: 'KM8KRDAF8NU000007', model: 'Ola S1 Pro', status: 'active', batteryLevel: 85, batterySoH: 97, range: 270, mileage: 18900, lastLocation: 'Hubli - Unkal Lake', driver: 'Vikram Mehta', lastUpdated: '30 sec ago', lat: 15.3996, lng: 75.0995 },
  { id: 'EV-008', name: 'TVS iQube #08', vin: 'WVWZZZE1ZMP000008', model: 'TVS iQube Electric', status: 'charging', batteryLevel: 28, batterySoH: 93, range: 75, mileage: 31200, lastLocation: 'Gokarna - Main Road', driver: 'Deepa Joshi', lastUpdated: '8 min ago', lat: 14.5455, lng: 74.3189 },
];

export const mockAlerts: Alert[] = [
  { id: 'ALT-001', vehicleId: 'EV-004', vehicleName: 'Tata Tigor EV #04', type: 'critical', title: 'Battery Cell Degradation', message: 'Cell module 3 showing abnormal voltage drop. Immediate inspection recommended.', timestamp: '10 min ago', acknowledged: false },
  { id: 'ALT-002', vehicleId: 'EV-006', vehicleName: 'Ather 450X #06', type: 'critical', title: 'Vehicle Offline', message: 'No telemetry data received for over 3 hours. Check connectivity.', timestamp: '3 hrs ago', acknowledged: false },
  { id: 'ALT-003', vehicleId: 'EV-002', vehicleName: 'MG ZS EV #02', type: 'warning', title: 'Low Battery Level', message: 'Battery at 42%. Vehicle currently charging at Dharwad KSRTC Bus Stand.', timestamp: '5 min ago', acknowledged: true },
  { id: 'ALT-004', vehicleId: 'EV-001', vehicleName: 'Tata Nexon EV #01', type: 'warning', title: 'Tire Pressure Low', message: 'Rear left tire pressure 28 PSI (recommended: 36 PSI).', timestamp: '45 min ago', acknowledged: false },
  { id: 'ALT-005', vehicleId: 'EV-005', vehicleName: 'Hyundai Kona Electric #05', type: 'info', title: 'Scheduled Maintenance Due', message: 'Routine maintenance due in 500 miles.', timestamp: '2 hrs ago', acknowledged: true },
  { id: 'ALT-006', vehicleId: 'EV-008', vehicleName: 'TVS iQube #08', type: 'info', title: 'Charging Complete Soon', message: 'Estimated full charge in 45 minutes at Gokarna Main Road.', timestamp: '8 min ago', acknowledged: true },
];

export const mockMaintenanceLogs: MaintenanceLog[] = [
  { id: 'MNT-001', vehicleId: 'EV-004', vehicleName: 'Tata Tigor EV #04', type: 'Battery Service', description: 'Cell module inspection and replacement', status: 'in_progress', assignee: 'Rahul Verma', date: '2026-02-22', cost: 2400 },
  { id: 'MNT-002', vehicleId: 'EV-001', vehicleName: 'Tata Nexon EV #01', type: 'Tire Replacement', description: 'Replace all four tires with EV-rated tires', status: 'pending', assignee: 'Unassigned', date: '2026-02-24' },
  { id: 'MNT-003', vehicleId: 'EV-006', vehicleName: 'Ather 450X #06', type: 'Diagnostic Check', description: 'Full diagnostic scan for connectivity issues', status: 'pending', assignee: 'Rahul Verma', date: '2026-02-23' },
  { id: 'MNT-004', vehicleId: 'EV-003', vehicleName: 'Mahindra XUV400 #03', type: 'Software Update', description: 'OTA firmware update v4.2.1', status: 'completed', assignee: 'System', date: '2026-02-20', cost: 0 },
  { id: 'MNT-005', vehicleId: 'EV-007', vehicleName: 'Ola S1 Pro #07', type: 'Brake Inspection', description: 'Regenerative braking system calibration', status: 'completed', assignee: 'Sneha Patel', date: '2026-02-18', cost: 350 },
];

export const mockChargingStations: ChargingStation[] = [
  { id: 'CS-001', name: 'Hubli Gandhi Circle', location: 'Hubli - Gandhi Circle', status: 'occupied', power: 150, connectorType: 'CCS', currentVehicle: 'EV-002', utilization: 87 },
  { id: 'CS-002', name: 'Dharwad KSRTC', location: 'Dharwad - KSRTC Bus Stand', status: 'occupied', power: 50, connectorType: 'Type 2', currentVehicle: 'EV-008', utilization: 72 },
  { id: 'CS-003', name: 'Gokarna Beach', location: 'Gokarna Beach', status: 'available', power: 350, connectorType: 'CCS', utilization: 45 },
  { id: 'CS-004', name: 'Hubli Railway', location: 'Hubli - Railway Station', status: 'available', power: 150, connectorType: 'CCS', utilization: 63 },
  { id: 'CS-005', name: 'Gopankoppa Market', location: 'Gopankoppa Market', status: 'offline', power: 50, connectorType: 'CHAdeMO', utilization: 0 },
  { id: 'CS-006', name: 'Dharwad College', location: 'Dharwad - College Area', status: 'maintenance', power: 150, connectorType: 'CCS', utilization: 0 },
];

export const telemetryData = [
  { time: '00:00', speed: 0, batteryLevel: 85, power: 0, temperature: 22, voltage: 3.85 },
  { time: '01:00', speed: 0, batteryLevel: 85, power: 0, temperature: 21, voltage: 3.84 },
  { time: '02:00', speed: 0, batteryLevel: 85, power: 0, temperature: 20, voltage: 3.83 },
  { time: '03:00', speed: 0, batteryLevel: 85, power: 0, temperature: 20, voltage: 3.82 },
  { time: '04:00', speed: 0, batteryLevel: 85, power: 0, temperature: 19, voltage: 3.81 },
  { time: '05:00', speed: 15, batteryLevel: 84, power: 12, temperature: 20, voltage: 3.80 },
  { time: '06:00', speed: 35, batteryLevel: 82, power: 28, temperature: 22, voltage: 3.78 },
  { time: '07:00', speed: 45, batteryLevel: 78, power: 42, temperature: 24, voltage: 3.76 },
  { time: '08:00', speed: 52, batteryLevel: 73, power: 58, temperature: 26, voltage: 3.75 },
  { time: '09:00', speed: 58, batteryLevel: 68, power: 72, temperature: 28, voltage: 3.73 },
  { time: '10:00', speed: 45, batteryLevel: 62, power: 65, temperature: 30, voltage: 3.71 },
  { time: '11:00', speed: 38, batteryLevel: 57, power: 52, temperature: 32, voltage: 3.70 },
  { time: '12:00', speed: 25, batteryLevel: 52, power: 35, temperature: 33, voltage: 3.68 },
  { time: '13:00', speed: 0, batteryLevel: 50, power: -25, temperature: 31, voltage: 3.90 },
  { time: '14:00', speed: 0, batteryLevel: 55, power: -28, temperature: 29, voltage: 3.92 },
  { time: '15:00', speed: 42, batteryLevel: 48, power: 48, temperature: 27, voltage: 3.66 },
  { time: '16:00', speed: 55, batteryLevel: 42, power: 68, temperature: 25, voltage: 3.64 },
  { time: '17:00', speed: 48, batteryLevel: 35, power: 62, temperature: 24, voltage: 3.62 },
  { time: '18:00', speed: 35, batteryLevel: 30, power: 45, temperature: 23, voltage: 3.60 },
  { time: '19:00', speed: 20, batteryLevel: 28, power: 25, temperature: 22, voltage: 3.58 },
  { time: '20:00', speed: 15, batteryLevel: 27, power: 18, temperature: 21, voltage: 3.56 },
  { time: '21:00', speed: 8, batteryLevel: 26, power: 10, temperature: 20, voltage: 3.55 },
  { time: '22:00', speed: 0, batteryLevel: 25, power: 0, temperature: 19, voltage: 3.54 },
  { time: '23:00', speed: 0, batteryLevel: 28, power: 0, temperature: 23, voltage: 3.53 },
];

export const fleetPerformanceData = [
  { zone: 'Hubli City Center', trips: 186, distance: 2840, efficiency: 4.8, avgSpeed: 28, utilization: 92 },
  { zone: 'Dharwad Bus Stand', trips: 124, distance: 1920, efficiency: 4.2, avgSpeed: 22, utilization: 78 },
  { zone: 'Gokarna Beach Road', trips: 89, distance: 1450, efficiency: 5.1, avgSpeed: 18, utilization: 65 },
  { zone: 'Gopankoppa Market', trips: 156, distance: 2180, efficiency: 4.6, avgSpeed: 25, utilization: 88 },
  { zone: 'Hubli Industrial', trips: 67, distance: 1680, efficiency: 3.9, avgSpeed: 35, utilization: 71 },
  { zone: 'Dharwad College Area', trips: 98, distance: 1240, efficiency: 5.3, avgSpeed: 20, utilization: 82 },
];

export const batteryTrendData = [
  { month: 'Jan', soh: 98.5, cycles: 45, avgTemp: 24, avgEfficiency: 5.2 },
  { month: 'Feb', soh: 97.8, cycles: 92, avgTemp: 26, avgEfficiency: 5.1 },
  { month: 'Mar', soh: 97.2, cycles: 138, avgTemp: 28, avgEfficiency: 5.0 },
  { month: 'Apr', soh: 96.5, cycles: 185, avgTemp: 32, avgEfficiency: 4.8 },
  { month: 'May', soh: 95.8, cycles: 234, avgTemp: 35, avgEfficiency: 4.7 },
  { month: 'Jun', soh: 95.0, cycles: 282, avgTemp: 38, avgEfficiency: 4.6 },
  { month: 'Jul', soh: 94.2, cycles: 331, avgTemp: 36, avgEfficiency: 4.5 },
  { month: 'Aug', soh: 93.5, cycles: 379, avgTemp: 34, avgEfficiency: 4.6 },
  { month: 'Sep', soh: 92.8, cycles: 428, avgTemp: 30, avgEfficiency: 4.7 },
  { month: 'Oct', soh: 92.0, cycles: 476, avgTemp: 28, avgEfficiency: 4.8 },
  { month: 'Nov', soh: 91.3, cycles: 525, avgTemp: 25, avgEfficiency: 4.9 },
  { month: 'Dec', soh: 90.5, cycles: 574, avgTemp: 23, avgEfficiency: 5.0 },
];

export const energyConsumptionData = [
  { time: '00:00', consumption: 2.1, charging: 0, regen: 0.1 },
  { time: '01:00', consumption: 1.8, charging: 0, regen: 0.0 },
  { time: '02:00', consumption: 1.5, charging: 0, regen: 0.0 },
  { time: '03:00', consumption: 1.2, charging: 0, regen: 0.0 },
  { time: '04:00', consumption: 1.0, charging: 0, regen: 0.0 },
  { time: '05:00', consumption: 3.2, charging: 0, regen: 0.2 },
  { time: '06:00', consumption: 8.5, charging: 0, regen: 0.8 },
  { time: '07:00', consumption: 15.2, charging: 0, regen: 1.2 },
  { time: '08:00', consumption: 22.8, charging: 0, regen: 2.1 },
  { time: '09:00', consumption: 28.4, charging: 0, regen: 2.8 },
  { time: '10:00', consumption: 32.1, charging: 0, regen: 3.2 },
  { time: '11:00', consumption: 26.7, charging: 0, regen: 2.5 },
  { time: '12:00', consumption: 18.3, charging: 0, regen: 1.8 },
  { time: '13:00', consumption: 5.2, charging: 25.4, regen: 0.5 }, // Charging period
  { time: '14:00', consumption: 3.8, charging: 32.1, regen: 0.3 }, // Charging period
  { time: '15:00', consumption: 12.4, charging: 0, regen: 1.1 },
  { time: '16:00', consumption: 24.7, charging: 0, regen: 2.4 },
  { time: '17:00', consumption: 31.2, charging: 0, regen: 3.1 },
  { time: '18:00', consumption: 28.9, charging: 0, regen: 2.8 },
  { time: '19:00', consumption: 21.5, charging: 0, regen: 2.0 },
  { time: '20:00', consumption: 14.8, charging: 0, regen: 1.4 },
  { time: '21:00', consumption: 8.2, charging: 0, regen: 0.8 },
  { time: '22:00', consumption: 4.1, charging: 0, regen: 0.4 },
  { time: '23:00', consumption: 2.5, charging: 0, regen: 0.2 },
];

export const vehicleUtilizationData = [
  { vehicleId: 'EV-001', vehicleName: 'Tata Nexon EV #01', utilization: 94, activeHours: 18.2, idleHours: 5.8, chargingHours: 2.1 },
  { vehicleId: 'EV-002', vehicleName: 'MG ZS EV #02', utilization: 87, activeHours: 16.8, idleHours: 7.2, chargingHours: 3.4 },
  { vehicleId: 'EV-003', vehicleName: 'Mahindra XUV400 #03', utilization: 91, activeHours: 17.5, idleHours: 6.5, chargingHours: 1.8 },
  { vehicleId: 'EV-004', vehicleName: 'Tata Tigor EV #04', utilization: 76, activeHours: 14.2, idleHours: 9.8, chargingHours: 4.2 },
  { vehicleId: 'EV-005', vehicleName: 'Hyundai Kona Electric #05', utilization: 89, activeHours: 17.1, idleHours: 6.9, chargingHours: 2.8 },
  { vehicleId: 'EV-006', vehicleName: 'Ather 450X #06', utilization: 82, activeHours: 15.6, idleHours: 8.4, chargingHours: 3.6 },
  { vehicleId: 'EV-007', vehicleName: 'Ola S1 Pro #07', utilization: 85, activeHours: 16.3, idleHours: 7.7, chargingHours: 2.9 },
  { vehicleId: 'EV-008', vehicleName: 'TVS iQube #08', utilization: 79, activeHours: 15.1, idleHours: 8.9, chargingHours: 3.3 },
];
