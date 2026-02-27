# Edge vs Cloud Architecture

## Overview

Fleet Vision BMS implements a hybrid edge-cloud architecture that distributes processing between the VSDSquadron ULTRA (edge device) and the cloud backend server. This approach optimizes for real-time response, bandwidth efficiency, and scalability.

---

## Architecture Distribution

```
┌─────────────────────────────────────────────────────────────┐
│                    EDGE DEVICE                              │
│              (VSDSquadron ULTRA)                            │
├─────────────────────────────────────────────────────────────┤
│ • Real-time sensor data acquisition (3s interval)          │
│ • Signal conditioning and filtering                         │
│ • Hardware fault detection (10 types)                       │
│ • Safety logic and relay control                            │
│ • Local display (OLED)                                      │
│ • Data packaging (JSON)                                     │
│ • GPS parsing                                               │
│ • Offline data buffering                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓ WiFi (HTTP POST)
                          ↓ JSON Payload (~500 bytes)
                          ↓ Every 3 seconds
┌─────────────────────────────────────────────────────────────┐
│                    CLOUD SERVER                             │
│              (Flask Backend + Database)                     │
├─────────────────────────────────────────────────────────────┤
│ • Data ingestion and validation                             │
│ • Database storage (time-series)                            │
│ • ML-based anomaly detection (9 types)                      │
│ • SOC/SOH prediction                                        │
│ • Fleet-wide analytics                                      │
│ • Trip tracking and logging                                 │
│ • Historical data aggregation                               │
│ • REST API for dashboard                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓ REST API (HTTP GET)
                          ↓ JSON Response
                          ↓ 3-second polling
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD                                │
│              (React Frontend)                               │
├─────────────────────────────────────────────────────────────┤
│ • Real-time fleet monitoring                                │
│ • Interactive charts and visualizations                     │
│ • Maintenance logs and alerts                               │
│ • Charging slot management                                  │
│ • Trip history and analytics                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Edge Processing (VSDSquadron ULTRA)

### What Runs on Edge

#### 1. Sensor Data Acquisition
**Why Edge:**
- **Real-time requirement**: Sensors must be read continuously
- **Hardware interface**: Direct I2C/UART/GPIO access
- **Low latency**: <100ms response time needed

**Implementation:**
```cpp
void readSensors() {
    // Read voltages via ADS1115 (I2C)
    v1 = readVoltage(0);
    v2 = readVoltage(1);
    v3 = readVoltage(2);
    
    // Read temperatures via ADS1115 (I2C)
    t1 = readTemperature(0);
    t2 = readTemperature(1);
    t3 = readTemperature(2);
    
    // Read current via ADS1115 (I2C)
    current = readCurrent();
    
    // Read environmental data via BMP280 (I2C)
    envTemp = bmp.readTemperature();
    pressure = bmp.readPressure() / 100.0;
    
    // Read GPS via UART
    parseGPS();
}
```

#### 2. Signal Filtering
**Why Edge:**
- **Noise reduction**: Filter before transmission saves bandwidth
- **Real-time processing**: Immediate filtering for safety decisions
- **Reduced cloud load**: Clean data reduces server processing

**Filters Applied:**
- Moving average (voltage)
- Outlier rejection (temperature)
- Median filter (current)
- Debouncing (fault detection)

#### 3. Hardware Fault Detection
**Why Edge:**
- **Safety critical**: Immediate response required (<100ms)
- **Relay control**: Must cutoff power locally
- **No network dependency**: Works offline
- **Deterministic**: Threshold-based logic is fast and reliable

**Fault Types (F00-F09):**
- Overvoltage, Undervoltage
- Overtemperature
- Cell imbalance
- Overcurrent (charge/discharge)
- Sensor/communication failures

#### 4. Local Display
**Why Edge:**
- **User feedback**: Immediate status without network
- **Debugging**: Local diagnostics
- **Offline operation**: Works without cloud connectivity

**OLED Display (6 pages):**
- Voltages, Temperatures, Current
- Environmental data, GPS, System status

#### 5. Data Packaging
**Why Edge:**
- **Bandwidth optimization**: Structured JSON reduces size
- **Protocol handling**: HTTP POST formatting
- **Error handling**: Retry logic for failed transmissions

**JSON Payload:**
```json
{
  "v": [11.4, 7.6, 3.8],
  "t": [30.1, 30.5, 32.8],
  "i": -2.0,
  "gps": {"lat": "...", "lon": "...", "fix": true},
  "fault": false,
  "faultCode": "F00"
}
```

### Edge Processing Benefits

| Benefit | Impact |
|---------|--------|
| **Low Latency** | <100ms fault detection and response |
| **Offline Operation** | Works without network connectivity |
| **Bandwidth Efficiency** | Only 165 bytes/s per vehicle |
| **Safety** | Local relay control for immediate cutoff |
| **Reliability** | No single point of failure |

### Edge Processing Limitations

| Limitation | Workaround |
|------------|------------|
| **Limited Memory** | 32KB RAM | Efficient data structures |
| **Limited CPU** | 24 MHz | Optimized algorithms |
| **No ML Models** | Too large | Cloud-based ML inference |
| **No Fleet View** | Single vehicle | Cloud aggregation |

---

## Cloud Processing (Backend Server)

### What Runs on Cloud

#### 1. ML-Based Anomaly Detection
**Why Cloud:**
- **Model size**: Random Forest + XGBoost models (~50MB)
- **Computational power**: Inference requires significant CPU
- **Model updates**: Easy to retrain and deploy new models
- **Fleet-wide patterns**: Analyze across multiple vehicles

**Models:**
- Random Forest (96.5% accuracy)
- XGBoost (97.2% accuracy)
- Ensemble voting (97.8% accuracy)

**Anomaly Types (9):**
- NORMAL, CELL_IMBALANCE, CELL_TEMP_HIGH
- OVERCHARGE_CURRENT, OVERDISCHARGE_CURRENT
- PRESSURE_HIGH, THERMAL_RUNAWAY
- OVERVOLTAGE, UNDERVOLTAGE

#### 2. SOC/SOH Prediction
**Why Cloud:**
- **Complex models**: Neural networks for SOH prediction
- **Historical data**: Requires access to past cycles
- **Calibration**: Per-vehicle calibration curves
- **Accuracy**: More sophisticated algorithms than edge

**Predictions:**
```python
soc = calculate_soc_from_voltage(pack_voltage)
soh = predict_soh(features)  # ML model
```

#### 3. Database Storage
**Why Cloud:**
- **Capacity**: Unlimited storage for historical data
- **Persistence**: Long-term data retention
- **Querying**: Complex SQL queries for analytics
- **Backup**: Automated backups and redundancy

**Database Schema:**
- `bms_data`: Time-series sensor readings
- `trips`: Trip start/end with GPS coordinates
- `faults`: Fault history log
- `vehicles`: Vehicle metadata

#### 4. Fleet-Wide Analytics
**Why Cloud:**
- **Aggregation**: Combine data from multiple vehicles
- **Comparison**: Benchmark vehicle performance
- **Trends**: Identify fleet-wide patterns
- **Reporting**: Generate fleet reports

**Analytics:**
- Average SOC/SOH across fleet
- Total energy consumed
- Fault frequency by vehicle
- Charging efficiency

#### 5. REST API
**Why Cloud:**
- **Centralized access**: Single endpoint for all clients
- **Authentication**: Secure access control
- **Rate limiting**: Prevent abuse
- **Versioning**: API version management

**Endpoints:**
- `POST /data` - Ingest BMS data
- `GET /api/vehicles` - Get fleet status
- `GET /api/bms/live` - Get live data
- `GET /api/bms/history` - Get historical data

### Cloud Processing Benefits

| Benefit | Impact |
|---------|--------|
| **Scalability** | Supports 100+ vehicles |
| **ML Capabilities** | Advanced anomaly detection |
| **Storage** | Unlimited historical data |
| **Analytics** | Fleet-wide insights |
| **Updates** | Easy model/algorithm updates |

### Cloud Processing Limitations

| Limitation | Mitigation |
|------------|------------|
| **Network Dependency** | Edge handles safety locally |
| **Latency** | ~500ms round-trip | Edge for critical decisions |
| **Cost** | Server hosting fees | Optimize queries, caching |
| **Single Point of Failure** | Redundancy, load balancing |

---

## Processing Distribution Table

| Task | Edge | Cloud | Rationale |
|------|------|-------|-----------|
| **Sensor Reading** | ✅ | ❌ | Hardware interface required |
| **Signal Filtering** | ✅ | ❌ | Real-time, bandwidth optimization |
| **Hardware Fault Detection** | ✅ | ❌ | Safety critical, low latency |
| **Relay Control** | ✅ | ❌ | Immediate response required |
| **Local Display** | ✅ | ❌ | User feedback, offline operation |
| **GPS Parsing** | ✅ | ❌ | UART interface, real-time |
| **Data Packaging** | ✅ | ❌ | Bandwidth optimization |
| **ML Anomaly Detection** | ❌ | ✅ | Model size, computational power |
| **SOC/SOH Prediction** | ❌ | ✅ | Complex models, historical data |
| **Database Storage** | ❌ | ✅ | Capacity, persistence |
| **Fleet Analytics** | ❌ | ✅ | Multi-vehicle aggregation |
| **REST API** | ❌ | ✅ | Centralized access |
| **Dashboard** | ❌ | ✅ | Web-based UI |

---

## Data Flow and Bandwidth

### Edge → Cloud (Upstream)

**Frequency**: Every 3 seconds  
**Payload Size**: ~500 bytes  
**Data Rate**: 165 bytes/second per vehicle  
**Protocol**: HTTP POST (JSON)

**Bandwidth Calculation:**
- 1 vehicle: 165 bytes/s = 1.32 kbps
- 10 vehicles: 1.65 KB/s = 13.2 kbps
- 100 vehicles: 16.5 KB/s = 132 kbps

**Conclusion**: Even 100 vehicles use <1% of typical WiFi bandwidth

### Cloud → Dashboard (Downstream)

**Frequency**: 3-second polling  
**Payload Size**: ~2 KB (fleet status)  
**Data Rate**: 667 bytes/second  
**Protocol**: HTTP GET (JSON)

**Bandwidth Calculation:**
- Dashboard: 667 bytes/s = 5.3 kbps
- 10 concurrent users: 53 kbps
- 50 concurrent users: 265 kbps

**Conclusion**: Easily handled by standard web hosting

---

## Latency Analysis

### End-to-End Latency

```
Sensor Reading (Edge)           →  50ms
Signal Filtering (Edge)         →  10ms
Fault Detection (Edge)          →  5ms
JSON Packaging (Edge)           →  5ms
WiFi Transmission (Edge→Cloud)  →  200ms
Server Processing (Cloud)       →  50ms
ML Inference (Cloud)            →  50ms
Database Write (Cloud)          →  20ms
API Response (Cloud→Dashboard)  →  100ms
Dashboard Rendering             →  50ms
────────────────────────────────────────
Total End-to-End Latency        →  540ms
```

### Critical Path Latency (Safety)

```
Sensor Reading (Edge)           →  50ms
Fault Detection (Edge)          →  5ms
Relay Control (Edge)            →  10ms
────────────────────────────────────────
Total Safety Response Time      →  65ms
```

**Conclusion**: Safety-critical decisions happen in <100ms on edge, independent of cloud connectivity.

---

## Offline Operation

### Edge Capabilities (No Network)

✅ **Fully Functional:**
- Sensor reading and monitoring
- Hardware fault detection
- Relay safety cutoff
- Local OLED display
- LED/buzzer alerts
- GPS tracking

✅ **Degraded:**
- Data buffering (100 samples = 5 minutes)
- No ML anomaly detection
- No cloud dashboard updates

### Data Buffering Strategy

```cpp
#define BUFFER_SIZE 100
struct DataPoint buffer[BUFFER_SIZE];
int bufferIndex = 0;

