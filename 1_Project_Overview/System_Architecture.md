# System Architecture

## Fleet Vision BMS - IoT-Based Fleet Battery Management System

### Three-Layer IoT Architecture

Fleet Vision BMS follows a standard IoT architecture with three distinct layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PERCEPTION LAYER                            │
│  (Physical Devices - N-Battery Fleet + Charging Dock)          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   NETWORK & DATA LAYER                          │
│     (VSDSquadron ULTRA BMS + Cloud Database + Connectivity)     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                            │
│          (Fleet Management Dashboard + Analytics)               │
└─────────────────────────────────────────────────────────────────┘
```

## Layer 1: Perception Layer (Physical Devices)

### N-Battery Fleet [1...N]
- Multiple electric vehicles equipped with BMS units
- Each vehicle has independent monitoring capability
- Real-time data collection from battery packs
- GPS location tracking for each vehicle
- Autonomous operation with local display

### VSDSquadron ULTRA-Based BMS (Per Vehicle)
Each vehicle is equipped with a BMS unit that monitors:

#### Voltage Monitoring
- 3-cell Li-ion battery pack (11.1V nominal)
- Individual cell voltage sensing via ADS1115 ADC
- Voltage range: 3.0V - 4.2V per cell
- 16-bit resolution (±0.01V accuracy)
- Overvoltage/undervoltage detection

#### Current Monitoring
- ACS712 Hall effect current sensor
- Bidirectional measurement (±4A range)
- Charging/discharging state detection
- Overcurrent protection
- Power calculation (V × I)

#### Temperature Monitoring
- 3× LM35 temperature sensors
- One sensor per cell for thermal monitoring
- Range: 0-100°C
- Accuracy: ±0.5°C
- Overtemperature protection (>40°C)

#### Cell Balance Condition
- Voltage imbalance detection
- Threshold: >0.3V difference between cells
- Automatic balancing recommendation
- Critical for battery longevity

### Fleet Charging Dock
Centralized charging infrastructure with:
- Multiple charging slots (5+ slots)
- Intelligent slot management
- Status monitoring for each charger
- Active/Inactive charger control
- Queue management system

### Dock Controller (VSDSquadron ULTRA)
Manages the charging infrastructure:
- **Charger Active/Inactive**: Control individual chargers
- **Status of Chargers**: Monitor charging progress
- **Slot Availability**: Real-time slot status
- **Queue Management**: Optimize charging schedule

## Layer 2: Network & Data Layer (Communication)

### Internet/Cellular Connectivity
- **Bidirectional Communication**: Vehicle ↔ Cloud ↔ Dock
- **Protocol**: HTTP/HTTPS over WiFi (ESP8266)
- **Data Format**: JSON
- **Transmission Frequency**: Every 3 seconds
- **Security**: TLS/SSL encryption (production)

### VSDSquadron ULTRA Processing
Edge processing on each vehicle:
1. Sensor data acquisition (I2C, UART, GPIO)
2. GPS data parsing (NMEA sentences)
3. Fault detection (10 hardware fault types)
4. Safety logic (relay control, alarms)
5. Local display (OLED 6-page cycling)
6. Data packaging (JSON payload)
7. WiFi transmission to cloud

### Cloud Database
Centralized data storage and processing:
- **Real-time Telemetry**: Live data from all vehicles
- **Historical Data**: Time-series storage (SQLite/PostgreSQL)
- **Analytics**: Aggregated fleet statistics
- **ML Processing**: Anomaly detection and predictions
- **API Layer**: RESTful endpoints for dashboard

### Data Transmission Flow
```
Vehicle BMS (VSDSquadron ULTRA)
    ↓ (Read Sensors via I2C/UART/GPIO)
Sensor Data Collection
    ↓ (Process & Package as JSON)
ESP8266 WiFi Module
    ↓ (HTTP POST every 3 seconds)
Cloud Server (Flask Backend)
    ↓ (Store in Database)
SQLite/PostgreSQL Database
    ↓ (ML Processing)
Random Forest + XGBoost Models
    ↓ (REST API)
React Dashboard (Frontend)
    ↓ (Display to User)
