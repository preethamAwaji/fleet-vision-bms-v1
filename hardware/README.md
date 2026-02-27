# Fleet Vision BMS - Hardware Design Files

## 📐 PCB Design

This folder contains the hardware design files for the Fleet Vision BMS.

### Files

1. **schematic.png** - Complete circuit schematic
2. **pcb_layout.png** - PCB layout (top view)
3. **BOM.csv** - Bill of Materials (coming soon)
4. **gerber_files/** - Gerber files for manufacturing (coming soon)

## 🔌 Schematic Overview

The schematic shows the complete circuit design including:
- VSDSquadron Ultra microcontroller
- ADS1115 ADC modules (2x) for voltage and temperature sensing
- BMP280 environmental sensor
- SSD1306 OLED display
- NEO-6M GPS module
- ESP8266 WiFi module
- ACS712 current sensor
- Status LEDs (3x)
- Relay module
- Buzzer
- Power supply circuit

### Key Components

| Component | Designator | Description |
|-----------|------------|-------------|
| U2 | VSDSquadron Ultra | Main microcontroller |
| U7 | ESP8266 | WiFi module |
| U12 | ADS1115 | Voltage ADC |
| U5 | ADS1115 | Temperature ADC |
| U9 | BMP280 | Environmental sensor |
| OLED1 | SSD1306 | 128x64 OLED display |
| P1 | ACS712 | Current sensor |
| LED4, LED5, LED6 | Status LEDs | Charging, Discharging, Fault |
| U13 | GPS Module | NEO-6M GPS |

## 🖼️ PCB Layout

The PCB layout shows:
- Component placement
- Trace routing
- Ground plane
- Power distribution
- Mounting holes
- Connector locations

### PCB Specifications

| Parameter | Value |
|-----------|-------|
| **Board Size** | ~100mm x 80mm |
| **Layers** | 2 (Top + Bottom) |
| **Copper Thickness** | 1 oz (35 μm) |
| **Min Track Width** | 0.25mm |
| **Min Clearance** | 0.25mm |
| **Finish** | HASL / ENIG |
| **Solder Mask** | Blue |
| **Silkscreen** | White |

### Component Placement

- **Top Side**: All major components
- **Bottom Side**: Minimal components (if any)

## 🔧 Manufacturing

### Recommended PCB Manufacturers

- **JLCPCB** - Low cost, good quality
- **PCBWay** - Professional service
- **OSH Park** - USA-based, high quality
- **Seeed Studio** - Good for prototypes

### Assembly Options

1. **DIY Assembly**: Order bare PCB and solder components yourself
2. **PCBA Service**: Use manufacturer's assembly service (JLCPCB, PCBWay)
3. **Local Assembly**: Send to local electronics assembly shop

## 📋 Bill of Materials (BOM)

See `BOM.csv` for complete list of components with:
- Part numbers
- Quantities
- Suppliers (Mouser, Digikey, LCSC)
- Approximate costs

### Estimated Cost

| Category | Cost (USD) |
|----------|------------|
| PCB (5 pcs) | $10-20 |
| Components | $50-80 |
| Assembly (if outsourced) | $30-50 |
| **Total per unit** | **$18-30** |

## 🛠️ Assembly Instructions

1. **Solder SMD Components First**
   - Start with smallest components (resistors, capacitors)
   - Then ICs and modules
   - Use solder paste and hot air station for best results

2. **Through-Hole Components**
   - Solder connectors
   - Add LEDs and buzzer
   - Install relay module

3. **Testing**
   - Visual inspection
   - Continuity test
   - Power-on test (without microcontroller)
   - Program and test microcontroller

## 🔍 Design Notes

### Power Supply
- Input: 5V via USB or external supply
- 3.3V regulation for sensors
- Separate power planes for analog and digital

### I2C Bus
- Pull-up resistors: 4.7kΩ
- All I2C devices on same bus
- Addresses: 0x48, 0x49, 0x76, 0x3C

### UART Communication
- Hardware UART for ESP8266 (115200 baud)
- Software Serial for GPS (9600 baud)

### GPIO
- LEDs with current limiting resistors (220Ω)
- Relay with flyback diode protection
- Buzzer with transistor driver

## 📸 Images

### Hardware Prototypes

#### Breadboard Prototype
![Prototype Setup 1](prototype_1.jpg)

**Components Visible:**
- VSDSquadron Ultra (red development board)
- NEO-6M GPS module (blue board with ceramic antenna)
- 3S Li-ion battery pack (3x 18650 cells in pink holders)
- Breadboard for circuit prototyping
- Status LEDs (red indicators)
- Cooling fan (black, top left)
- Buzzer for alarms
- Jumper wires for connections
- Mobile phone showing real-time data

**Features:**
- Complete working prototype
- All sensors connected
- GPS tracking active
- Battery monitoring operational
- Real-time data transmission

#### Assembled BMS Unit
![Prototype Setup 2](prototype_2.jpg)

**Components Visible:**
- VSDSquadron Ultra main controller
- GPS module with antenna
- 3S battery pack (3x 18650 cells)
- Organized wire harness
- Compact assembly
- Status indicators

**Design Highlights:**
- Modular construction
- Easy maintenance access
- Compact form factor
- Professional wire management
- Production-ready design

### PCB Design

#### Schematic
![Circuit Schematic](schematic.png)

#### PCB Layout
![PCB Layout](pcb_layout.png)

## 📞 Support

For hardware questions or custom designs:
- Email: hardware@fleetvision.systems
- GitHub Issues: Hardware-related issues

## 📄 License

Hardware design files are released under:
- **CERN Open Hardware Licence Version 2 - Strongly Reciprocal**
- You are free to use, modify, and distribute
- Must share modifications under same license

---

**Fleet Vision BMS Hardware v1.0** - Open Source Hardware Design
