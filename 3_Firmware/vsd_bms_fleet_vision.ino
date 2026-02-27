/**
 * @file vsd_bms_fleet_vision.ino
 * @brief Fleet Vision - Industry-Grade Battery Management System
 * @version 2.0.0
 * @date 2026-02-26
 * 
 * @details
 * Comprehensive Battery Management System with GPS tracking for electric vehicle fleets.
 * Features real-time monitoring, fault detection, GPS location tracking, and cloud connectivity.
 * 
 * @hardware
 * - VSDSquadron Ultra RISC-V Board
 * - ADS1115 ADC (2x) - Voltage and Temperature sensing
 * - BMP280 - Environmental pressure and temperature
 * - SSD1306 OLED Display - 128x64 pixels
 * - NEO-6M GPS Module - Location tracking
 * - ESP8266 WiFi Module - Cloud connectivity
 * 
 * @pinout
 * I2C:
 *   - SDA: GPIO-20
 *   - SCL: GPIO-21
 *   - ADS1115 (Temp): 0x48
 *   - ADS1115 (Volt): 0x49
 *   - BMP280: 0x76
 *   - SSD1306: 0x3C
 * 
 * UART:
 *   - UART1 (ESP8266): TX-GPIO-17, RX-GPIO-16
 *   - GPS: TX-GPIO-4, RX-GPIO-3
 * 
 * GPIO:
 *   - LED_CHARGING: GPIO-10
 *   - LED_DISCHARGING: GPIO-11
 *   - LED_FAULT: GPIO-12
 *   - RELAY: GPIO-8
 *   - BUZZER: GPIO-13
 * 
 * @author Fleet Vision Team
 * @copyright (c) 2026 Fleet Vision Systems
 * @license MIT License
 */

// ============================================================================
// LIBRARY INCLUDES
// ============================================================================
#include <Wire.h>
#include "UARTClass.h"
#include <Adafruit_BMP280.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SoftwareSerial.h>

// ============================================================================
// HARDWARE CONFIGURATION
// ============================================================================

// I2C Bus
TwoWire Wire(1);

// UART for ESP8266 WiFi
UARTClass Serial1(1);

// Software Serial for GPS (TX-GPIO-4, RX-GPIO-3)
SoftwareSerial gpsSerial(4, 3);

// BMP280 Environmental Sensor
Adafruit_BMP280 bmp(&Wire);

// OLED Display (128x64)
#define OLED_RESET -1
Adafruit_SSD1306 display(128, 64, &Wire, OLED_RESET);

// ============================================================================
// I2C DEVICE ADDRESSES
// ============================================================================
#define ADS_TEMP_ADDR    0x48  ///< ADS1115 for temperature sensing
#define ADS_VOLT_ADDR    0x49  ///< ADS1115 for voltage sensing
#define BMP280_ADDR      0x76  ///< BMP280 environmental sensor
#define OLED_ADDR        0x3C  ///< SSD1306 OLED display

// ============================================================================
// GPIO PIN DEFINITIONS
// ============================================================================
#define LED_CHARGING     10    ///< Charging indicator LED
#define LED_DISCHARGING  11    ///< Discharging indicator LED
#define LED_FAULT        12    ///< Fault indicator LED
#define RELAY_PIN        8     ///< Main relay control
#define BUZZER_PIN       13    ///< Alarm buzzer

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

/// @brief Calibration constants for voltage sensing
#define VOLTAGE_SCALING  11.0  ///< Voltage divider scaling factor

/// @brief Calibration constants for current sensing (ACS712)
#define ACS_OFFSET       2.5   ///< Zero current offset voltage
#define ACS_SENSITIVITY  0.066 ///< Sensitivity (66mV/A for 30A module)

/// @brief Battery safety thresholds
#define TEMP_MAX         40.0  ///< Maximum cell temperature (°C)
#define VOLT_MAX         4.2   ///< Maximum cell voltage (V)
#define VOLT_MIN         2.8   ///< Minimum cell voltage (V) - Deep discharge
#define CURRENT_MAX      4.0   ///< Maximum current (A)
#define CELL_IMBALANCE   0.3   ///< Maximum voltage imbalance (V)