Fleet Management Interface
```

## Layer 3: Application Layer (User Interface)

### Fleet Management Dashboard
Web-based control center with four main modules:

#### 1. State of Charge (SOC)
- Real-time battery levels for all vehicles
- Historical SOC trends and charts
- Charging predictions based on usage
- Range estimation per vehicle
- Low battery alerts

#### 2. State of Health (SOH)
- Battery degradation tracking over time
- Capacity fade analysis
- Cycle count monitoring
- Predictive maintenance alerts
- ML-based SOH prediction (99.8% accuracy)

#### 3. Battery Maintenance Logs
- Service history for each vehicle
- Fault records and timestamps
- Maintenance schedules and reminders
- Repair tracking and costs
- Anomaly detection logs (9 types)

#### 4. Charging Slot Availability
- Real-time dock status visualization
- Available slots count
- Queue management interface
- Booking system for drivers
- Estimated wait times

## Detailed Component Architecture

### Hardware Layer (VSDSquadron ULTRA)
```
VSDSquadron ULTRA (RISC-V)
├── I2C Bus (GPIO-20/21)
│   ├── ADS1115 #1 (0x48) → Temperature Sensors (3× LM35)
│   ├── ADS1115 #2 (0x49) → Voltage Dividers + Current Sensor
│   ├── BMP280 (0x76) → Environmental Monitoring
│   └── SSD1306 (0x3C) → OLED Display
│
├── UART1 (GPIO-16/17)
│   └── ESP8266 → WiFi Connectivity (115200 baud)
│
├── SoftwareSerial (GPIO-3/4)
│   └── NEO-6M GPS → Location Tracking (9600 baud)
│
└── GPIO
    ├── GPIO-10 → LED (Charging - Green)
    ├── GPIO-11 → LED (Discharging - Blue)
    ├── GPIO-12 → LED (Fault - Red)
    ├── GPIO-8 → Relay Module (Safety Cutoff)
    └── GPIO-13 → Buzzer (Alarm)
```

### Firmware Layer (Arduino C++)
- **Sensor Reading**: I2C communication with ADCs and sensors
- **GPS Parsing**: NMEA sentence processing (GPRMC, GPGGA)
- **Fault Detection**: 10 hardware fault types (F00-F09)
- **WiFi Communication**: HTTP POST to cloud server
- **Display Control**: 6-page OLED cycling display
- **Safety Logic**: Relay cutoff on critical faults

### Backend Layer (Flask + Python)
- **REST API**: JSON endpoints for data ingestion and retrieval
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ML Models**:
  - Random Forest anomaly detector
  - XGBoost anomaly detector
  - SOC/SOH prediction model
- **Data Processing**: Pandas, NumPy for analytics
- **Trip Tracking**: Automatic trip start/end detection

### Frontend Layer (React + TypeScript)
- **Dashboard**: Real-time fleet overview
- **Vehicle Detail**: Individual vehicle monitoring
- **Telemetry**: Historical data visualization
- **Analytics**: Fleet-wide statistics
- **Charts**: Recharts for data visualization
- **Responsive**: Mobile and desktop support

## Communication Protocols

### Vehicle BMS → Cloud
**Endpoint**: `POST /data`

**Payload**:
```json
{
  "v": [11.4, 7.6, 3.8],
  "t": [30.1, 30.5, 32.8],
  "i": -2.0,
  "env": {"temp": 25.0, "pressure": 1013.0},
  "fault": false,
  "faultCode": "F00",
  "charging": true,
  "gps": {
    "lat": "1234.5678N",
    "lon": "07890.1234E",
    "speed": "0.5",
    "fix": true
  }
}
```

**Frequency**: Every 3 seconds

### Cloud → Dashboard
**Endpoint**: `GET /api/vehicles`

**Response**:
```json
{
  "vehicles": [
    {
      "id": "EV-001",
      "batteryLevel": 80.0,
      "batterySoH": 99.8,
      "status": "charging",
      "location": {...}
    }
  ]
}
```

**Update**: Real-time polling (3-second interval)

## Scalability

### Current Capacity
- **Vehicles**: 1-100 vehicles per fleet
- **Data Rate**: 0.33 Hz per vehicle (3-second intervals)
- **Storage**: ~1 GB per vehicle per year
- **Concurrent Users**: 10-50 dashboard users

### Scaling Strategy
- **Horizontal Scaling**: Add more backend servers with load balancing
- **Database Sharding**: Partition by vehicle ID
- **Edge Computing**: Process data on vehicle BMS, send aggregated data
- **Caching**: Redis for frequently accessed data

## Security

- **Data Encryption**: TLS/SSL for all communications
- **Authentication**: API keys for devices
- **Authorization**: Role-based access control
- **Data Privacy**: GDPR compliance

## Reliability

- **Offline Mode**: Local data storage on device
- **Auto-Reconnect**: Automatic WiFi reconnection
- **Data Buffering**: Queue data during network outage
- **Fault Tolerance**: Redundant communication paths

## Conclusion

The Fleet Vision BMS architecture provides a robust, scalable, and secure solution for electric vehicle fleet management. The three-layer IoT design ensures modularity, scalability, reliability, and usability for fleet operators managing multiple EVs.
