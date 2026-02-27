# Calibration Method

## Overview

This document describes the calibration procedures for all sensors in the Fleet Vision BMS to ensure accurate measurements and reliable operation.

---

## 1. Voltage Calibration (ADS1115 + Voltage Dividers)

### Equipment Required
- Precision multimeter (±0.01V accuracy)
- Variable DC power supply (0-15V)
- Known reference voltages

### Calibration Procedure

#### Step 1: Measure Voltage Divider Ratio
```
1. Apply known voltage (e.g., 12.00V) to voltage divider input
2. Measure output voltage with multimeter
3. Calculate actual ratio: Ratio = V_in / V_out
4. Compare with designed ratio (11:1)
```

**Example:**
- Applied voltage: 12.00V
- Measured output: 1.09V
- Actual ratio: 12.00 / 1.09 = 11.01
- Designed ratio: 11.0
- Error: 0.09% (acceptable)

#### Step 2: Calibrate ADC Readings
```cpp
// Measure ADC reading for known voltage
float adc_reading = ads.readADC_SingleEnded(channel);
float adc_voltage = ads.computeVolts(adc_reading);

// Calculate calibration factor
float known_voltage = 12.00; // From multimeter
float measured_voltage = adc_voltage * VOLTAGE_SCALING;
float calibration_factor = known_voltage / measured_voltage;

// Apply calibration
#define VOLTAGE_CALIBRATION 1.002 // Adjust this value
float calibrated_voltage = measured_voltage * VOLTAGE_CALIBRATION;
```

#### Step 3: Multi-Point Calibration
Test at multiple voltage points:

| Reference Voltage | ADC Reading | Calculated Voltage | Error | Calibration Factor |
|-------------------|-------------|--------------------| ------|-------------------|
| 3.00V | 0.273V | 3.003V | +0.10% | 0.999 |
| 3.70V | 0.336V | 3.696V | -0.11% | 1.001 |
| 4.00V | 0.364V | 4.004V | +0.10% | 0.999 |
| 4.20V | 0.382V | 4.202V | +0.05% | 0.9995 |
| 11.10V | 1.009V | 11.099V | -0.01% | 1.0001 |
| 12.00V | 1.091V | 12.001V | +0.01% | 0.9999 |

**Average Calibration Factor**: 1.000 (excellent, no adjustment needed)

#### Step 4: Update Firmware
```cpp
// In firmware, update calibration constant
#define VOLTAGE_SCALING 11.0
#define VOLTAGE_CALIBRATION 1.000 // From calibration

float readVoltage(int channel) {
    int16_t adc = ads_volt.readADC_SingleEnded(channel);
    float volts = ads_volt.computeVolts(adc);
    return volts * VOLTAGE_SCALING * VOLTAGE_CALIBRATION;
}
```

### Calibration Frequency
- Initial calibration: Before first use
- Periodic calibration: Every 6 months
- After component replacement: Immediate

---

## 2. Temperature Calibration (LM35)

### Equipment Required
- Precision thermometer (±0.1°C accuracy)
- Temperature-controlled environment or water bath
- Ice bath (0°C reference)
- Boiling water (100°C reference)

### Calibration Procedure

#### Step 1: Zero Point Calibration (0°C)
```
1. Prepare ice bath (ice + water)
2. Insert LM35 sensor and reference thermometer
3. Wait 5 minutes for thermal equilibrium
4. Record both readings
5. Calculate offset
```

**Example:**
- Reference temperature: 0.0°C
- LM35 reading: 0.2°C
- Offset: -0.2°C

#### Step 2: High Point Calibration (100°C)
```
1. Prepare boiling water bath
2. Insert LM35 sensor and reference thermometer
3. Wait 2 minutes for thermal equilibrium
4. Record both readings
5. Calculate gain error
```

**Example:**
- Reference temperature: 100.0°C
- LM35 reading: 99.8°C
- Gain error: -0.2% (acceptable)

#### Step 3: Room Temperature Verification
```
1. Place sensor in stable room temperature environment
2. Compare with calibrated thermometer
3. Verify accuracy within ±0.5°C
```

**Example:**
- Reference temperature: 25.0°C
- LM35 reading: 25.1°C
- Error: +0.1°C (excellent)

#### Step 4: Multi-Point Calibration Table

| Reference Temp (°C) | LM35 Reading (°C) | Error (°C) | Offset |
|---------------------|-------------------|------------|--------|
| 0.0 | 0.2 | +0.2 | -0.2 |
| 25.0 | 25.1 | +0.1 | -0.1 |
| 40.0 | 40.2 | +0.2 | -0.2 |
| 60.0 | 60.1 | +0.1 | -0.1 |
| 80.0 | 80.0 | 0.0 | 0.0 |
| 100.0 | 99.8 | -0.2 | +0.2 |

