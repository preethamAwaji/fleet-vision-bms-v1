# Data Format Description

## Overview

Fleet Vision BMS uses JSON format for data transmission between edge devices, cloud server, and dashboard. This document describes all data structures, field definitions, and validation rules.

---

## 1. BMS Data Payload (Edge → Cloud)

### Endpoint
`POST /data`

### Content-Type
`application/json`

### JSON Schema

```json
{
  "v": [float, float, float],
  "t": [float, float, float],
  "i": float,
  "env": {
    "temp": float,
    "pressure": float
  },
  "envTemp": float,
  "pressure": float,
  "fault": boolean,
  "faultReason": string,
  "faultCode": string,
  "charging": boolean,
  "discharging": boolean,
  "hwCharging": boolean,
  "chargingStatus": string,
  "loadStatus": string,
  "motorLoad": boolean,
  "gps": {
    "lat": string,
    "lon": string,
    "speed": string,
    "alt": string,
    "sats": string,
    "fix": boolean
  }
}
```

### Field Definitions

| Field | Type | Unit | Range | Description |
|-------|------|------|-------|-------------|
| `v` | array[3] | Volts | [2.5, 4.5] | Cumulative cell voltages [VB1, VB2, VB3] |
| `v[0]` | float | V | [2.5, 4.5] | Cell 1 voltage (VB1 = VPACK) |
| `v[1]` | float | V | [2.5, 4.5] | Cell 2 voltage (VB2 = VB1 - V3) |
| `v[2]` | float | V | [2.5, 4.5] | Cell 3 voltage (VB3 = VB2 - V2) |
| `t` | array[3] | °C | [-20, 100] | Cell temperatures [T1, T2, T3] |
| `t[0]` | float | °C | [-20, 100] | Cell 1 temperature |
| `t[1]` | float | °C | [-20, 100] | Cell 2 temperature |
| `t[2]` | float | °C | [-20, 100] | Cell 3 temperature |
| `i` | float | Amperes | [-5, 5] | Battery current (negative = charging) |
| `env.temp` | float | °C | [-20, 60] | Environmental temperature |
| `env.pressure` | float | hPa | [900, 1100] | Atmospheric pressure |
| `envTemp` | float | °C | [-20, 60] | Environmental temperature (duplicate) |
| `pressure` | float | hPa | [900, 1100] | Atmospheric pressure (duplicate) |
| `fault` | boolean | - | true/false | Fault detected flag |
| `faultReason` | string | - | - | Human-readable fault description |
| `faultCode` | string | - | F00-F09 | Fault code (F00 = no fault) |
| `charging` | boolean | - | true/false | Charging state (current < 0) |
| `discharging` | boolean | - | true/false | Discharging state (current > 0) |
| `hwCharging` | boolean | - | true/false | Hardware charging detection |
| `chargingStatus` | string | - | CRG/NCR | Charging status (CRG=charging, NCR=not charging) |
| `loadStatus` | string | - | NLD/MTL | Load status (NLD=no load, MTL=motor load) |
| `motorLoad` | boolean | - | true/false | Motor load active |
| `gps.lat` | string | NMEA | - | Latitude (e.g., "1234.5678N") |
| `gps.lon` | string | NMEA | - | Longitude (e.g., "07890.1234E") |
| `gps.speed` | string | knots | [0, 100] | Speed over ground |
| `gps.alt` | string | meters | [-100, 5000] | Altitude above sea level |
| `gps.sats` | string | count | [0, 12] | Number of satellites |
| `gps.fix` | boolean | - | true/false | GPS fix acquired |

### Example Payload

```json
{
  "v": [11.4, 7.6, 3.8],
  "t": [30.1, 30.5, 32.8],
  "i": -2.0,
  "env": {
    "temp": 25.0,
    "pressure": 1013.25
  },
  "envTemp": 25.0,
  "pressure": 1013.25,
  "fault": false,
  "faultReason": "",
  "faultCode": "F00",
  "charging": true,
  "discharging": false,
  "hwCharging": true,
  "chargingStatus": "CRG",
  "loadStatus": "NLD",
  "motorLoad": false,
  "gps": {
    "lat": "1234.5678N",
    "lon": "07890.1234E",
    "speed": "0.5",
    "alt": "100.0",
    "sats": "8",
    "fix": true
  }
}
```

### Validation Rules

```python
def validate_bms_data(data):
    # Voltage validation
    assert len(data['v']) == 3, "Must have 3 voltage readings"
    for v in data['v']:
        assert 2.5 <= v <= 4.5, f"Voltage {v}V out of range [2.5, 4.5]"
    
    # Temperature validation
    assert len(data['t']) == 3, "Must have 3 temperature readings"
    for t in data['t']:
        assert -20 <= t <= 100, f"Temperature {t}°C out of range [-20, 100]"
    
    # Current validation
    assert -5 <= data['i'] <= 5, f"Current {data['i']}A out of range [-5, 5]"
    
    # Fault code validation
    assert data['faultCode'] in ['F00', 'F01', 'F02', 'F03', 'F04', 
                                   'F05', 'F06', 'F07', 'F08', 'F09'], \
           f"Invalid fault code: {data['faultCode']}"
    
    # GPS validation
    if data['gps']['fix']:
        assert data['gps']['lat'] != "", "Latitude required when GPS fix"
        assert data['gps']['lon'] != "", "Longitude required when GPS fix"
    
    return True
```

