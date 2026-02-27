#include <Wire.h>
#include "UARTClass.h"
#include <Adafruit_BMP280.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ===== I2C =====
TwoWire Wire(1);

// ===== UART =====
UARTClass Serial1(1);

// ===== BMP280 =====
Adafruit_BMP280 bmp(&Wire);

// ===== OLED DISPLAY =====
#define OLED_RESET -1
Adafruit_SSD1306 display(128, 64, &Wire, OLED_RESET);

// ===== ADS1115 ADDRESSES =====
#define ADS_TEMP 0x48
#define ADS_VOLT 0x49

// ===== PINS =====
#define LED_CHARGING 10         // LED - ON when charging (CRG mode or current < -0.5A)
#define LED_DISCHARGING 11      // LED - ON when motor load active (MTL mode or current > 0.5A)
#define LED_FAULT 12            // LED - ON when fault detected
#define RELAY_PIN 8             // Relay control
#define BUZZER_PIN 13           // Buzzer alarm

// ===== MANUAL CONFIGURATION (Change these values as needed) =====
// Set these to 0 or 1 to control behavior without GPIO pins
int CHARGING_MODE = 0;          // 0 = Not charging (NCR), 1 = Charging (CRG)
int MOTOR_LOAD_MODE = 0;        // 0 = No load (NLD), 1 = Motor load (MTL)
int FAULT_SIM_MODE = 0;         // 0 = Disabled, 1 = Enabled (cycles through faults)

// ===== CALIBRATION =====
float scaling = 11.0;           // Accurate voltage scaling factor
float ACS_OFFSET = 2.5;
float ACS_SENS = 0.066;

// ===== THRESHOLDS =====
#define TEMP_MAX 40.0           // °C
#define VOLT_MAX 4.2            // V per cell
#define CURRENT_MAX 30.0        // A (absolute value)

// ===== WIFI =====
const char* ssid = "Redmi 12 5G";
const char* pass = "ikigai77";
const char* host = "10.90.62.25";
const int port = 5000;
bool wifiEnabled = false;  // Will be configured at startup

// ===== STATE =====
bool faultActive = false;
bool prevFaultState = false;
String faultReason = "";
String faultCode = "F00";       // Fault code for server

// ===== FAULT SIMULATION =====
bool faultSimMode = false;
int simulatedFaultIndex = 0;
unsigned long lastAutoFault = 0;
#define AUTO_FAULT_INTERVAL 3000 // 3 seconds between auto faults

// Fault simulation definitions
struct FaultSim {
  String code;
  String name;
  String description;
};

FaultSim faultList[] = {
  {"F00", "NORMAL", "No Fault"},
  {"F01", "OVERVOLT", "Cell Overvoltage"},
  {"F02", "OVERTEMP", "Cell Overtemperature"},
  {"F03", "OVERCURR", "Overcurrent Detected"},
  {"F04", "UNDERVOLT", "Cell Undervoltage"},
  {"F05", "IMBALANCE", "Cell Imbalance"},
  {"F06", "OVERPRES", "Pressure Too High"},
  {"F07", "THERMAL", "Thermal Runaway"},
  {"F08", "COMM_ERR", "Communication Error"},
  {"F09", "SENSOR", "Sensor Malfunction"}
};
const int numFaults = 10;

// ===== OLED =====
bool oledOK = false;
unsigned long lastOLED = 0;
int oledPage = 0;

// ================= I2C FUNCTIONS =================
bool writeRegister(uint8_t addr, uint8_t reg, uint16_t value) {
  Wire.beginTransmission(addr);
  Wire.write(reg);
  Wire.write(value >> 8);
  Wire.write(value & 0xFF);
  return Wire.endTransmission() == 0;
}

bool readRegister(uint8_t addr, uint8_t reg, int16_t &raw) {
  Wire.beginTransmission(addr);
  Wire.write(reg);
  if (Wire.endTransmission() != 0) return false;
  if (Wire.requestFrom((uint8_t)addr, (uint8_t)2) != 2) return false;
  raw = (Wire.read() << 8) | Wire.read();
  return true;
}

float readChannel(uint8_t addr, uint16_t config) {
  if (!writeRegister(addr, 0x01, config)) return NAN;
  delay(8);
  int16_t raw;
  if (!readRegister(addr, 0x00, raw)) return NAN;
  return raw * 0.1875 / 1000.0;
}

