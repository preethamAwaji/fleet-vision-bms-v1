# Pin Mapping Table - VSDSquadron ULTRA

## Complete Pin Configuration for Fleet Vision BMS

### I2C Bus Configuration (Wire1)

| Device | I2C Address | SDA Pin | SCL Pin | Purpose | Voltage |
|--------|-------------|---------|---------|---------|---------|
| **ADS1115 #1** | 0x48 | GPIO-20 | GPIO-21 | Temperature Sensing (3× LM35) | 3.3V |
| **ADS1115 #2** | 0x49 | GPIO-20 | GPIO-21 | Voltage + Current Sensing | 3.3V |
| **BMP280** | 0x76 | GPIO-20 | GPIO-21 | Environmental Monitoring | 3.3V |
| **SSD1306 OLED** | 0x3C | GPIO-20 | GPIO-21 | Status Display (128x64) | 3.3V |

**I2C Bus Specifications:**
- **Clock Speed**: 100 kHz (Standard Mode)
- **Pull-up Resistors**: 4.7kΩ on SDA and SCL lines
- **Bus Voltage**: 3.3V
- **Total Devices**: 4 devices on single I2C bus

---

### UART Communication

#### UART1 (Hardware Serial)

| Signal | VSDSquadron Pin | Connected To | Baud Rate | Purpose |
|--------|-----------------|--------------|-----------|---------|
| **TX1** | GPIO-17 | ESP8266 RX | 115200 | WiFi Module Transmit |
| **RX1** | GPIO-16 | ESP8266 TX | 115200 | WiFi Module Receive |

**UART1 Configuration:**
- **Baud Rate**: 115200 bps
- **Data Bits**: 8
- **Parity**: None
- **Stop Bits**: 1
- **Flow Control**: None
- **Voltage Level**: 3.3V

#### SoftwareSerial (GPS Module)

| Signal | VSDSquadron Pin | Connected To | Baud Rate | Purpose |
|--------|-----------------|--------------|-----------|---------|
| **RX** | GPIO-3 | NEO-6M TX | 9600 | GPS Data Receive |
| **TX** | GPIO-4 | NEO-6M RX | 9600 | GPS Command Transmit |

**SoftwareSerial Configuration:**
- **Baud Rate**: 9600 bps
- **Protocol**: NMEA 0183
- **Sentences**: GPRMC, GPGGA
- **Update Rate**: 1 Hz
- **Voltage Level**: 3.3V

---

### GPIO Pin Assignments

#### Status LEDs

| LED Function | GPIO Pin | Color | Active State | Current Limiting Resistor |
|--------------|----------|-------|--------------|---------------------------|
| **Charging Indicator** | GPIO-10 | Green | HIGH (ON when charging) | 220Ω |
| **Discharging Indicator** | GPIO-11 | Blue | HIGH (ON when discharging) | 220Ω |
| **Fault Indicator** | GPIO-12 | Red | HIGH (ON when fault detected) | 220Ω |

**LED Specifications:**
- **Forward Voltage**: ~2.0V (typical)
- **Forward Current**: ~20mA
- **Resistor Calculation**: (5V - 2V) / 0.02A = 150Ω (using 220Ω for safety)

#### Control Outputs

| Function | GPIO Pin | Connected To | Active State | Purpose |
|----------|----------|--------------|--------------|---------|
| **Relay Control** | GPIO-8 | 5V Relay Module | HIGH (Relay ON) | Safety cutoff for battery disconnect |
| **Buzzer Control** | GPIO-13 | Active Buzzer 5V | HIGH (Buzzer ON) | Audible alarm for faults |

**Relay Specifications:**
- **Coil Voltage**: 5V
- **Coil Current**: ~70mA
- **Contact Rating**: 10A @ 250VAC / 30VDC
- **Switching**: Normally Open (NO) configuration

**Buzzer Specifications:**
- **Type**: Active buzzer (internal oscillator)
- **Operating Voltage**: 5V
- **Current**: ~30mA
- **Frequency**: ~2.5 kHz

---

### Analog Inputs (via ADS1115 ADCs)

#### ADS1115 #1 (Address 0x48) - Temperature Sensing

| ADS1115 Channel | Connected To | Sensor Type | Measurement Range | Purpose |
|-----------------|--------------|-------------|-------------------|---------|
| **A0** | LM35 #1 | Temperature | 0-100°C | Cell 1 Temperature |
| **A1** | LM35 #2 | Temperature | 0-100°C | Cell 2 Temperature |
| **A2** | LM35 #3 | Temperature | 0-100°C | Cell 3 Temperature |
| **A3** | Not Connected | - | - | Reserved |

**LM35 Configuration:**
- **Output**: 10mV/°C (linear)
- **Supply Voltage**: 5V
- **Output Range**: 0-1.0V (for 0-100°C)
- **Accuracy**: ±0.5°C

#### ADS1115 #2 (Address 0x49) - Voltage & Current Sensing

| ADS1115 Channel | Connected To | Measurement Type | Range | Purpose |
|-----------------|--------------|------------------|-------|---------|
| **A0** | Voltage Divider (VPACK) | Pack Voltage | 0-15V | Total battery pack voltage |
| **A1** | Voltage Divider (VB3) | Cell Voltage | 0-5V | Cell 3 voltage (cumulative) |
| **A2** | Voltage Divider (VB2) | Cell Voltage | 0-5V | Cell 2 voltage (cumulative) |
| **A3** | ACS712 Output | Current | ±4A | Bidirectional current |

