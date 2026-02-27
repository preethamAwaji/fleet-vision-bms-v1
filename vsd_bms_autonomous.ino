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
#define LED_CHARGING 8      // Red LED - Charging (current < 0)
#define LED_DISCHARGING 9   // Red LED - Discharging (current > 0)
#define LED_FAULT 10        // Red LED - Fault condition
#define RELAY_PIN 12        // Relay control
#define BUZZER_PIN 13       // Buzzer alarm

// ===== CALIBRATION =====
float scaling = 11.0;  // Accurate voltage scaling factor
float ACS_OFFSET = 2.5;
float ACS_SENS = 0.066;

// ===== THRESHOLDS =====
#define TEMP_MAX 40.0       // °C
#define VOLT_MAX 4.2        // V per cell
#define CURRENT_MAX 30.0    // A (absolute value)

// ===== WIFI =====
const char* ssid = "Redmi 12 5G";
const char* pass = "ikigai77";
const char* host = "10.90.62.25";
const int port = 5000;

// ===== STATE =====
bool faultActive = false;
bool prevFaultState = false;
String faultReason = "";

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
    if (i < -0.5) {
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
  faultActive = false;
  faultReason = "";
  
  // Check overvoltage
  if (v1 > VOLT_MAX || v2 > VOLT_MAX || v3 > VOLT_MAX) {
    faultActive = true;
    faultReason = "OVERVOLT";
    Serial.println("⚠️ FAULT: Overvoltage detected!");
  }
  
  // Check overtemperature
  if (t1 > TEMP_MAX || t2 > TEMP_MAX || t3 > TEMP_MAX) {
    faultActive = true;
    if (faultReason.length() > 0) faultReason += "+";
    faultReason += "OVERTEMP";
    Serial.println("⚠️ FAULT: Overtemperature detected!");
  }
  
  // Check overcurrent (both directions)
  if (abs(current) > CURRENT_MAX) {
    faultActive = true;
    if (faultReason.length() > 0) faultReason += "+";
    faultReason += "OVERCURR";
    Serial.println("⚠️ FAULT: Overcurrent detected!");
  }
  
  // Control fault LED
  digitalWrite(LED_FAULT, faultActive ? HIGH : LOW);
  
  // Control relay (OFF when fault)
  digitalWrite(RELAY_PIN, faultActive ? HIGH : LOW);
  
  // Sound alarm on new fault
  if (faultActive && !prevFaultState) {
    Serial.println("🚨 ALARM TRIGGERED!");
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
void updateStatusLEDs(float current) {
  // LED1: Charging indicator (current < 0)
  if (current < -0.5) {
    digitalWrite(LED_CHARGING, HIGH);
    digitalWrite(LED_DISCHARGING, LOW);
  }
  // LED2: Discharging indicator (current > 0)
  else if (current > 0.5) {
    digitalWrite(LED_CHARGING, LOW);
    digitalWrite(LED_DISCHARGING, HIGH);
  }
  // Idle
  else {
    digitalWrite(LED_CHARGING, LOW);
    digitalWrite(LED_DISCHARGING, LOW);
  }
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
  Serial.println("║   EVOLVE.3X BMS - AUTONOMOUS MODE  ║");
  Serial.println("╚════════════════════════════════════╝\n");
  
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
    
    // Show BMS System
    display.clearDisplay();
    display.setTextSize(2);
    display.setCursor(20, 15);
    display.print("BMS");
    display.setCursor(10, 40);
    display.print("System");
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
  
  // WiFi initialization
  Serial.println("\n📡 Connecting to WiFi...");
  sendCmd("AT");
  sendCmd("ATE0");
  sendCmd("AT+CWMODE=1");
  
  char cmd[100];
  sprintf(cmd, "AT+CWJAP=\"%s\",\"%s\"", ssid, pass);
  sendCmd(cmd, 8000);
  
  Serial.println("✓ WiFi connected");
  Serial.println("\n🚀 System ready - Monitoring started\n");
  Serial.println("Thresholds:");
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
  
  // Current with improved calibration
  float vACS = readChannel(ADS_VOLT, 0xF183);
  float current = 0.0;
  
  if (!isnan(vACS)) {
    float diff = vACS - ACS_OFFSET;
    if (abs(diff) > 0.02) {
      current = diff / ACS_SENS;
      if (current < -50.0) current = -50.0;
      if (current > 50.0) current = 50.0;
    }
  }
  
  float envTemp = bmp.readTemperature();
  float pressure = bmp.readPressure() / 100.0;
  
  if (isnan(envTemp)) envTemp = 25.0;
  if (isnan(pressure)) pressure = 1013.0;
  
  // ===== CHECK FAULTS =====
  checkFaults(VB1, VB2, VB3, T1, T2, T3, current);
  
  // ===== UPDATE STATUS LEDS =====
  updateStatusLEDs(current);
  
  // ===== UPDATE OLED =====
  updateOLED(VB1, VB2, VB3, T1, T2, T3, current, envTemp, pressure);
  
  // ===== PRINT STATUS =====
  Serial.print("V:["); Serial.print(VB1, 2); Serial.print(",");
  Serial.print(VB2, 2); Serial.print(","); Serial.print(VB3, 2); Serial.print("] ");
  
  Serial.print("T:["); Serial.print(T1, 1); Serial.print(",");
  Serial.print(T2, 1); Serial.print(","); Serial.print(T3, 1); Serial.print("] ");
  
  Serial.print("I:"); Serial.print(current, 2); Serial.print("A ");
  
  if (current < -0.5) {
    Serial.print("⚡CHARGING ");
  } else if (current > 0.5) {
    Serial.print("🔋DISCHARGING ");
  } else {
    Serial.print("💤IDLE ");
  }
  
  if (faultActive) {
    Serial.print("🚨FAULT:");
    Serial.print(faultReason);
  } else {
    Serial.print("✓OK");
  }
  Serial.println();
  
  // ===== SEND DATA TO SERVER =====
  char json[350];
  sprintf(json,
    "{\"v\":[%.2f,%.2f,%.2f],\"t\":[%.1f,%.1f,%.1f],"
    "\"i\":%.2f,\"env\":{\"temp\":%.1f,\"pressure\":%.1f},"
    "\"envTemp\":%.1f,\"pressure\":%.1f,"
    "\"fault\":%s,\"faultReason\":\"%s\","
    "\"charging\":%s,\"discharging\":%s}",
    VB1, VB2, VB3,
    T1, T2, T3,
    current,
    envTemp, pressure,
    envTemp, pressure,  // Send separately for clarity
    faultActive ? "true" : "false",
    faultReason.c_str(),
    (current < -0.5) ? "true" : "false",
    (current > 0.5) ? "true" : "false");
  
  // Connect and send
  char cmd[120];
  sprintf(cmd, "AT+CIPSTART=\"TCP\",\"%s\",%d", host, port);
  sendCmd(cmd, 2000);
  
  char fullRequest[600];
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
  delay(1000);
  
  while (Serial1.available()) Serial1.read();
  Serial1.print(fullRequest);
  
  delay(1000);
  sendCmd("AT+CIPCLOSE", 500);
  
  Serial.println("📤 Data sent to server\n");
  
  delay(3000);
}