// ============================================================================
// WIFI CONFIGURATION
// ============================================================================
const char* WIFI_SSID = "Redmi 12 5G";        ///< WiFi network name
const char* WIFI_PASS = "ikigai77";           ///< WiFi password
const char* SERVER_HOST = "10.90.62.25";      ///< Backend server IP
const int SERVER_PORT = 5000;                 ///< Backend server port

// ============================================================================
// SYSTEM STATE VARIABLES
// ============================================================================

/// @brief Fault detection state
bool faultActive = false;           ///< Current fault status
bool prevFaultState = false;        ///< Previous fault status for edge detection
String faultReason = "";            ///< Human-readable fault description
String faultCode = "F00";           ///< Fault code for server (F00-F09)

/// @brief GPS data
String gpsLatitude = "0.0";         ///< Current latitude
String gpsLongitude = "0.0";        ///< Current longitude
String gpsSpeed = "0.0";            ///< Current speed (km/h)
String gpsAltitude = "0.0";         ///< Current altitude (m)
String gpsSatellites = "0";         ///< Number of satellites
bool gpsFixValid = false;           ///< GPS fix quality

/// @brief OLED display state
bool oledOK = false;                ///< OLED initialization status
unsigned long lastOLED = 0;         ///< Last OLED update timestamp
int oledPage = 0;                   ///< Current OLED page (0-5)

/// @brief Timing variables
unsigned long lastDataSend = 0;     ///< Last data transmission timestamp
#define DATA_SEND_INTERVAL 3000     ///< Data send interval (ms)

/// @brief Operating mode configuration
int CHARGING_MODE = 0;              ///< 0=Not charging, 1=Charging
int MOTOR_LOAD_MODE = 0;            ///< 0=No load, 1=Motor load
int FAULT_SIM_MODE = 0;             ///< 0=Real faults, 1=Simulated faults
bool wifiEnabled = true;            ///< WiFi connectivity enabled
bool gpsEnabled = true;             ///< GPS tracking enabled

// ============================================================================
// FAULT SIMULATION DEFINITIONS
// ============================================================================

/// @brief Fault simulation structure
struct FaultDefinition {
  String code;          ///< Fault code (F00-F09)
  String name;          ///< Short fault name
  String description;   ///< Detailed description
};

/// @brief Predefined fault types for simulation
FaultDefinition faultList[] = {
  {"F00", "NORMAL", "No Fault - System Operating Normally"},
  {"F01", "OVERVOLT", "Cell Overvoltage Detected"},
  {"F02", "OVERTEMP", "Cell Overtemperature Detected"},
  {"F03", "OVERCURR", "Overcurrent Detected"},
  {"F04", "UNDERVOLT", "Cell Undervoltage - Deep Discharge"},
  {"F05", "IMBALANCE", "Cell Voltage Imbalance"},
  {"F06", "OVERPRES", "Pressure Too High - Thermal Event"},
  {"F07", "THERMAL", "Thermal Runaway Warning"},
  {"F08", "COMM_ERR", "Communication Error"},
  {"F09", "SENSOR", "Sensor Malfunction"}
};
const int numFaults = 10;

/// @brief Fault simulation state
bool faultSimMode = false;          ///< Fault simulation active
int simulatedFaultIndex = 0;        ///< Current simulated fault
unsigned long lastAutoFault = 0;    ///< Last fault change timestamp
#define AUTO_FAULT_INTERVAL 5000    ///< Auto fault cycle interval (ms)

// ============================================================================
// FUNCTION PROTOTYPES
// ============================================================================

// I2C Communication
bool writeRegister(uint8_t addr, uint8_t reg, uint16_t value);
bool readRegister(uint8_t addr, uint8_t reg, int16_t &raw);
float readChannel(uint8_t addr, uint16_t config);

