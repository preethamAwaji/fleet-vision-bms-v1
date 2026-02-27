# Fleet Vision BMS - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Hardware Connections

#### Minimum Setup (Testing)
```
VSDSquadron Ultra Board
├── USB Cable → Computer (Power + Serial Monitor)
├── I2C Devices (optional for testing)
│   ├── OLED Display (0x3C)
│   └── BMP280 (0x76)
└── LEDs (optional)
    ├── GPIO-10 → LED (Charging)
    ├── GPIO-11 → LED (Discharging)
    └── GPIO-12 → LED (Fault)
```

#### Full Production Setup
- Connect all sensors as per pin configuration
- Ensure proper power supply
- Connect GPS antenna with clear sky view
- Connect WiFi module

### Step 2: Software Installation

1. **Install Arduino IDE**
   - Download from arduino.cc
   - Install VSDSquadron Ultra board support

2. **Install Libraries**
   ```
   Tools → Manage Libraries → Search and Install:
   - Adafruit BMP280
   - Adafruit GFX
   - Adafruit SSD1306
   - VEGA SoftwareSerial
   ```

3. **Configure WiFi**
   Edit in `vsd_bms_fleet_vision.ino`:
   ```cpp
   const char* WIFI_SSID = "YourWiFiName";
   const char* WIFI_PASS = "YourPassword";
   const char* SERVER_HOST = "192.168.1.100";  // Your backend IP
   ```

### Step 3: Upload Code

1. Open `vsd_bms_fleet_vision.ino` in Arduino IDE
2. Select Board: VSDSquadron Ultra
3. Select Port: (your COM port)
4. Click Upload ⬆️

### Step 4: Configuration

1. Open Serial Monitor (115200 baud)
2. Answer configuration questions:
   ```
   1. WIFI MODE: 1 (enabled) or 0 (disabled)
   2. GPS TRACKING: 1 (enabled) or 0 (disabled)
   3. CHARGING MODE: 0 (normal) or 1 (charging)
   4. MOTOR LOAD MODE: 0 (idle) or 1 (load)
   5. FAULT SIMULATION: 0 (real) or 1 (simulated)
   ```

### Step 5: Monitor Operation

Watch Serial Monitor for output:
```
V:[11.40,7.60,3.80] T:[30.1,30.5,32.8] I:-2.00A [CRG] [NLD] ✓OK
📤 Data sent to server
```

## 🎯 Quick Test Modes

### Test Mode 1: Offline (No WiFi/GPS)
```
Configuration:
1. WIFI: 0
2. GPS: 0
3. CHARGING: 0
4. MOTOR LOAD: 0
5. FAULT SIM: 0
```
Result: Basic monitoring, no network

### Test Mode 2: Fault Simulation
```
Configuration:
1. WIFI: 1
2. GPS: 0
3. CHARGING: 0
4. MOTOR LOAD: 0
5. FAULT SIM: 1
```
Result: Auto-cycles through faults F00-F09

### Test Mode 3: Full Production
```
Configuration:
1. WIFI: 1
2. GPS: 1
3. CHARGING: 0
4. MOTOR LOAD: 0
5. FAULT SIM: 0
```
Result: Full monitoring with GPS and cloud

## 📊 Understanding the Output

### Serial Monitor Format
```
V:[v1,v2,v3] T:[t1,t2,t3] I:current [status] [load] [state] [fault]
```

Example:
```
V:[3.80,3.80,3.80] T:[30.1,30.5,32.8] I:-2.00A [CRG] [NLD] 🔌CHARGING ✓OK
```

Breakdown:
- `V:[3.80,3.80,3.80]` - Cell voltages
- `T:[30.1,30.5,32.8]` - Cell temperatures
- `I:-2.00A` - Current (negative = charging)
- `[CRG]` - Charging status
- `[NLD]` - No load
- `🔌CHARGING` - State indicator
- `✓OK` - No faults

## 🔧 Common Issues

### Issue: "OLED not found"
**Solution:** Check I2C connections, verify address 0x3C

### Issue: "No GPS Fix"
**Solution:** Move to window, wait 60 seconds for initial fix

### Issue: "WiFi not connecting"
**Solution:** Check SSID/password, verify ESP8266 connections

### Issue: All voltages show 0.00V
**Solution:** Check ADS1115 connections, verify I2C address 0x49

## 📱 Backend Integration

Your backend should accept POST requests to `/data`:

```python
@app.route('/data', methods=['POST'])
def receive_data():
    data = request.json
    # Process data
    return jsonify({"status": "success"})
```

## 🎓 Next Steps

1. ✅ Read full documentation: `FLEET_VISION_BMS_DOCUMENTATION.md`
2. ✅ Calibrate voltage sensors for your battery
3. ✅ Adjust safety thresholds
4. ✅ Set up backend server
5. ✅ Test fault detection
6. ✅ Deploy to vehicle

## 💡 Pro Tips

- Use fault simulation mode to test backend integration
- Monitor Serial output during initial setup
- GPS needs clear sky view for first fix
- Keep WiFi credentials secure
- Test all fault scenarios before deployment

---

**Need Help?** Check the full documentation or contact support@fleetvision.systems