**Average Offset**: -0.05°C (negligible)

#### Step 5: Update Firmware
```cpp
// Temperature calibration constants
#define TEMP_OFFSET -0.05 // From calibration
#define TEMP_GAIN 1.000   // No gain adjustment needed

float readTemperature(int channel) {
    int16_t adc = ads_temp.readADC_SingleEnded(channel);
    float volts = ads_temp.computeVolts(adc);
    float temp = volts * 100.0; // LM35: 10mV/°C
    return (temp * TEMP_GAIN) + TEMP_OFFSET;
}
```

### Calibration Frequency
- Initial calibration: Before first use
- Periodic calibration: Every 12 months
- After sensor replacement: Immediate

---

## 3. Current Calibration (ACS712)

### Equipment Required
- Precision ammeter (±0.01A accuracy)
- Variable current source or resistive load
- Known current references

### Calibration Procedure

#### Step 1: Zero Current Calibration
```
1. Disconnect all loads (zero current condition)
2. Measure ACS712 output voltage
3. Record zero-current offset
4. Should be ~2.5V (VCC/2)
```

**Example:**
- Expected zero offset: 2.500V
- Measured zero offset: 2.498V
- Offset error: -0.002V (acceptable)

#### Step 2: Positive Current Calibration
```
1. Apply known positive current (e.g., +2.0A)
2. Measure ACS712 output voltage
3. Calculate sensitivity
4. Compare with datasheet (185mV/A for ACS712-05A)
```

**Example:**
- Applied current: +2.0A
- Output voltage: 2.868V
- Voltage change: 2.868 - 2.498 = 0.370V
- Calculated sensitivity: 0.370V / 2.0A = 0.185 V/A
- Datasheet sensitivity: 0.185 V/A
- Error: 0% (perfect)

#### Step 3: Negative Current Calibration (Charging)
```
1. Apply known negative current (e.g., -2.0A)
2. Measure ACS712 output voltage
3. Verify symmetry
```

**Example:**
- Applied current: -2.0A
- Output voltage: 2.128V
- Voltage change: 2.128 - 2.498 = -0.370V
- Calculated sensitivity: 0.370V / 2.0A = 0.185 V/A
- Symmetry: Perfect

#### Step 4: Multi-Point Calibration

| Reference Current (A) | ACS712 Output (V) | Calculated Current (A) | Error (A) |
|-----------------------|-------------------|------------------------|-----------|
| -4.0 | 1.758 | -4.00 | 0.00 |
| -2.0 | 2.128 | -2.00 | 0.00 |
| 0.0 | 2.498 | 0.00 | 0.00 |
| +2.0 | 2.868 | +2.00 | 0.00 |
| +4.0 | 3.238 | +4.00 | 0.00 |

**Conclusion**: No calibration adjustment needed (excellent linearity)

#### Step 5: Update Firmware
```cpp
// Current sensor calibration
#define ACS_ZERO_OFFSET 2.498  // From calibration
#define ACS_SENSITIVITY 0.185  // V/A (matches datasheet)

float readCurrent() {
    int16_t adc = ads_volt.readADC_SingleEnded(3);
    float volts = ads_volt.computeVolts(adc);
    float current = (volts - ACS_ZERO_OFFSET) / ACS_SENSITIVITY;
    return current;
}
```

### Calibration Frequency
- Initial calibration: Before first use
- Periodic calibration: Every 6 months
- After sensor replacement: Immediate

---

## 4. Environmental Sensor Calibration (BMP280)

### Equipment Required
- Calibrated barometer (±1 hPa accuracy)
- Calibrated thermometer (±0.1°C accuracy)
- Stable environment

### Calibration Procedure

#### Step 1: Pressure Calibration
```
1. Place BMP280 and reference barometer in same location
2. Wait 10 minutes for stabilization
3. Record both readings
4. Calculate offset
```

**Example:**
- Reference pressure: 1013.25 hPa
- BMP280 reading: 1013.50 hPa
- Offset: -0.25 hPa

#### Step 2: Temperature Calibration
```
1. Compare BMP280 temperature with reference thermometer
2. Calculate offset
```

**Example:**
- Reference temperature: 25.0°C
- BMP280 reading: 25.2°C
- Offset: -0.2°C

#### Step 3: Update Firmware
```cpp
// BMP280 calibration offsets
#define BMP_PRESSURE_OFFSET -0.25  // hPa
#define BMP_TEMP_OFFSET -0.2       // °C

float envTemp = bmp.readTemperature() + BMP_TEMP_OFFSET;
float pressure = (bmp.readPressure() / 100.0) + BMP_PRESSURE_OFFSET;
```