**Voltage Divider Configuration:**
- **Ratio**: 11:1 (R1=10kΩ, R2=1kΩ)
- **Input Range**: 0-15V
- **Output Range**: 0-1.36V (safe for ADS1115)
- **Accuracy**: ±1%

**ACS712 Configuration:**
- **Model**: ACS712-05A (5A version)
- **Sensitivity**: 185mV/A
- **Zero Current Output**: 2.5V (VCC/2)
- **Supply Voltage**: 5V
- **Measurement Range**: ±4A (practical limit for our application)

---

### Power Supply Pins

| Pin | Voltage | Current Capacity | Connected To | Purpose |
|-----|---------|------------------|--------------|---------|
| **5V** | 5.0V | 500mA | USB/External | Main power input |
| **3.3V** | 3.3V | 300mA | Onboard regulator | Sensor power supply |
| **GND** | 0V | - | Common ground | Ground reference |

**Power Distribution:**
- **5V Rail**: VSDSquadron ULTRA, Relay, Buzzer, LEDs, LM35 sensors
- **3.3V Rail**: ADS1115, BMP280, SSD1306, ESP8266, NEO-6M GPS

---

### Complete Pin Summary Table

| Pin Number | Pin Name | Function | Connected Device | Signal Type | Voltage |
|------------|----------|----------|------------------|-------------|---------|
| GPIO-3 | RX (SoftSerial) | GPS Receive | NEO-6M TX | UART | 3.3V |
| GPIO-4 | TX (SoftSerial) | GPS Transmit | NEO-6M RX | UART | 3.3V |
| GPIO-8 | Digital Out | Relay Control | 5V Relay Module | GPIO | 5V |
| GPIO-10 | Digital Out | Charging LED | Green LED | GPIO | 5V |
| GPIO-11 | Digital Out | Discharging LED | Blue LED | GPIO | 5V |
| GPIO-12 | Digital Out | Fault LED | Red LED | GPIO | 5V |
| GPIO-13 | Digital Out | Buzzer Control | Active Buzzer | GPIO | 5V |
| GPIO-16 | RX1 | WiFi Receive | ESP8266 TX | UART | 3.3V |
| GPIO-17 | TX1 | WiFi Transmit | ESP8266 RX | UART | 3.3V |
| GPIO-20 | SDA | I2C Data | 4× I2C Devices | I2C | 3.3V |
| GPIO-21 | SCL | I2C Clock | 4× I2C Devices | I2C | 3.3V |

---

### Wiring Diagram Reference

```
VSDSquadron ULTRA
│
├── I2C Bus (GPIO-20/21)
│   ├── ADS1115 #1 (0x48)
│   │   ├── A0 → LM35 #1 (Cell 1 Temp)
│   │   ├── A1 → LM35 #2 (Cell 2 Temp)
│   │   ├── A2 → LM35 #3 (Cell 3 Temp)
│   │   └── A3 → Not Connected
│   │
│   ├── ADS1115 #2 (0x49)
│   │   ├── A0 → Voltage Divider (VPACK)
│   │   ├── A1 → Voltage Divider (VB3)
│   │   ├── A2 → Voltage Divider (VB2)
│   │   └── A3 → ACS712 (Current)
│   │
│   ├── BMP280 (0x76) → Environmental Sensor
│   └── SSD1306 (0x3C) → OLED Display
│
├── UART1 (GPIO-16/17)
│   └── ESP8266 → WiFi Module
│
├── SoftwareSerial (GPIO-3/4)
│   └── NEO-6M → GPS Module
│
└── GPIO
    ├── GPIO-8 → Relay Module
    ├── GPIO-10 → Green LED (Charging)
    ├── GPIO-11 → Blue LED (Discharging)
    ├── GPIO-12 → Red LED (Fault)
    └── GPIO-13 → Buzzer
```

---

### Notes and Considerations

1. **I2C Pull-up Resistors**: Ensure 4.7kΩ resistors are connected between SDA/SCL and 3.3V
2. **Voltage Levels**: All I2C and UART devices operate at 3.3V logic levels
3. **Current Limiting**: All LEDs must have 220Ω series resistors
4. **Power Supply**: Ensure adequate current capacity (minimum 500mA @ 5V)
5. **Ground Connection**: All devices must share common ground
6. **Relay Isolation**: Use optocoupler or transistor driver for relay control
7. **GPS Antenna**: NEO-6M requires clear sky view for optimal performance
8. **WiFi Antenna**: ESP8266 antenna should not be obstructed

---

### Firmware Pin Definitions (Arduino Code)

```cpp
// I2C Pins (Wire1)
#define SDA_PIN 20
#define SCL_PIN 21

// UART1 Pins (ESP8266)
#define ESP_RX 16
#define ESP_TX 17

// SoftwareSerial Pins (GPS)
#define GPS_RX 3
#define GPS_TX 4

// GPIO Pins
#define LED_CHARGING 10
#define LED_DISCHARGING 11
#define LED_FAULT 12
#define RELAY_PIN 8
#define BUZZER_PIN 13

// I2C Addresses
#define ADS1115_TEMP_ADDR 0x48
#define ADS1115_VOLT_ADDR 0x49
#define BMP280_ADDR 0x76
#define OLED_ADDR 0x3C
```

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Hardware Platform**: VSDSquadron ULTRA (THEJAS32 RISC-V)