---

## 2. Server Response (Cloud → Edge)

### Response Schema

```json
{
  "status": string,
  "command": string,
  "soc": float,
  "soh": float,
  "message": string
}
```

### Field Definitions

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `status` | string | success/error | Request status |
| `command` | string | IDLE/CHARGE/DISCHARGE | Command to edge device |
| `soc` | float | [0, 100] | State of Charge (%) |
| `soh` | float | [0, 100] | State of Health (%) |
| `message` | string | - | Human-readable message |

### Example Response

```json
{
  "status": "success",
  "command": "IDLE",
  "soc": 80.0,
  "soh": 99.8,
  "message": "Data received, sending: IDLE"
}
```

---

## 3. Live BMS Data (Cloud → Dashboard)

### Endpoint
`GET /api/bms/live`

### Response Schema

```json
{
  "status": string,
  "data": {
    "v1": float,
    "v2": float,
    "v3": float,
    "pack_voltage": float,
    "t1": float,
    "t2": float,
    "t3": float,
    "avg_temp": float,
    "current": float,
    "power": float,
    "soc": float,
    "soh": float,
    "safety": string,
    "fault": boolean,
    "faultCode": string,
    "charging": boolean,
    "discharging": boolean,
    "anomalies": array,
    "allPredictions": object,
    "gps": object,
    "timestamp": string
  },
  "timestamp": string
}
```

### Example Response

```json
{
  "status": "success",
  "data": {
    "v1": 3.80,
    "v2": 3.80,
    "v3": 3.80,
    "pack_voltage": 11.40,
    "t1": 30.1,
    "t2": 30.5,
    "t3": 32.8,
    "avg_temp": 31.1,
    "current": -2.0,
    "power": -22.8,
    "soc": 80.0,
    "soh": 99.8,
    "safety": "SAFE",
    "fault": false,
    "faultCode": "F00",
    "charging": true,
    "discharging": false,
    "anomalies": [],
    "allPredictions": {
      "rf": {"type": "NORMAL", "confidence": 0.95},
      "xgb": {"type": "NORMAL", "confidence": 0.97}
    },
    "gps": {
      "lat": 15.3647,
      "lon": 75.1240,
      "speed": 0.5,
      "fix": true
    },
    "timestamp": "2026-02-27T10:30:00"
  },
  "timestamp": "2026-02-27T10:30:00"
}
```

---

## 4. Historical Data (Cloud → Dashboard)

### Endpoint
`GET /api/bms/history?hours=1&limit=1000`

### Response Schema

```json
{
  "status": string,
  "data": [
    {
      "timestamp": string,
      "voltages": [float, float, float],
      "packVoltage": float,
      "temperatures": [float, float, float],
      "avgTemp": float,
      "current": float,
      "power": float,
      "soc": float,
      "soh": float,
      "safety": string,
      "fault": boolean,
      "charging": boolean,
      "discharging": boolean
    }
  ],
  "count": integer,
  "timeRange": string
}
```

---

## 5. Vehicle List (Cloud → Dashboard)

### Endpoint
`GET /api/vehicles`

### Response Schema

```json
{
  "status": string,
  "vehicles": [
    {
      "id": string,
      "name": string,
      "model": string,
      "vin": string,
      "status": string,
      "batteryLevel": float,
      "batterySoH": float,
      "range": integer,
      "mileage": integer,
      "driver": string,
      "lastLocation": string,
      "lastUpdated": string,
      "lat": float,
      "lng": float,
      "bmsData": object
    }
  ]
}
```

---

## 6. Fault Codes

### Hardware Fault Codes (F00-F09)

| Code | Name | Description | Severity |
|------|------|-------------|----------|
| **F00** | No Fault | Normal operation | NORMAL |
| **F01** | Overvoltage | Cell voltage > 4.2V | CRITICAL |
| **F02** | Undervoltage | Cell voltage < 2.8V | HIGH |
| **F03** | Overtemperature | Cell temperature > 40°C | CRITICAL |
| **F04** | Cell Imbalance | Voltage difference > 0.3V | MEDIUM |
| **F05** | Overcurrent Charge | Charging current < -4.0A | HIGH |
| **F06** | Overcurrent Discharge | Discharge current > 4.0A | HIGH |
| **F07** | Sensor Failure | Invalid ADC readings | CRITICAL |
| **F08** | Communication Error | WiFi/GPS timeout | MEDIUM |
| **F09** | System Error | Critical system fault | CRITICAL |

### ML Anomaly Types

