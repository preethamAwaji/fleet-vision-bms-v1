/**
 * BMS API Service
 * Connects React frontend to Flask backend for real-time BMS data
 */

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

export interface BMSData {
  v1: number;
  v2: number;
  v3: number;
  t1: number;
  t2: number;
  t3: number;
  current: number;
  env: number;
  fault: boolean;
  mode: string;
  soc: number;
  soh: number;
  safety: string;
  timestamp?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  model: string;
  vin: string;
  status: string;
  batteryLevel: number;
  batterySoH: number;
  range: number;
  mileage: number;
  driver: string;
  lastLocation: string;
  lastUpdated: string;
  lat?: number;
  lng?: number;
  bmsData?: {
    voltages: number[];
    temperatures: number[];
    current: number;
    envTemp: number;
    fault: boolean;
    safety: string;
    soc?: number;
    soh?: number;
  };
}

export const bmsApi = {
  /**
   * Get live BMS data from hardware
   */
  getLiveData: async (): Promise<{ status: string; data: BMSData }> => {
    const response = await fetch(`${API_BASE}/bms/live`);
    if (!response.ok) {
      throw new Error('Failed to fetch BMS data');
    }
    return response.json();
  },

  /**
   * Get list of vehicles with BMS data
   */
  getVehicles: async (): Promise<{ status: string; vehicles: Vehicle[] }> => {
    const response = await fetch(`${API_BASE}/vehicles`);
    if (!response.ok) {
      throw new Error('Failed to fetch vehicles');
    }
    return response.json();
  },

  /**
   * Get detailed vehicle data
   */
  getVehicleDetail: async (id: string): Promise<{ status: string; vehicle: Vehicle }> => {
    const response = await fetch(`${API_BASE}/vehicles/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch vehicle detail');
    }
    return response.json();
  },

  /**
   * Get historical BMS data (placeholder)
   */
  getHistory: async (): Promise<{ status: string; data: any[] }> => {
    const response = await fetch(`${API_BASE}/bms/history`);
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }
    return response.json();
  },

  /**
   * Send command to BMS (for testing)
   */
  sendCommand: async (command: string): Promise<{ status: string; command: string }> => {
    const response = await fetch(`/send_command/${command}`);
    if (!response.ok) {
      throw new Error('Failed to send command');
    }
    return response.json();
  }
};

/**
 * React Query hooks for easy integration
 */
export const useBMSData = () => {
  // Use with @tanstack/react-query
  // const { data, isLoading, error } = useQuery({
  //   queryKey: ['bms-live'],
  //   queryFn: bmsApi.getLiveData,
  //   refetchInterval: 3000 // Refresh every 3 seconds
  // });
};