// WiFi Communication
void sendCmd(const char* cmd, int wait = 2000);
bool initializeWiFi();
bool sendDataToServer(String jsonData);

// GPS Functions
void initializeGPS();
void updateGPSData();
String parseGPSField(String sentence, int fieldIndex);
bool parseGPRMC(String sentence);
bool parseGPGGA(String sentence);

// Display Functions
void updateOLED(float v1, float v2, float v3, float t1, float t2, float t3, 
                float current, float env, float pressure);
void showBootScreen();

// Fault Detection
void checkFaults(float v1, float v2, float v3, float t1, float t2, float t3, float current);
void updateStatusLEDs(float current, bool hwCharging, bool fault);
void triggerAlarm(int beeps);

// System Configuration
void configurationMenu();
void startupLEDTest();

// ============================================================================
// I2C COMMUNICATION FUNCTIONS
// ============================================================================

/**
 * @brief Write a 16-bit value to an I2C device register
 * @param addr I2C device address
 * @param reg Register address
 * @param value 16-bit value to write
 * @return true if successful, false otherwise
 */
bool writeRegister(uint8_t addr, uint8_t reg, uint16_t value) {
  Wire.beginTransmission(addr);
  Wire.write(reg);
  Wire.write(value >> 8);
  Wire.write(value & 0xFF);
  return Wire.endTransmission() == 0;
}

/**
 * @brief Read a 16-bit value from an I2C device register
 * @param addr I2C device address
 * @param reg Register address
 * @param raw Reference to store the read value
 * @return true if successful, false otherwise
 */
bool readRegister(uint8_t addr, uint8_t reg, int16_t &raw) {
  Wire.beginTransmission(addr);
  Wire.write(reg);
  if (Wire.endTransmission() != 0) return false;
  if (Wire.requestFrom((uint8_t)addr, (uint8_t)2) != 2) return false;
  raw = (Wire.read() << 8) | Wire.read();
  return true;
}

/**
 * @brief Read an ADC channel from ADS1115
 * @param addr ADS1115 I2C address
 * @param config Configuration register value
 * @return Voltage reading in volts, or NAN on error
 */
float readChannel(uint8_t addr, uint16_t config) {
  if (!writeRegister(addr, 0x01, config)) return NAN;
  delay(8);  // Conversion time
  int16_t raw;
  if (!readRegister(addr, 0x00, raw)) return NAN;
  return raw * 0.1875 / 1000.0;  // Convert to volts (±6.144V range)
}

// ============================================================================
// GPS FUNCTIONS
// ============================================================================

/**
 * @brief Initialize GPS module
 */
void initializeGPS() {
  if (!gpsEnabled) {
    Serial.println("⚠ GPS disabled");
    return;
  }
  
  gpsSerial.begin(9600);
  Serial.println("✓ GPS initialized (9600 baud)");
  Serial.println("  Waiting for GPS fix...");
}

/**
 * @brief Parse a specific field from NMEA sentence
 * @param sentence NMEA sentence string
 * @param fieldIndex Field index (0-based)
 * @return Field value as string
 */
String parseGPSField(String sentence, int fieldIndex) {
  int commaCount = 0;
  int startIndex = 0;
  
  for (int i = 0; i < sentence.length(); i++) {
    if (sentence.charAt(i) == ',') {
      if (commaCount == fieldIndex) {
        return sentence.substring(startIndex, i);
      }
      commaCount++;
      startIndex = i + 1;
    }
  }
  
  // Last field
  if (commaCount == fieldIndex) {
    int endIndex = sentence.indexOf('*');
    if (endIndex > 0) {
      return sentence.substring(startIndex, endIndex);
    }
    return sentence.substring(startIndex);
  }
  
  return "";
}

/**
 * @brief Parse GPRMC sentence (Recommended Minimum)
 * @param sentence NMEA GPRMC sentence
 * @return true if valid fix, false otherwise
 * 
 * @details
 * GPRMC Format: $GPRMC,time,status,lat,N/S,lon,E/W,speed,course,date,,,*checksum
 * Example: $GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A
 */
