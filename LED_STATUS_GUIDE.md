# LED Status Indicators - EVOLVE.3X BMS

## LED Configuration

The BMS uses 3 independent LEDs to indicate system status:

### 1. CHARGING LED (Pin 10)
- **ON**: Battery is charging
- **OFF**: Battery is not charging
- **Triggers**:
  - CHARGING_MODE = 1 (manual configuration)
  - Hardware charging detection
  - Current < -0.5A (negative current indicates charging)

### 2. DISCHARGE LED (Pin 11) - Motor Load Indicator
- **ON**: Motor load is active (discharging)
- **OFF**: No motor load
- **Triggers**:
  - MOTOR_LOAD_MODE = 1 (manual configuration)
  - Current > 0.5A (positive current indicates discharging)

### 3. FAULT LED (Pin 12)
- **ON**: Fault detected
- **OFF**: No fault
- **Triggers**:
  - Overvoltage (any cell > 4.2V)
  - Overtemperature (any cell > 40°C)
  - Cell imbalance (voltage difference > 0.3V)
  - Simulated faults (when FAULT_SIM_MODE = 1)

## LED Behavior

**All LEDs operate independently:**
- Charging and Discharge LEDs can be ON at the same time
- Fault LED operates independently of the other two
- Each LED reflects its specific condition

## Example Scenarios

| Scenario | Charging LED | Discharge LED | Fault LED |
|----------|--------------|---------------|-----------|
| Idle (no load, not charging) | OFF | OFF | OFF |
| Charging only | ON | OFF | OFF |
| Motor load only | OFF | ON | OFF |
| Charging + Motor load | ON | ON | OFF |
| Fault (idle) | OFF | OFF | ON |
| Fault while charging | ON | OFF | ON |
| Fault with motor load | OFF | ON | ON |
| Fault + Charging + Load | ON | ON | ON |

## Pin Connections

```
Arduino Pin 10 → CHARGING LED (+ 220Ω resistor) → GND
Arduino Pin 11 → DISCHARGE LED (+ 220Ω resistor) → GND
Arduino Pin 12 → FAULT LED (+ 220Ω resistor) → GND
Arduino Pin 8  → RELAY
Arduino Pin 13 → BUZZER
```

Recommended resistor: 220Ω - 330Ω for standard 5mm LEDs

## Code Implementation

The LED control is handled by the `updateStatusLEDs()` function:

```cpp
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
```

## Testing

1. **Idle**: All LEDs OFF
2. **Set CHARGING_MODE = 1**: CHARGING LED turns ON
3. **Set MOTOR_LOAD_MODE = 1**: DISCHARGE LED turns ON (can be ON with CHARGING LED)
4. **Trigger Fault**: FAULT LED turns ON (other LEDs remain in their states)
5. **Clear Fault**: FAULT LED turns OFF (other LEDs unchanged)
