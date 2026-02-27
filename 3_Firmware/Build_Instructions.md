# Build Instructions - VSDSquadron ULTRA Firmware

## Prerequisites

### Software Requirements
- **Arduino IDE**: Version 2.0 or later
- **VSDSquadron ULTRA Board Support**: Install from board manager
- **USB Drivers**: CH340/CP2102 drivers for serial communication

### Hardware Requirements
- VSDSquadron ULTRA development board
- USB cable (Type-A to Micro-USB)
- All sensors and components as per BOM

---

## Step 1: Install Arduino IDE

### Windows
1. Download Arduino IDE from [arduino.cc](https://www.arduino.cc/en/software)
2. Run the installer (arduino-ide_2.x.x_Windows_64bit.exe)
3. Follow installation wizard
4. Launch Arduino IDE

### Linux
```bash
# Download and extract
wget https://downloads.arduino.cc/arduino-ide/arduino-ide_2.x.x_Linux_64bit.zip
unzip arduino-ide_2.x.x_Linux_64bit.zip

# Run Arduino IDE
cd arduino-ide_2.x.x_Linux_64bit
./arduino-ide
```

### macOS
1. Download Arduino IDE DMG file
2. Drag Arduino IDE to Applications folder
3. Launch from Applications

---

## Step 2: Install VSDSquadron ULTRA Board Support

### Add Board Manager URL
1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Board Manager URLs", add:
   ```
   https://github.com/vsdip/vsdsquadron_ultra/raw/main/package_vsdsquadron_ultra_index.json
   ```
4. Click **OK**

### Install Board Package
1. Go to **Tools → Board → Boards Manager**
2. Search for "VSDSquadron ULTRA"
3. Click **Install** on "VSDSquadron ULTRA by VLSI System Design"
4. Wait for installation to complete
5. Close Boards Manager

---

## Step 3: Install Required Libraries

### Method 1: Library Manager (Recommended)

1. Go to **Tools → Manage Libraries** (or Ctrl+Shift+I)
2. Search and install the following libraries:

| Library Name | Version | Purpose |
|--------------|---------|---------|
| **Adafruit BMP280** | Latest | Environmental sensor |
| **Adafruit GFX Library** | Latest | Graphics primitives |
| **Adafruit SSD1306** | Latest | OLED display driver |
| **Adafruit ADS1X15** | Latest | ADC driver |
| **VEGA SoftwareSerial** | Latest | GPS communication |

### Method 2: Manual Installation

If libraries are not available in Library Manager:

1. Download library ZIP files from GitHub
2. Go to **Sketch → Include Library → Add .ZIP Library**
3. Select downloaded ZIP file
4. Repeat for each library

---

## Step 4: Configure Board Settings

1. Go to **Tools → Board**
2. Select **VSDSquadron ULTRA**
3. Configure the following settings:

| Setting | Value |
|---------|-------|
| **Board** | VSDSquadron ULTRA |
| **Upload Speed** | 115200 |
| **CPU Frequency** | 24 MHz |
| **Flash Size** | 4MB |
| **Port** | Select your COM port (e.g., COM3, /dev/ttyUSB0) |

### Finding the Correct Port

**Windows:**
- Open Device Manager
- Look under "Ports (COM & LPT)"
- Note the COM port number (e.g., COM3)

**Linux:**
```bash
ls /dev/ttyUSB*
# or
ls /dev/ttyACM*
```

**macOS:**
```bash
ls /dev/cu.*
```

---

## Step 5: Open Firmware Project

### Option 1: Open Existing Firmware
1. Go to **File → Open**
2. Navigate to project folder
3. Select one of the firmware files:
   - `vsd_bms_fleet_vision.ino` (Production - GPS enabled)
   - `vsd_bms_with_fault_sim.ino` (Development - Fault simulation)
   - `vsd_bms_autonomous.ino` (Autonomous mode)

### Option 2: Create New Project
1. Go to **File → New Sketch**
2. Copy firmware code from repository
3. Save with appropriate name

---

## Step 6: Configure WiFi and Server Settings

Edit the following lines in the firmware:

```cpp
// WiFi Configuration
const char* WIFI_SSID = "YourWiFiName";        // Change to your WiFi SSID
const char* WIFI_PASS = "YourPassword";        // Change to your WiFi password

// Server Configuration
const char* SERVER_HOST = "192.168.1.100";     // Change to your backend IP
const int SERVER_PORT = 5000;                  // Change if using different port
const char* SERVER_PATH = "/data";             // API endpoint
```

### Finding Your Backend IP

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address"

**Linux/macOS:**
```bash
ifconfig
# or
ip addr show
```

---

## Step 7: Verify Code

1. Click **Verify** button (✓) or press **Ctrl+R**
2. Wait for compilation to complete
3. Check for errors in the output window

### Common Compilation Errors

**Error: Library not found**
- Solution: Install missing library from Library Manager

**Error: Board not selected**
- Solution: Select VSDSquadron ULTRA from Tools → Board

**Error: Port not found**
- Solution: Connect board and select correct port

---

## Step 8: Upload Firmware

### Connect Hardware
1. Connect VSDSquadron ULTRA to computer via USB
2. Ensure board is powered (LED should light up)
3. Select correct port from **Tools → Port**

### Upload Process
1. Click **Upload** button (→) or press **Ctrl+U**
2. Wait for compilation and upload
3. Monitor progress in output window

### Upload Output
```
Sketch uses 245678 bytes (59%) of program storage space.
Global variables use 12345 bytes (37%) of dynamic memory.
Uploading...
Writing at 0x00010000... (100%)
Wrote 245678 bytes at 0x00010000 in 12.3 seconds.
Hard resetting via RTS pin...
```

---

## Step 9: Initial Configuration

### Open Serial Monitor
1. Click **Serial Monitor** button or press **Ctrl+Shift+M**
2. Set baud rate to **115200**
3. Set line ending to **Newline**

### Configuration Menu
On first boot, you'll see:

```
=== Fleet Vision BMS Configuration ===

1. Enable WiFi? (0=No, 1=Yes): 
```

Answer the following questions:

| Question | Options | Recommended |
|----------|---------|-------------|
| Enable WiFi? | 0=No, 1=Yes | 1 (Yes) |
| Enable GPS? | 0=No, 1=Yes | 1 (Yes) |
| Charging Mode? | 0=Not Charging, 1=Charging | 0 (Normal) |
| Motor Load? | 0=No Load, 1=Motor Load | 0 (No Load) |
| Fault Simulation? | 0=Real Faults, 1=Simulate | 0 (Real) |

### Expected Output
```
V:[3.80,3.80,3.80] T:[30.1,30.5,32.8] I:-2.00A [CRG] [NLD] ✓OK
📤 Data sent to server
```

---

## Step 10: Verify Operation

### Check Serial Output
- Voltage readings: `V:[x.xx, x.xx, x.xx]`
- Temperature readings: `T:[xx.x, xx.x, xx.x]`
- Current reading: `I:x.xxA`
- GPS fix: `📍GPS` (if GPS enabled)
- Data transmission: `📤 Data sent to server`

### Check OLED Display
Display should cycle through 6 pages every 2 seconds:
1. Cell voltages
2. Cell temperatures
3. Current and charge state
4. Environmental data
5. GPS location
6. System status

### Check LEDs
- **Green LED**: ON when charging
- **Blue LED**: ON when discharging
- **Red LED**: ON when fault detected

---

## Troubleshooting

### Upload Fails

**Problem**: "Failed to connect to board"
- **Solution**: 
  - Check USB cable connection
  - Try different USB port
  - Install CH340 drivers
  - Press RESET button before upload

**Problem**: "Port not found"
- **Solution**:
  - Reconnect USB cable
  - Check Device Manager (Windows)
  - Try `sudo chmod 666 /dev/ttyUSB0` (Linux)

### Compilation Errors

**Problem**: "Library not found"
- **Solution**: Install missing library from Library Manager

**Problem**: "Undefined reference"
- **Solution**: Check library versions, update to latest

### Runtime Issues

**Problem**: WiFi not connecting
- **Solution**:
  - Check SSID and password
  - Ensure 2.4GHz WiFi (ESP8266 doesn't support 5GHz)
  - Check WiFi signal strength

**Problem**: GPS not getting fix
- **Solution**:
  - Move to location with clear sky view
  - Wait 30-60 seconds for initial fix
  - Check GPS antenna connection

**Problem**: Sensor readings incorrect
- **Solution**:
  - Check I2C connections (SDA, SCL)
  - Verify I2C addresses with I2C scanner
  - Check power supply (3.3V for sensors)

---

## Advanced Configuration

### Enable Debug Mode

Add at the top of your sketch:
```cpp
#define DEBUG_MODE 1
```

This enables verbose serial output for debugging.

### Adjust Sampling Rate

Change the sampling interval:
```cpp
const unsigned long SAMPLE_INTERVAL = 3000; // 3 seconds (default)
// Change to 1000 for 1-second sampling
// Change to 5000 for 5-second sampling
```

### Calibrate Sensors

#### Voltage Calibration
```cpp
#define VOLTAGE_SCALING 11.0  // Adjust based on voltage divider
```

#### Current Calibration
```cpp
#define ACS_OFFSET 2.5        // Zero current offset (V)
#define ACS_SENSITIVITY 0.066 // Sensitivity (V/A)
```

#### Temperature Calibration
```cpp
#define TEMP_OFFSET 0.0       // Temperature offset (°C)
```

---

## Firmware Variants

### Production Firmware (vsd_bms_fleet_vision.ino)
- **Features**: Full functionality with GPS
- **Use Case**: Deployed vehicles
- **WiFi**: Enabled
- **GPS**: Enabled
- **Fault Simulation**: Disabled

### Development Firmware (vsd_bms_with_fault_sim.ino)
- **Features**: Fault simulation for testing
- **Use Case**: Development and testing
- **WiFi**: Optional
- **GPS**: Optional
- **Fault Simulation**: Enabled (cycles F00-F09)

### Autonomous Firmware (vsd_bms_autonomous.ino)
- **Features**: Standalone operation
- **Use Case**: Offline monitoring
- **WiFi**: Disabled
- **GPS**: Optional
- **Data Storage**: Local EEPROM/SD card

---

## Build Verification Checklist

- [ ] Arduino IDE installed and configured
- [ ] VSDSquadron ULTRA board support installed
- [ ] All required libraries installed
- [ ] Board and port selected correctly
- [ ] WiFi credentials configured
- [ ] Server IP address configured
- [ ] Code compiles without errors
- [ ] Firmware uploads successfully
- [ ] Serial monitor shows sensor readings
- [ ] OLED display cycling through pages
- [ ] LEDs functioning correctly
- [ ] WiFi connecting to network
- [ ] Data transmitting to server
- [ ] GPS getting fix (if enabled)

---

## Next Steps

After successful build and upload:

1. **Test all sensors**: Verify voltage, temperature, current readings
2. **Test GPS**: Check location accuracy
3. **Test WiFi**: Verify data transmission to backend
4. **Test fault detection**: Trigger faults and verify response
5. **Run stress test**: 24-hour continuous operation
6. **Deploy to vehicle**: Install in actual EV for field testing

---

## Support

For issues or questions:
- Check troubleshooting section above
- Review firmware comments for detailed explanations
- Consult VSDSquadron ULTRA documentation
- Check Arduino forum for common issues

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Firmware Version**: 2.0.0