| Type | Description | Severity |
|------|-------------|----------|
| **NORMAL** | All parameters within expected range | NORMAL |
| **CELL_IMBALANCE** | Voltage imbalance pattern detected | MEDIUM |
| **CELL_TEMP_HIGH** | Elevated cell temperature trend | HIGH |
| **OVERCHARGE_CURRENT** | Excessive charging current pattern | HIGH |
| **OVERDISCHARGE_CURRENT** | Excessive discharge current pattern | HIGH |
| **PRESSURE_HIGH** | Abnormal pressure reading trend | MEDIUM |
| **THERMAL_RUNAWAY** | Critical temperature rise pattern | CRITICAL |
| **OVERVOLTAGE** | Voltage exceeding safe limits | CRITICAL |
| **UNDERVOLTAGE** | Voltage below safe limits | CRITICAL |

---

## 7. Database Schema

### Table: bms_data

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-increment ID |
| `timestamp` | DATETIME | Data timestamp |
| `v1` | REAL | Cell 1 voltage (V) |
| `v2` | REAL | Cell 2 voltage (V) |
| `v3` | REAL | Cell 3 voltage (V) |
| `pack_voltage` | REAL | Total pack voltage (V) |
| `t1` | REAL | Cell 1 temperature (°C) |
| `t2` | REAL | Cell 2 temperature (°C) |
| `t3` | REAL | Cell 3 temperature (°C) |
| `avg_temp` | REAL | Average temperature (°C) |
| `current` | REAL | Battery current (A) |
| `power` | REAL | Power (W) |
| `soc` | REAL | State of Charge (%) |
| `soh` | REAL | State of Health (%) |
| `safety` | TEXT | Safety status |
| `fault` | INTEGER | Fault flag (0/1) |
| `fault_code` | TEXT | Fault code (F00-F09) |
| `charging` | INTEGER | Charging flag (0/1) |
| `discharging` | INTEGER | Discharging flag (0/1) |
| `gps_lat` | REAL | GPS latitude |
| `gps_lon` | REAL | GPS longitude |
| `gps_speed` | REAL | GPS speed (knots) |
| `gps_fix` | INTEGER | GPS fix flag (0/1) |

### Table: trips

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY | Auto-increment ID |
| `start_time` | DATETIME | Trip start timestamp |
| `end_time` | DATETIME | Trip end timestamp |
| `start_lat` | REAL | Start latitude |
| `start_lon` | REAL | Start longitude |
| `end_lat` | REAL | End latitude |
| `end_lon` | REAL | End longitude |
| `distance` | REAL | Trip distance (km) |
| `duration` | INTEGER | Trip duration (seconds) |
| `energy_consumed` | REAL | Energy consumed (Wh) |
| `avg_soc` | REAL | Average SOC (%) |

---

## 8. CSV Export Format

### Raw Data Sample (Raw_Data_Sample.csv)

```csv
timestamp,v1,v2,v3,pack_voltage,t1,t2,t3,avg_temp,current,power,soc,soh,fault,fault_code,charging,discharging,gps_lat,gps_lon,gps_fix
2026-02-27 10:30:00,3.80,3.80,3.80,11.40,30.1,30.5,32.8,31.1,-2.0,-22.8,80.0,99.8,0,F00,1,0,15.3647,75.1240,1
2026-02-27 10:30:03,3.81,3.81,3.81,11.43,30.2,30.6,32.9,31.2,-2.0,-22.9,80.5,99.8,0,F00,1,0,15.3648,75.1241,1
```

### Processed Data Output (Processed_Data_Output.csv)

```csv
timestamp,pack_voltage,avg_temp,current,soc,soh,safety,anomaly_type,anomaly_confidence
2026-02-27 10:30:00,11.40,31.1,-2.0,80.0,99.8,SAFE,NORMAL,0.95
2026-02-27 10:30:03,11.43,31.2,-2.0,80.5,99.8,SAFE,NORMAL,0.96
```

### Fault Test Data (Fault_Test_Data.csv)

```csv
timestamp,fault_code,fault_reason,v1,v2,v3,t1,t2,t3,current,action_taken
2026-02-27 11:00:00,F01,Overvoltage,4.25,4.20,4.18,30.0,30.0,30.0,0.0,Relay cutoff
2026-02-27 11:05:00,F03,Overtemperature,3.80,3.80,3.80,42.0,41.5,40.8,-1.0,Relay cutoff
```

---

## 9. Data Transmission Protocol

### HTTP Headers

```
POST /data HTTP/1.1
Host: 192.168.1.100:5000
Content-Type: application/json
Content-Length: 456
User-Agent: VSDSquadron-ULTRA/1.0
```

### Error Responses

```json
{
  "status": "error",
  "message": "Invalid voltage reading",
  "code": 400
}
```

---

## Conclusion

This data format specification ensures:
- **Consistency**: Standardized JSON schema
- **Validation**: Clear range and type definitions
- **Interoperability**: Compatible with multiple clients
- **Extensibility**: Easy to add new fields
- **Documentation**: Complete field descriptions

All data exchanges follow this specification for reliable communication between edge devices, cloud server, and dashboard.