### Calibration Frequency
- Initial calibration: Before first use
- Periodic calibration: Every 12 months

---

## 5. GPS Calibration (NEO-6M)

### Equipment Required
- Known reference location (surveyed coordinates)
- Clear sky view
- Minimum 30 minutes observation time

### Calibration Procedure

#### Step 1: Static Position Test
```
1. Place GPS module at known reference location
2. Wait for GPS fix (minimum 8 satellites)
3. Record 100 position samples
4. Calculate average position
5. Compare with reference coordinates
```

**Example:**
- Reference: Lat=15.3647°N, Lon=75.1240°E
- GPS average: Lat=15.3648°N, Lon=75.1241°E
- Error: ~11 meters (acceptable for consumer GPS)

#### Step 2: Altitude Calibration
```
1. Measure known altitude (surveyed or barometric)
2. Compare with GPS altitude
3. Calculate offset
```

**Example:**
- Reference altitude: 650m
- GPS altitude: 648m
- Offset: +2m (acceptable)

### GPS Accuracy Expectations
- Horizontal accuracy: ±5-10 meters (with good fix)
- Vertical accuracy: ±10-20 meters
- Speed accuracy: ±0.1 knots

### No Firmware Calibration Required
GPS modules have internal calibration. No user adjustment needed.

---

## 6. System-Level Calibration

### Power Supply Verification
```
1. Measure 5V rail with multimeter
2. Should be 4.95-5.05V
3. Measure 3.3V rail
4. Should be 3.25-3.35V
```

### I2C Bus Verification
```
1. Run I2C scanner sketch
2. Verify all devices detected at correct addresses:
   - 0x48: ADS1115 (Temperature)
   - 0x49: ADS1115 (Voltage/Current)
   - 0x76: BMP280
   - 0x3C: SSD1306 OLED
```

### Timing Calibration
```
1. Verify sampling interval accuracy
2. Should be 3.000s ± 0.010s
3. Use millis() for timing, not delay()
```

---

## 7. Calibration Record Template

### Calibration Certificate

```
Fleet Vision BMS - Calibration Record
=====================================

Device ID: BMS-001
Calibration Date: 2026-02-27
Calibrated By: [Name]
Next Calibration Due: 2026-08-27

Voltage Calibration:
- Calibration Factor: 1.000
- Test Points: 6
- Maximum Error: ±0.11%
- Status: PASS

Temperature Calibration:
- Offset: -0.05°C
- Test Points: 6
- Maximum Error: ±0.2°C
- Status: PASS

Current Calibration:
- Zero Offset: 2.498V
- Sensitivity: 0.185 V/A
- Test Points: 5
- Maximum Error: 0.00A
- Status: PASS

Environmental Calibration:
- Pressure Offset: -0.25 hPa
- Temperature Offset: -0.2°C
- Status: PASS

GPS Verification:
- Position Error: ±11m
- Altitude Error: ±2m
- Status: PASS

Overall Status: CALIBRATED
Signature: _______________
```

---

## 8. Calibration Verification

### Daily Verification (Quick Check)
- Visual inspection of readings
- Compare with expected values
- Check for obvious errors

### Weekly Verification
- Compare voltage readings with multimeter
- Verify temperature with thermometer
- Check current sensor zero offset

### Monthly Verification
- Full multi-point voltage check
- Temperature verification at 2-3 points
- Current sensor linearity check

### Annual Calibration
- Complete recalibration of all sensors
- Update calibration certificate
- Archive calibration data

---

## 9. Calibration Tools and Scripts

### I2C Scanner (Arduino)
```cpp
void scanI2C() {
    Serial.println("Scanning I2C bus...");
    for (byte addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        if (Wire.endTransmission() == 0) {
            Serial.print("Device found at 0x");
            Serial.println(addr, HEX);
        }
    }
}
```

### Voltage Calibration Script
```cpp
void calibrateVoltage() {
    Serial.println("Apply known voltage and enter value:");
    float known_voltage = Serial.parseFloat();
    
    float measured = readVoltage(0);
    float factor = known_voltage / measured;
    
    Serial.print("Calibration factor: ");
    Serial.println(factor, 4);
}
```

---

## Conclusion

Proper calibration ensures:
- ✅ Voltage accuracy: ±0.01V
- ✅ Temperature accuracy: ±0.5°C
- ✅ Current accuracy: ±0.1A
- ✅ Pressure accuracy: ±1 hPa
- ✅ GPS accuracy: ±10m

Regular calibration maintains system accuracy and reliability for safe EV fleet operation.

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Calibration Standard**: ISO/IEC 17025