bool parseGPRMC(String sentence) {
  if (!sentence.startsWith("$GPRMC")) return false;
  
  String status = parseGPSField(sentence, 2);
  if (status != "A") {
    gpsFixValid = false;
    return false;
  }
  
  gpsFixValid = true;
  gpsLatitude = parseGPSField(sentence, 3) + parseGPSField(sentence, 4);
  gpsLongitude = parseGPSField(sentence, 5) + parseGPSField(sentence, 6);
  gpsSpeed = parseGPSField(sentence, 7);
  
  return true;
}

/**
 * @brief Parse GPGGA sentence (Global Positioning System Fix Data)
 * @param sentence NMEA GPGGA sentence
 * @return true if valid fix, false otherwise
 * 
 * @details
 * GPGGA Format: $GPGGA,time,lat,N/S,lon,E/W,quality,sats,hdop,alt,M,geoid,M,,*checksum
 * Example: $GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47
 */
bool parseGPGGA(String sentence) {
  if (!sentence.startsWith("$GPGGA")) return false;
  
  String quality = parseGPSField(sentence, 6);
  if (quality == "0") {
    gpsFixValid = false;
    return false;
  }
  
  gpsFixValid = true;
  gpsLatitude = parseGPSField(sentence, 2) + parseGPSField(sentence, 3);
  gpsLongitude = parseGPSField(sentence, 4) + parseGPSField(sentence, 5);
  gpsSatellites = parseGPSField(sentence, 7);
  gpsAltitude = parseGPSField(sentence, 9);
  
  return true;
}

/**
 * @brief Update GPS data from serial stream
 * 
 * @details
 * Reads NMEA sentences from GPS module and parses relevant data.
 * Supports GPRMC and GPGGA sentences for position, speed, and altitude.
 */
void updateGPSData() {
  if (!gpsEnabled) return;
  
  static String nmeaSentence = "";
  
  while (gpsSerial.available() > 0) {
    char c = gpsSerial.read();
    
    if (c == '\n') {
      // Complete sentence received
      if (nmeaSentence.startsWith("$GPRMC")) {
        parseGPRMC(nmeaSentence);
      } else if (nmeaSentence.startsWith("$GPGGA")) {
        parseGPGGA(nmeaSentence);
      }
      nmeaSentence = "";
    } else if (c != '\r') {
      nmeaSentence += c;
    }
  }
}

// ============================================================================
// WIFI COMMUNICATION FUNCTIONS
// ============================================================================

/**
 * @brief Send AT command to ESP8266
 * @param cmd AT command string
 * @param wait Wait time in milliseconds
 */
void sendCmd(const char* cmd, int wait) {
  Serial1.print(cmd);
  Serial1.print("\r\n");
  delay(wait);
}

/**
 * @brief Initialize WiFi connection
 * @return true if successful, false otherwise
 */
bool initializeWiFi() {
  if (!wifiEnabled) {
    Serial.println("⚠ WiFi disabled - running offline");
    return false;
  }
  
  Serial.println("\n📡 Initializing WiFi...");
  
  // Basic AT commands
  Serial1.print("AT\r\n");
  delay(300);
  while (Serial1.available()) Serial1.read();
  
  Serial1.print("ATE0\r\n");  // Echo off
  delay(300);
  while (Serial1.available()) Serial1.read();
  
  Serial1.print("AT+CWMODE=1\r\n");  // Station mode
  delay(300);
  while (Serial1.available()) Serial1.read();
  
  // Connect to WiFi
  char cmd[100];
  sprintf(cmd, "AT+CWJAP=\"%s\",\"%s\"\r\n", WIFI_SSID, WIFI_PASS);
  Serial1.print(cmd);
  
  delay(5000);  // Wait for connection
  while (Serial1.available()) Serial1.read();
  
  Serial.println("✓ WiFi initialization complete");
  return true;
}

