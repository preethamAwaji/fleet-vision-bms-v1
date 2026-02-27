/*
 * LED Test Sketch for EVOLVE.3X BMS
 * Tests all 3 LEDs to verify hardware connections
 * 
 * LED Pins:
 * - Pin 10: CHARGING LED
 * - Pin 11: DISCHARGE LED
 * - Pin 12: FAULT LED
 */

// LED Pin Definitions
#define LED_CHARGING 10
#define LED_DISCHARGING 11
#define LED_FAULT 12

void setup() {
  Serial.begin(115200);
  
  // Configure LED pins as outputs
  pinMode(LED_CHARGING, OUTPUT);
  pinMode(LED_DISCHARGING, OUTPUT);
  pinMode(LED_FAULT, OUTPUT);
  
  // Turn all LEDs OFF initially
  digitalWrite(LED_CHARGING, LOW);
  digitalWrite(LED_DISCHARGING, LOW);
  digitalWrite(LED_FAULT, LOW);
  
  Serial.println("\n╔════════════════════════════════════╗");
  Serial.println("║   EVOLVE.3X LED TEST               ║");
  Serial.println("╚════════════════════════════════════╝\n");
  Serial.println("Testing all LEDs...\n");
  
  delay(1000);
}

void loop() {
  // Test 1: All LEDs ON
  Serial.println("Test 1: All LEDs ON");
  digitalWrite(LED_CHARGING, HIGH);
  digitalWrite(LED_DISCHARGING, HIGH);
  digitalWrite(LED_FAULT, HIGH);
  delay(2000);
  
  // Test 2: All LEDs OFF
  Serial.println("Test 2: All LEDs OFF");
  digitalWrite(LED_CHARGING, LOW);
  digitalWrite(LED_DISCHARGING, LOW);
  digitalWrite(LED_FAULT, LOW);
  delay(2000);
  
  // Test 3: CHARGING LED only
  Serial.println("Test 3: CHARGING LED (Pin 10) ON");
  digitalWrite(LED_CHARGING, HIGH);
  digitalWrite(LED_DISCHARGING, LOW);
  digitalWrite(LED_FAULT, LOW);
  delay(2000);
  
  // Test 4: DISCHARGE LED only
  Serial.println("Test 4: DISCHARGE LED (Pin 11) ON");
  digitalWrite(LED_CHARGING, LOW);
  digitalWrite(LED_DISCHARGING, HIGH);
  digitalWrite(LED_FAULT, LOW);
  delay(2000);
  
  // Test 5: FAULT LED only
  Serial.println("Test 5: FAULT LED (Pin 12) ON");
  digitalWrite(LED_CHARGING, LOW);
  digitalWrite(LED_DISCHARGING, LOW);
  digitalWrite(LED_FAULT, HIGH);
  delay(2000);
  
  // Test 6: CHARGING + DISCHARGE (both ON)
  Serial.println("Test 6: CHARGING + DISCHARGE LEDs ON");
  digitalWrite(LED_CHARGING, HIGH);
  digitalWrite(LED_DISCHARGING, HIGH);
  digitalWrite(LED_FAULT, LOW);
  delay(2000);
  
  // Test 7: CHARGING + FAULT (both ON)
  Serial.println("Test 7: CHARGING + FAULT LEDs ON");
  digitalWrite(LED_CHARGING, HIGH);
  digitalWrite(LED_DISCHARGING, LOW);
  digitalWrite(LED_FAULT, HIGH);
  delay(2000);
  
  // Test 8: DISCHARGE + FAULT (both ON)
  Serial.println("Test 8: DISCHARGE + FAULT LEDs ON");
  digitalWrite(LED_CHARGING, LOW);
  digitalWrite(LED_DISCHARGING, HIGH);
  digitalWrite(LED_FAULT, HIGH);
  delay(2000);
  
  // Test 9: Blink all LEDs rapidly
  Serial.println("Test 9: Rapid blink all LEDs");
  for (int i = 0; i < 10; i++) {
    digitalWrite(LED_CHARGING, HIGH);
    digitalWrite(LED_DISCHARGING, HIGH);
    digitalWrite(LED_FAULT, HIGH);
    delay(200);
    digitalWrite(LED_CHARGING, LOW);
    digitalWrite(LED_DISCHARGING, LOW);
    digitalWrite(LED_FAULT, LOW);
    delay(200);
  }
  
  // Test 10: Sequential LED test (one at a time, fast)
  Serial.println("Test 10: Sequential LED test");
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_CHARGING, HIGH);
    delay(300);
    digitalWrite(LED_CHARGING, LOW);
    
    digitalWrite(LED_DISCHARGING, HIGH);
    delay(300);
    digitalWrite(LED_DISCHARGING, LOW);
    
    digitalWrite(LED_FAULT, HIGH);
    delay(300);
    digitalWrite(LED_FAULT, LOW);
  }
  
  Serial.println("\n--- Test cycle complete! Repeating... ---\n");
  delay(2000);
}
