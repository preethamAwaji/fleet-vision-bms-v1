# Fleet Vision BMS - Hardware Setup Guide

## 📐 PCB Design Files

The complete hardware design is available in the `hardware/` folder.

### What's Included

1. **Circuit Schematic** (`hardware/schematic.png`)
   - Complete circuit diagram
   - All component connections
   - Power supply design
   - I2C bus layout
   - UART connections

2. **PCB Layout** (`hardware/pcb_layout.png`)
   - Component placement
   - Trace routing
   - Ground planes
   - Mounting holes

3. **Documentation** (`hardware/README.md`)
   - Component specifications
   - Assembly instructions
   - Manufacturing guidelines
   - Cost estimates

## 🔌 Adding Your PCB Images

To add your PCB design images to the repository:

### Step 1: Export Images from EasyEDA

1. Open your project in EasyEDA
2. For Schematic:
   - File → Export → Image
   - Choose PNG format
   - Resolution: 1920x1080 or higher
   - Save as `schematic.png`

3. For PCB Layout:
   - Switch to PCB view
   - File → Export → Image
   - Choose PNG format
   - Resolution: 1920x1080 or higher
   - Save as `pcb_layout.png`

### Step 2: Copy Images to Hardware Folder

```bash
# Navigate to project root
cd fleet-vision-bms

# Copy images to hardware folder
copy path\to\your\schematic.png hardware\schematic.png
copy path\to\your\pcb_layout.png hardware\pcb_layout.png
```

### Step 3: Verify Images Appear

1. Open `README.md` - images should display in Hardware Requirements section
2. Open `hardware/README.md` - images should display at bottom
3. Commit and push to GitHub

```bash
git add hardware/
git commit -m "Add PCB design images"
git push origin main
```

## 🛠️ Manufacturing Your PCB

### Option 1: Order from JLCPCB

1. Export Gerber files from EasyEDA
   - File → Export → Gerber
   - Save as ZIP file

2. Go to [JLCPCB.com](https://jlcpcb.com)
3. Click "Order Now"
4. Upload Gerber ZIP file
5. Configure:
   - Layers: 2
   - PCB Qty: 5 (minimum)
   - PCB Thickness: 1.6mm
   - PCB Color: Blue (or your choice)
   - Surface Finish: HASL
   - Remove Order Number: Yes (optional, +$1.50)

6. Add to cart and checkout
7. Estimated cost: $2-5 for 5 PCBs + shipping

### Option 2: Order from PCBWay

Similar process to JLCPCB:
1. Export Gerber files
2. Upload to [PCBWay.com](https://www.pcbway.com)
3. Configure and order

### Option 3: Local Manufacturer

1. Export Gerber files
2. Contact local PCB manufacturer
3. Provide specifications from `hardware/README.md`

## 🔧 Component Sourcing

### Where to Buy Components

1. **Mouser Electronics** - [mouser.com](https://www.mouser.com)
   - Wide selection
   - Fast shipping
   - Good for prototypes

2. **Digikey** - [digikey.com](https://www.digikey.com)
   - Excellent search
   - Technical support
   - Same-day shipping

3. **LCSC** - [lcsc.com](https://lcsc.com)
   - Low cost
   - Good for bulk orders
   - Ships from China

4. **AliExpress/Amazon**
   - GPS modules
   - OLED displays
   - Sensor modules
   - Longer shipping times

### Component Checklist

- [ ] VSDSquadron Ultra board
- [ ] 2x ADS1115 modules
- [ ] BMP280 sensor
- [ ] NEO-6M GPS module
- [ ] SSD1306 OLED display
- [ ] ESP8266 WiFi module
- [ ] ACS712 current sensor
- [ ] 3x LEDs (Red, Green, Blue)
- [ ] 3x 220Ω resistors
- [ ] Relay module (5V)
- [ ] Active buzzer (5V)
- [ ] Connectors and headers
- [ ] Power supply (5V, 2A)

## 🔨 Assembly Guide

### Tools Needed

- Soldering iron (temperature controlled)
- Solder (lead-free recommended)
- Flux
- Tweezers
- Multimeter
- Wire cutters
- Wire strippers

### Assembly Steps

1. **Inspect PCB**
   - Check for defects
   - Verify all pads are clean

2. **Solder SMD Components** (if any)
   - Start with smallest components
   - Use flux for better results

3. **Solder Through-Hole Components**
   - Install headers first
   - Then resistors and capacitors
   - Finally, connectors

4. **Install Modules**
   - Solder or use headers for modules
   - VSDSquadron Ultra
   - ADS1115 modules
   - BMP280
   - OLED display
   - GPS module
   - ESP8266

5. **Install LEDs and Buzzer**
   - Check polarity!
   - LEDs: Long leg = positive
   - Buzzer: Check marking

6. **Install Relay**
   - Use socket if possible
   - Check coil voltage (5V)

### Testing Procedure

1. **Visual Inspection**
   - Check all solder joints
   - Look for bridges
   - Verify component orientation

2. **Continuity Test**
   - Test power rails
   - Check ground connections
   - Verify I2C bus

3. **Power Test**
   - Connect 5V power supply
   - Measure voltages:
     - 5V rail: 4.9-5.1V
     - 3.3V rail: 3.2-3.4V
   - Check for shorts

4. **Module Test**
   - Program VSDSquadron Ultra
   - Upload test sketch
   - Verify each sensor
   - Test LEDs and buzzer

## 📸 Your PCB Images

Based on your EasyEDA design:

### Schematic Features
- VSDSquadron Ultra as main controller
- Dual ADS1115 for voltage and temperature
- BMP280 for environmental sensing
- OLED display with I2C
- GPS module with SoftwareSerial
- ESP8266 WiFi connectivity
- Status LEDs with current limiting
- Relay with flyback protection
- Buzzer with transistor driver

### PCB Layout Features
- Compact design (~100mm x 80mm)
- Clear component labeling
- Organized connector placement
- Ground plane for noise reduction
- Separate analog and digital sections
- Easy access to programming headers

## 🆘 Troubleshooting

### PCB Issues

**Problem**: PCB doesn't power on
- Check power supply voltage
- Verify polarity
- Check for shorts with multimeter

**Problem**: I2C devices not detected
- Check SDA/SCL connections
- Verify pull-up resistors (4.7kΩ)
- Test each device individually

**Problem**: GPS not working
- Check TX/RX connections
- Verify baud rate (9600)
- Ensure antenna has clear view

## 📞 Support

For hardware questions:
- Email: hardware@fleetvision.systems
- GitHub Issues: Tag with `hardware`
- Documentation: See `hardware/README.md`

---

**Fleet Vision BMS Hardware** - Open Source Design