/**
 * @brief Send JSON data to backend server
 * @param jsonData JSON string to send
 * @return true if successful, false otherwise
 */
bool sendDataToServer(String jsonData) {
  if (!wifiEnabled) return false;
  
  // Open TCP connection
  char cmd[120];
  sprintf(cmd, "AT+CIPSTART=\"TCP\",\"%s\",%d", SERVER_HOST, SERVER_PORT);
  Serial1.print(cmd);
  Serial1.print("\r\n");
  delay(800);
  while (Serial1.available()) Serial1.read();
  
  // Prepare HTTP request
  String httpRequest = "POST /data HTTP/1.1\r\n";
  httpRequest += "Host: " + String(SERVER_HOST) + "\r\n";
  httpRequest += "Content-Type: application/json\r\n";
  httpRequest += "Content-Length: " + String(jsonData.length()) + "\r\n";
  httpRequest += "Connection: close\r\n\r\n";
  httpRequest += jsonData;
  
  // Send data
  Serial1.print("AT+CIPSEND=");
  Serial1.print(httpRequest.length());
  Serial1.print("\r\n");
  delay(400);
  while (Serial1.available()) Serial1.read();
  
  Serial1.print(httpRequest);
  delay(400);
  
  // Close connection
  Serial1.print("AT+CIPCLOSE\r\n");
  delay(200);
  while (Serial1.available()) Serial1.read();
  
  return true;
}

// ============================================================================
// DISPLAY FUNCTIONS
// ============================================================================

/**
 * @brief Show boot screen with Fleet Vision branding
 */
void showBootScreen() {
  if (!oledOK) return;
  
  // Show EVOLVE.3X logo
  display.clearDisplay();
  display.setTextSize(3);
  display.setTextColor(WHITE);
  display.setCursor(5, 15);
  display.print("EVOLVE");
  display.setTextSize(2);
  display.setCursor(35, 45);
  display.print(".3X");
  display.display();
  delay(2000);
  
  // Show Fleet Vision
  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor(15, 15);
  display.print("Fleet");
  display.setCursor(10, 40);
  display.print("Vision");
  display.display();
  delay(1500);
}

/**
 * @brief Update OLED display with system data
 * @param v1 Cell 1 voltage (V)
 * @param v2 Cell 2 voltage (V)
 * @param v3 Cell 3 voltage (V)
 * @param t1 Cell 1 temperature (°C)
 * @param t2 Cell 2 temperature (°C)
 * @param t3 Cell 3 temperature (°C)
 * @param current Battery current (A)
 * @param env Environmental temperature (°C)
 * @param pressure Atmospheric pressure (hPa)
 */