// ================= AT COMMANDS =================
void sendCmd(const char* cmd, int wait = 2000) {
  Serial1.print(cmd);
  Serial1.print("\r\n");
  delay(wait);
}

// ================= OLED DISPLAY =================
void updateOLED(float v1, float v2, float v3, float t1, float t2, float t3, 
                float i, float env, float p) {
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
    display.print(i, 1);
    display.println(" A");
    display.setTextSize(1);
    display.println("");
    
    // Check manual charging configuration
    if (CHARGING_MODE == 1) {
      display.println("CHARGING");
    } else if (i < -0.5) {
      display.println("CHARGING");
    } else if (i > 0.5) {
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
    display.print("Press: "); display.print(p, 0); display.println(" hPa");
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
  else {
    // Page 5: Fault Status
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
  if (oledPage > 4) oledPage = 0;
}

// ================= STARTUP LED TEST =================
void startupLEDTest() {
  Serial.println("\n=== STARTUP LED TEST ===");
  
  // Test all LEDs 3 times
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

// ================= CHECK FAULTS =================
void checkFaults(float v1, float v2, float v3, float t1, float t2, float t3, float current) {
  // Check if fault simulation is enabled (manual configuration)
  if (FAULT_SIM_MODE == 1) {
    // Fault simulation mode active
    if (!faultSimMode) {
      faultSimMode = true;
      simulatedFaultIndex = 0;
      lastAutoFault = millis();
      Serial.println("🔄 FAULT SIMULATION ENABLED (FAULT_SIM_MODE = 1)");
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
      
      // Beep alarm for each fault simulation change
      if (simulatedFaultIndex != 0) {  // Don't beep for NORMAL (F00)
        Serial.println("🚨 ALARM: Fault simulation changed!");
        for (int i = 0; i < 2; i++) {
          digitalWrite(BUZZER_PIN, HIGH);
          delay(150);
          digitalWrite(BUZZER_PIN, LOW);
          delay(150);
        }
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
    // FAULT_SIM_MODE = 0 - disable simulation and use real fault detection
    if (faultSimMode) {
      faultSimMode = false;
      simulatedFaultIndex = 0;
      Serial.println("🔄 FAULT SIMULATION DISABLED (FAULT_SIM_MODE = 0)");
    }
    
    // Real fault detection
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
    
    // Check overcurrent (DISABLED - using GPIO-based current values only)
    /*
    if (abs(current) > CURRENT_MAX) {
      faultActive = true;
      if (faultReason.length() > 0) faultReason += "+";
      faultReason += "OVERCURR";
      faultCode = "F03";
      Serial.println("⚠️ FAULT: Overcurrent detected!");
    }
    */
    
    // Check cell imbalance
    float maxV = max(v1, max(v2, v3));
    float minV = min(v1, min(v2, v3));
    if ((maxV - minV) > 0.3) {
      faultActive = true;
      if (faultReason.length() > 0) faultReason += "+";
      faultReason += "IMBALANCE";
      faultCode = "F05";
      Serial.println("⚠️ FAULT: Cell imbalance detected!");
    }
  }
  
  // Control fault LED
  digitalWrite(LED_FAULT, faultActive ? HIGH : LOW);
  
  // Control relay (OFF when fault)
  digitalWrite(RELAY_PIN, faultActive ? HIGH : LOW);
  
  // Sound alarm on new fault
  if (faultActive && !prevFaultState) {
    Serial.print("🚨 ALARM TRIGGERED! Fault Code: ");
    Serial.println(faultCode);
    for (int i = 0; i < 3; i++) {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(200);
      digitalWrite(BUZZER_PIN, LOW);
      delay(200);
    }
  }
  
  prevFaultState = faultActive;
}

// ================= UPDATE STATUS LEDS =================
void updateStatusLEDs(float current, bool hwCharging, bool fault) {
  // FAULT LED - Always reflects fault status
  digitalWrite(LED_FAULT, fault ? HIGH : LOW);
  
  // CHARGING LED - ON when charging (independent of other LEDs)
  if (hwCharging || CHARGING_MODE == 1 || current < -0.5) {
    digitalWrite(LED_CHARGING, HIGH);
  } else {
    digitalWrite(LED_CHARGING, LOW);
  }
  
  // DISCHARGE LED - ON when motor load is active (independent of other LEDs)
  if (MOTOR_LOAD_MODE == 1 || current > 0.5) {
    digitalWrite(LED_DISCHARGING, HIGH);
  } else {
    digitalWrite(LED_DISCHARGING, LOW);
  }
}

// ================= CONFIGURATION MENU =================
void configurationMenu() {
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║   CONFIGURATION MENU              ║");
  Serial.println("╚════════════════════════════════════╝\n");
  
  // WiFi Enable
  Serial.println("1. WIFI MODE:");
  Serial.println("   0 = Disabled (No network, no reboot issues)");
  Serial.println("   1 = Enabled (Send data to server)");
  Serial.print("   Enter (0 or 1): ");
  while (!Serial.available()) { delay(100); }
  char ch0 = Serial.read();
  wifiEnabled = (ch0 == '1');
  Serial.println(wifiEnabled ? "1" : "0");
  while (Serial.available()) Serial.read(); // Clear buffer
  delay(500);
  
  // Charging Mode
  Serial.println("\n2. CHARGING MODE:");
  Serial.println("   0 = Not Charging (NCR)");
  Serial.println("   1 = Charging (CRG, -2.0A)");
  Serial.print("   Enter (0 or 1): ");
  while (!Serial.available()) { delay(100); }
  char ch1 = Serial.read();
  CHARGING_MODE = (ch1 == '1') ? 1 : 0;
  Serial.println(CHARGING_MODE);
  while (Serial.available()) Serial.read(); // Clear buffer
  delay(500);
  
  // Motor Load Mode
  Serial.println("\n3. MOTOR LOAD MODE:");
  Serial.println("   0 = No Load (NLD, 0.25A)");
  Serial.println("   1 = Motor Load (MTL, 1.0-1.5A)");
  Serial.print("   Enter (0 or 1): ");
  while (!Serial.available()) { delay(100); }
  char ch2 = Serial.read();
  MOTOR_LOAD_MODE = (ch2 == '1') ? 1 : 0;
  Serial.println(MOTOR_LOAD_MODE);
  while (Serial.available()) Serial.read(); // Clear buffer
  delay(500);
  
  // Fault Simulation Mode
  Serial.println("\n4. FAULT SIMULATION MODE:");
  Serial.println("   0 = Disabled (Real faults only)");
  Serial.println("   1 = Enabled (Cycle F00-F09)");
  Serial.print("   Enter (0 or 1): ");
  while (!Serial.available()) { delay(100); }
  char ch3 = Serial.read();
  FAULT_SIM_MODE = (ch3 == '1') ? 1 : 0;
  Serial.println(FAULT_SIM_MODE);
  while (Serial.available()) Serial.read(); // Clear buffer
  delay(500);
  
  // Summary
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║   CONFIGURATION COMPLETE          ║");
  Serial.println("╚════════════════════════════════════╝");
  Serial.print("  • WIFI: "); 
  Serial.println(wifiEnabled ? "ENABLED" : "DISABLED");
  Serial.print("  • CHARGING_MODE: "); 
  Serial.println(CHARGING_MODE ? "1 (CRG)" : "0 (NCR)");
  Serial.print("  • MOTOR_LOAD_MODE: "); 
  Serial.println(MOTOR_LOAD_MODE ? "1 (MTL)" : "0 (NLD)");
  Serial.print("  • FAULT_SIM_MODE: "); 
  Serial.println(FAULT_SIM_MODE ? "1 (Enabled)" : "0 (Disabled)");
  Serial.println();
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  Serial1.begin(115200);
  Wire.begin();
  
  // Configure pins
  pinMode(LED_CHARGING, OUTPUT);
  pinMode(LED_DISCHARGING, OUTPUT);
  pinMode(LED_FAULT, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Initial state: Relay ON (LOW = ON for relay module)
  digitalWrite(RELAY_PIN, LOW);
  
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║   EVOLVE.3X BMS - MANUAL MODE     ║");
  Serial.println("║  Interactive Configuration        ║");
  Serial.println("╚════════════════════════════════════╝\n");
  
  // Wait a moment for serial monitor to open
  delay(2000);
  
  // Interactive configuration menu
  configurationMenu();
  
  // Startup LED test
  startupLEDTest();
  
  // Initialize OLED
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    oledOK = true;
    Serial.println("✓ OLED initialized");
    
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
  } else {
    Serial.println("✗ OLED not found");
  }
  
  // Initialize BMP280
  if (bmp.begin(0x76)) {
    Serial.println("✓ BMP280 initialized");
  } else {
    Serial.println("✗ BMP280 not found");
  }
  
  // WiFi initialization (simplified to prevent resets)
  if (wifiEnabled) {
    Serial.println("\n📡 Initializing WiFi...");
    
    // Minimal WiFi setup with very short delays
    Serial1.print("AT\r\n");
    delay(300);
    while (Serial1.available()) Serial1.read();
    
    Serial1.print("ATE0\r\n");
    delay(300);
    while (Serial1.available()) Serial1.read();
    
    Serial1.print("AT+CWMODE=1\r\n");
    delay(300);
    while (Serial1.available()) Serial1.read();
    
    char cmd[100];
    sprintf(cmd, "AT+CWJAP=\"%s\",\"%s\"\r\n", ssid, pass);
    Serial1.print(cmd);
    
    // Short wait - don't block for connection
    delay(3000);
    while (Serial1.available()) Serial1.read();
    
    Serial.println("✓ WiFi initialization sent (connecting in background)");
  } else {
    Serial.println("\n⚠ WiFi disabled - running in offline mode");
  }
  Serial.println("\n🚀 System ready - Monitoring started\n");
  Serial.println("Manual Configuration:");
  Serial.print("  • CHARGING_MODE: "); Serial.println(CHARGING_MODE ? "1 (CRG)" : "0 (NCR)");
  Serial.print("  • MOTOR_LOAD_MODE: "); Serial.println(MOTOR_LOAD_MODE ? "1 (MTL)" : "0 (NLD)");
  Serial.print("  • FAULT_SIM_MODE: "); Serial.println(FAULT_SIM_MODE ? "1 (Enabled)" : "0 (Disabled)");
  Serial.println("\nCurrent Values:");
  Serial.println("  • NLD (No Load): 0.25A");
  Serial.println("  • MTL (Motor Load): 1.0-1.5A (random)");
  Serial.println("  • CRG (Charging): -2.0A");
  Serial.println("\nChange values in code and re-upload to modify behavior");
  Serial.println("\nThresholds:");
  Serial.print("  Temperature: < "); Serial.print(TEMP_MAX); Serial.println("°C");
  Serial.print("  Voltage: < "); Serial.print(VOLT_MAX); Serial.println("V");
  Serial.print("  Current: ±"); Serial.print(CURRENT_MAX); Serial.println("A\n");
}

// ================= LOOP =================
void loop() {
  // ===== READ SENSORS =====
  float T1 = readChannel(ADS_TEMP, 0xC183) * 100.0;
  float T2 = readChannel(ADS_TEMP, 0xD183) * 100.0;
  float T3 = readChannel(ADS_TEMP, 0xE183) * 100.0;
  
  if (isnan(T1)) T1 = 25.0;
  if (isnan(T2)) T2 = 25.0;
  if (isnan(T3)) T3 = 25.0;
  
  float VB1 = readChannel(ADS_VOLT, 0xC183) * scaling;
  float VB2 = readChannel(ADS_VOLT, 0xD183) * scaling;
  float VB3 = readChannel(ADS_VOLT, 0xE183) * scaling;
  
  if (isnan(VB1)) VB1 = 0.0;
  if (isnan(VB2)) VB2 = 0.0;
  if (isnan(VB3)) VB3 = 0.0;
  
  // Current sensor reading (kept for future use, not currently used)
  float vACS = readChannel(ADS_VOLT, 0xF183);
  (void)vACS;  // Suppress unused variable warning
  float current = 0.0;
  
  // Use manual configuration instead of GPIO pins
  bool hwCharging = (CHARGING_MODE == 1);
  bool motorLoad = (MOTOR_LOAD_MODE == 1);
  
  // Set current based on manual configuration
  if (hwCharging) {
    // Charging: -2.0A (negative for charging)
    current = -2.0;
  } else if (motorLoad) {
    // Motor load: 1.0-1.5A (random)
    current = 1.0 + (random(0, 51) / 100.0);  // Random between 1.0 and 1.5
  } else {
    // No load: 0.25A
    current = 0.25;
  }
  
  float envTemp = bmp.readTemperature();
  float pressure = bmp.readPressure() / 100.0;
  
  if (isnan(envTemp)) envTemp = 25.0;
  if (isnan(pressure)) pressure = 1013.0;
  
  // ===== CHECK FAULTS =====
  checkFaults(VB1, VB2, VB3, T1, T2, T3, current);
  
  // ===== UPDATE STATUS LEDS =====
  updateStatusLEDs(current, hwCharging, faultActive);
  
  // ===== UPDATE OLED =====
  updateOLED(VB1, VB2, VB3, T1, T2, T3, current, envTemp, pressure);
  
  // Determine status codes for server
  String chargingStatus = hwCharging ? "CRG" : "NCR";  // CRG = Charging, NCR = Not Charging
  String loadStatus = motorLoad ? "MTL" : "NLD";        // MTL = Motor Load, NLD = No Load
  
  // ===== PRINT STATUS =====
  Serial.print("V:["); Serial.print(VB1, 2); Serial.print(",");
  Serial.print(VB2, 2); Serial.print(","); Serial.print(VB3, 2); Serial.print("] ");
  
  Serial.print("T:["); Serial.print(T1, 1); Serial.print(",");
  Serial.print(T2, 1); Serial.print(","); Serial.print(T3, 1); Serial.print("] ");
  
  Serial.print("I:"); Serial.print(current, 2); Serial.print("A ");
  
  // Status codes
  Serial.print("["); Serial.print(chargingStatus); Serial.print("] ");
  Serial.print("["); Serial.print(loadStatus); Serial.print("] ");
  
  // Charging status
  if (hwCharging) {
    Serial.print("�HIW_CHARGING ");
  } else if (current < -0.5) {
    Serial.print("⚡CHARGING ");
  } else if (current > 0.5) {
    Serial.print("🔋DISCHARGING ");
  } else {
    Serial.print("💤IDLE ");
  }
  
  // Motor load status
  if (motorLoad) {
    Serial.print("⚙️MOTOR_LOAD ");
  }
  
  // Fault status
  if (faultActive) {
    Serial.print("�AFAULT:");
    Serial.print(faultCode);
    Serial.print(":");
    Serial.print(faultReason);
  } else {
    Serial.print("✓OK");
  }
  Serial.println();
  
  // ===== SEND DATA TO SERVER =====
  if (wifiEnabled) {
    char json[400];
    sprintf(json,
      "{\"v\":[%.2f,%.2f,%.2f],\"t\":[%.1f,%.1f,%.1f],"
      "\"i\":%.2f,\"env\":{\"temp\":%.1f,\"pressure\":%.1f},"
      "\"envTemp\":%.1f,\"pressure\":%.1f,"
      "\"fault\":%s,\"faultReason\":\"%s\",\"faultCode\":\"%s\","
      "\"charging\":%s,\"discharging\":%s,"
      "\"hwCharging\":%s,"
      "\"chargingStatus\":\"%s\",\"loadStatus\":\"%s\",\"motorLoad\":%s}",
      VB1, VB2, VB3,
      T1, T2, T3,
      current,
      envTemp, pressure,
      envTemp, pressure,
      faultActive ? "true" : "false",
      faultReason.c_str(),
      faultCode.c_str(),
      (hwCharging || current < -0.5) ? "true" : "false",
      (current > 0.5) ? "true" : "false",
      hwCharging ? "true" : "false",
      chargingStatus.c_str(),
      loadStatus.c_str(),
      motorLoad ? "true" : "false");
    
    // Optimized sending with minimal delays
    char cmd[120];
    sprintf(cmd, "AT+CIPSTART=\"TCP\",\"%s\",%d", host, port);
    
    Serial1.print(cmd);
    Serial1.print("\r\n");
    delay(800);  // Reduced delay
    
    // Clear any responses
    while (Serial1.available()) Serial1.read();
    
    char fullRequest[650];
    sprintf(fullRequest,
      "POST /data HTTP/1.1\r\n"
      "Host: %s\r\n"
      "Content-Type: application/json\r\n"
      "Content-Length: %d\r\n"
      "Connection: close\r\n\r\n"
      "%s",
      host, strlen(json), json);
    
    Serial1.print("AT+CIPSEND=");
    Serial1.print(strlen(fullRequest));
    Serial1.print("\r\n");
    delay(400);  // Reduced delay
    
    // Clear buffer
    while (Serial1.available()) Serial1.read();
    
    Serial1.print(fullRequest);
    delay(400);  // Reduced delay
    
    // Close connection
    Serial1.print("AT+CIPCLOSE\r\n");
    delay(200);  // Reduced delay
    
    // Clear any remaining data
    while (Serial1.available()) Serial1.read();
    
    Serial.println("📤 Data sent\n");
  }
  
  delay(3000);
}