void bufferData() {
    if (!wifiConnected) {
        buffer[bufferIndex++] = currentData;
        if (bufferIndex >= BUFFER_SIZE) {
            bufferIndex = 0; // Circular buffer (FIFO)
        }
    }
}

void uploadBufferedData() {
    if (wifiConnected && bufferIndex > 0) {
        for (int i = 0; i < bufferIndex; i++) {
            sendToServer(buffer[i]);
        }
        bufferIndex = 0;
    }
}
```

---

## Scalability Comparison

### Edge-Only Architecture (Not Scalable)

| Vehicles | Total Data Rate | Storage | Analytics | Cost |
|----------|-----------------|---------|-----------|------|
| 1 | 165 bytes/s | Local SD card | None | Low |
| 10 | 1.65 KB/s | 10× SD cards | Manual | Medium |
| 100 | 16.5 KB/s | 100× SD cards | Impossible | Very High |

**Problems:**
- No centralized view
- Manual data collection
- No fleet analytics
- High maintenance cost

### Cloud-Only Architecture (Not Reliable)

| Vehicles | Network Dependency | Safety | Latency | Cost |
|----------|-------------------|--------|---------|------|
| 1 | 100% | Poor | High | Medium |
| 10 | 100% | Poor | High | High |
| 100 | 100% | Poor | High | Very High |

**Problems:**
- No offline operation
- Safety depends on network
- High latency for critical decisions
- Expensive bandwidth costs

### Hybrid Edge-Cloud Architecture (Optimal) ✅

| Vehicles | Reliability | Safety | Scalability | Cost |
|----------|-------------|--------|-------------|------|
| 1 | Excellent | Excellent | Good | Low |
| 10 | Excellent | Excellent | Excellent | Medium |
| 100 | Excellent | Excellent | Excellent | Reasonable |

**Advantages:**
- ✅ Offline operation
- ✅ Low-latency safety
- ✅ Centralized analytics
- ✅ Scalable to 100+ vehicles
- ✅ Reasonable cost

---

## Future Enhancements

### Edge Improvements
- **Lightweight ML**: TensorFlow Lite models on edge
- **Local storage**: SD card for extended buffering
- **Mesh networking**: Vehicle-to-vehicle communication
- **OTA updates**: Remote firmware updates

### Cloud Improvements
- **Real-time streaming**: WebSocket for live updates
- **Advanced ML**: Deep learning models
- **Predictive maintenance**: AI-powered predictions
- **Multi-tenant**: Support multiple fleet operators

---

## Conclusion

The hybrid edge-cloud architecture provides:
- **Safety**: Critical decisions on edge (<100ms)
- **Intelligence**: ML-based analytics on cloud
- **Reliability**: Offline operation capability
- **Scalability**: Supports 100+ vehicles
- **Efficiency**: Optimized bandwidth usage (132 kbps for 100 vehicles)

This architecture balances real-time requirements, computational constraints, and scalability needs for effective EV fleet management.