void updateOLED(float v1, float v2, float v3, float t1, float t2, float t3, 
                float current, float env, float pressure) {
  if (!oledOK) return;
  if (millis() - lastOLED < 2000) return;
  lastOLED = millis();
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  
  if (oledPage == 0) {
    // Page 1: Voltages
    display.println("VOLTAGES");
    display.println("");
    display.print("V1: "); display.print(v1, 2); display.println(" V");
    display.print("V2: "); display.print(v2, 2); display.println(" V");
    display.print("V3: "); display.print(v3, 2); display.println(" V");
    display.println("");
    display.print("Max: "); display.print(VOLT_MAX, 1); display.println(" V");
  } 
  else if (oledPage == 1) {
    // Page 2: Temperatures
    display.println("TEMPERATURE");
    display.println("");
    display.print("T1: "); display.print(t1, 1); display.println(" C");
    display.print("T2: "); display.print(t2, 1); display.println(" C");
    display.print("T3: "); display.print(t3, 1); display.println(" C");
    display.println("");
    display.print("Max: "); display.print(TEMP_MAX, 0); display.println(" C");
  } 
  else if (oledPage == 2) {
    // Page 3: Current & Status
    display.println("CURRENT");
    display.println("");
    display.setTextSize(2);
    display.print(current, 1);
    display.println(" A");
    display.setTextSize(1);
    display.println("");
    
    if (CHARGING_MODE == 1 || current < -0.5) {
      display.println("CHARGING");
    } else if (current > 0.5) {
      display.println("DISCHARGING");
    } else {
      display.println("IDLE");
    }
  } 
  else if (oledPage == 3) {
    // Page 4: Environment
    display.println("ENVIRONMENT");
    display.println("");
    display.print("Temp: "); display.print(env, 1); display.println(" C");
    display.print("Press: "); display.print(pressure, 0); display.println(" hPa");
    display.println("");
    if (faultActive) {
      display.println("FAULT:");
      display.print(faultCode);
      display.print(" ");
      display.println(faultReason);
    } else {
      display.println("Status: OK");
    }
  }
  else if (oledPage == 4) {
    // Page 5: GPS Data
    display.println("GPS LOCATION");
    display.println("");
    if (gpsFixValid) {
      display.print("Lat: "); display.println(gpsLatitude);
      display.print("Lon: "); display.println(gpsLongitude);
      display.print("Spd: "); display.print(gpsSpeed); display.println(" kt");
      display.print("Sat: "); display.println(gpsSatellites);
    } else {
      display.println("No GPS Fix");
      display.println("Searching...");
    }
  }
  else {
    // Page 6: Fault Status
    display.println("STATUS");
    display.println("");
    if (faultActive) {
      display.setTextSize(2);
      display.println("FAULT!");
      display.setTextSize(1);
      display.println("");
      display.print(faultCode);
      display.print(": ");
      display.println(faultReason);
    } else {
      display.setTextSize(2);
      display.println("NORMAL");
      display.setTextSize(1);
      display.println("");
      display.println("All systems OK");
    }
  }
  
  display.display();
  oledPage++;
  if (oledPage > 5) oledPage = 0;
}

// ============================================================================
// FAULT DETECTION AND SAFETY FUNCTIONS
// ============================================================================

/**
 * @brief Check for battery faults and update fault status
 * @param v1 Cell 1 voltage (V)
 * @param v2 Cell 2 voltage (V)
 * @param v3 Cell 3 voltage (V)
 * @param t1 Cell 1 temperature (°C)
 * @param t2 Cell 2 temperature (°C)
 * @param t3 Cell 3 temperature (°C)
 * @param current Battery current (A)
 */
void checkFaults(float v1, float v2, float v3, float t1, float t2, float t3, float current) {
  // Check if fault simulation is enabled
  if (FAULT_SIM_MODE == 1) {
    if (!faultSimMode) {
      faultSimMode = true;
      simulatedFaultIndex = 0;
      lastAutoFault = millis();
      Serial.println("🔄 FAULT SIMULATION ENABLED");
    }
    
    // Auto cycle through faults
    if (millis() - lastAutoFault > AUTO_FAULT_INTERVAL) {
      lastAutoFault = millis();
      simulatedFaultIndex++;
      if (simulatedFaultIndex >= numFaults) {
        simulatedFaultIndex = 0;
      }
      Serial.print("🔄 AUTO FAULT: ");
      Serial.print(faultList[simulatedFaultIndex].code);
      Serial.print(" - ");
      Serial.println(faultList[simulatedFaultIndex].name);
      
      if (simulatedFaultIndex != 0) {
        triggerAlarm(2);
      }
    }
    
    // Use simulated fault
    if (simulatedFaultIndex == 0) {
      faultActive = false;
      faultReason = "";
      faultCode = "F00";
    } else {
      faultActive = true;
      faultCode = faultList[simulatedFaultIndex].code;
      faultReason = faultList[simulatedFaultIndex].name;
    }
  } else {
    // Real fault detection
    if (faultSimMode) {
      faultSimMode = false;
      simulatedFaultIndex = 0;
      Serial.println("🔄 FAULT SIMULATION DISABLED");
    }
    
    faultActive = false;
    faultReason = "";
    faultCode = "F00";
    
    // Check overvoltage
    if (v1 > VOLT_MAX || v2 > VOLT_MAX || v3 > VOLT_MAX) {
      faultActive = true;
      faultReason = "OVERVOLT";
      faultCode = "F01";
      Serial.println("⚠️ FAULT: Overvoltage detected!");
    }
    
    // Check overtemperature
    if (t1 > TEMP_MAX || t2 > TEMP_MAX || t3 > TEMP_MAX) {
      faultActive = true;
      if (faultReason.length() > 0) faultReason += "+";
      faultReason += "OVERTEMP";
      faultCode = "F02";
      Serial.println("⚠️ FAULT: Overtemperature detected!");
    }
    
    // Check undervoltage (deep discharge)
    if (v1 < VOLT_MIN || v2 < VOLT_MIN || v3 < VOLT_MIN) {
      faultActive = true;
      if (faultReason.length() > 0) faultReason += "+";
      faultReason += "UNDERVOLT";
      faultCode = "F04";
      Serial.println("⚠️ FAULT: Undervoltage - Deep discharge!");
    }
    
    // Check cell imbalance
    float maxV = max(v1, max(v2, v3));
    float minV = min(v1, min(v2, v3));
    if ((maxV - minV) > CELL_IMBALANCE) {
      faultActive = true;
      if (faultReason.length() > 0) faultReason += "+";
      faultReason += "IMBALANCE";
      faultCode = "F05";
      Serial.println("⚠️ FAULT: Cell imbalance detected!");
    }
  }
  
  // Control fault LED
  digitalWrite(LED_FAULT, faultActive ? HIGH : LOW);
  
  // Control relay (OFF when fault for safety)
  digitalWrite(RELAY_PIN, faultActive ? HIGH : LOW);
  
  // Sound alarm on new fault
  if (faultActive && !prevFaultState) {
    Serial.print("🚨 ALARM TRIGGERED! Fault Code: ");
    Serial.println(faultCode);
    triggerAlarm(3);
  }
  
  prevFaultState = faultActive;
}

/**
 * @brief Update status LEDs based on system state
 * @param current Battery current (A)
 * @param hwCharging Hardware charging signal
 * @param fault Fault status
 */
void updateStatusLEDs(float current, bool hwCharging, bool fault) {
  // FAULT LED
  digitalWrite(LED_FAULT, fault ? HIGH : LOW);
  
  // CHARGING LED
  if (hwCharging || CHARGING_MODE == 1 || current < -0.5) {
    digitalWrite(LED_CHARGING, HIGH);
  } else {
    digitalWrite(LED_CHARGING, LOW);
  }
  
  // DISCHARGE LED
  if (MOTOR_LOAD_MODE == 1 || current > 0.5) {
    digitalWrite(LED_DISCHARGING, HIGH);
  } else {
    digitalWrite(LED_DISCHARGING, LOW);
  }
}

/**
 * @brief Trigger alarm buzzer
 * @param beeps Number of beeps
 */
void triggerAlarm(int beeps) {
  for (int i = 0; i < beeps; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    delay(200);
  }
}

/**
 * @brief Startup LED test sequence
 */
void startupLEDTest() {
  Serial.println("\n=== STARTUP LED TEST ===");
  
  for (int i = 0; i < 3; i++) {
    Serial.print("Blink ");
    Serial.println(i + 1);
    
    digitalWrite(LED_CHARGING, HIGH);
    digitalWrite(LED_DISCHARGING, HIGH);
    digitalWrite(LED_FAULT, HIGH);
    digitalWrite(BUZZER_PIN, HIGH);
    delay(200);
    
    digitalWrite(LED_CHARGING, LOW);
    digitalWrite(LED_DISCHARGING, LOW);
    digitalWrite(LED_FAULT, LOW);
    digitalWrite(BUZZER_PIN, LOW);
    delay(200);
  }
  
  Serial.println("LED test complete\n");
}

