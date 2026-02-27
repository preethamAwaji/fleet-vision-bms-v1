from flask import Flask, request, jsonify, render_template_string, send_from_directory, send_file
from flask_cors import CORS
import json
import joblib
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow import keras
import os
import sqlite3
from datetime import datetime, timedelta
import csv
from io import StringIO

app = Flask(__name__, static_folder='frontend_1/Fleet_Intelligence_Platform/dist')
CORS(app)  # Enable CORS for React frontend

# Variable to store command to send to board
current_command = "IDLE"
last_temperature = None
last_bms_data = {}

# Database setup
DB_PATH = 'bms_data.db'
CSV_EXPORT_PATH = 'bms_export.csv'

def init_database():
    """Initialize SQLite database with tables for telemetry and trips"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Telemetry data table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            vehicle_id TEXT DEFAULT 'EV-001',
            v1 REAL, v2 REAL, v3 REAL,
            pack_voltage REAL,
            t1 REAL, t2 REAL, t3 REAL,
            avg_temp REAL,
            current REAL,
            power REAL,
            env_temp REAL,
            pressure REAL,
            soc REAL,
            soh REAL,
            safety TEXT,
            fault INTEGER,
            fault_reason TEXT,
            charging INTEGER,
            discharging INTEGER,
            mode TEXT
        )
    ''')
    
    # Trip history table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id TEXT DEFAULT 'EV-001',
            trip_start TEXT NOT NULL,
            trip_end TEXT,
            start_soc REAL,
            end_soc REAL,
            energy_consumed REAL,
            distance REAL,
            avg_speed REAL,
            max_temp REAL,
            status TEXT DEFAULT 'active'
        )
    ''')
    
    # Charge/Discharge cycles table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cycles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id TEXT DEFAULT 'EV-001',
            timestamp TEXT NOT NULL,
            cycle_type TEXT,
            from_state TEXT,
            to_state TEXT,
            soc REAL,
            voltage REAL,
            current REAL,
            total_cycles REAL
        )
    ''')
    
    # Create indexes for faster queries
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON telemetry(timestamp)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_vehicle ON telemetry(vehicle_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_trip_start ON trips(trip_start)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_cycle_timestamp ON cycles(timestamp)')
    
    conn.commit()
    conn.close()
    print("✓ Database initialized")

# Initialize database on startup
init_database()

# Trip tracking variables
current_trip = None
trip_start_soc = None

# Load SOC/SOH ML model
try:
    ml_model = joblib.load('battery_soc_soh_model.pkl')
    print("✓ SOC/SOH model loaded successfully")
    cycle_counter = 0  # Track battery cycles
    last_current_sign = 0  # Track current direction: -1=charging, +1=discharging, 0=idle
except Exception as e:
    ml_model = None
    print(f"⚠ Could not load SOC/SOH model: {e}")

# Load Battery Safety Classifier
try:
    safety_model = keras.models.load_model('bs/battery_safety_classifier.keras')
    print("✓ Battery Safety Classifier loaded successfully")
except Exception as e:
    safety_model = None
    print(f"⚠ Could not load Safety Classifier: {e}")

# Load Anomaly Detection Models
try:
    anomaly_rf_model = joblib.load('anomaly_detector_rf.pkl')
    anomaly_xgb_model = joblib.load('anomaly_detector_xgb.pkl')
    anomaly_label_encoder = joblib.load('anomaly_label_encoder.pkl')
    anomaly_features = joblib.load('anomaly_features.pkl')
    print("✓ Anomaly Detection models loaded successfully")
except Exception as e:
    anomaly_rf_model = None
    anomaly_xgb_model = None
    anomaly_label_encoder = None
    anomaly_features = None
    print(f"⚠ Could not load Anomaly Detection models: {e}")

# HTML interface for BMS
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>BMS Control Panel</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        h1 { color: #333; }
        .status { padding: 20px; background: white; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .data-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .data-item { background: #e3f2fd; padding: 15px; border-radius: 5px; text-align: center; }
        .data-item strong { display: block; font-size: 24px; color: #1976d2; }
        .fault { background: #ffebee !important; }
        .fault strong { color: #c62828 !important; }
        button { padding: 15px 30px; margin: 10px; font-size: 16px; cursor: pointer; border: none; border-radius: 5px; }
        .test { background: #ff9800; color: white; }
        .protect { background: #4CAF50; color: white; }
        .relay-on { background: #2196F3; color: white; }
        .relay-off { background: #f44336; color: white; }
        .led { background: #9c27b0; color: white; }
        .buzzer { background: #ff5722; color: white; }
        .idle { background: #607d8b; color: white; }
        .mode { font-size: 18px; font-weight: bold; padding: 10px; border-radius: 5px; display: inline-block; }
        .mode-protect { background: #4CAF50; color: white; }
        .mode-test { background: #ff9800; color: white; }
    </style>
</head>
<body>
    <h1>🔋 BMS Control Panel</h1>
    
    <div class="status">
        <h3>System Status</h3>
        <p>Command: <strong>{{ command }}</strong></p>
        <p>Mode: <span class="mode {{ 'mode-protect' if mode == 'PROTECTION' else 'mode-test' }}">{{ mode }}</span></p>
        <p>Fault: <strong style="color: {{ 'red' if fault else 'green' }}">{{ 'YES' if fault else 'NO' }}</strong></p>
    </div>
    
    <div class="status">
        <h3>Battery Voltages</h3>
        <div class="data-grid">
            <div class="data-item {{ 'fault' if v1 > 4.3 else '' }}">
                <div>VB1</div>
                <strong>{{ v1 }} V</strong>
            </div>
            <div class="data-item {{ 'fault' if v2 > 4.3 else '' }}">
                <div>VB2</div>
                <strong>{{ v2 }} V</strong>
            </div>
            <div class="data-item {{ 'fault' if v3 > 4.3 else '' }}">
                <div>VB3</div>
                <strong>{{ v3 }} V</strong>
            </div>
        </div>
    </div>
    
    <div class="status">
        <h3>Temperatures</h3>
        <div class="data-grid">
            <div class="data-item {{ 'fault' if t1 > 60 else '' }}">
                <div>T1</div>
                <strong>{{ t1 }} °C</strong>
            </div>
            <div class="data-item {{ 'fault' if t2 > 60 else '' }}">
                <div>T2</div>
                <strong>{{ t2 }} °C</strong>
            </div>
            <div class="data-item {{ 'fault' if t3 > 60 else '' }}">
                <div>T3</div>
                <strong>{{ t3 }} °C</strong>
            </div>
        </div>
    </div>
    
    <div class="status">
        <h3>Current & Environment</h3>
        <div class="data-grid">
            <div class="data-item {{ 'fault' if current > 10 else '' }}">
                <div>Current</div>
                <strong>{{ current }} A</strong>
            </div>
            <div class="data-item">
                <div>Env Temp</div>
                <strong>{{ env }} °C</strong>
            </div>
        </div>
    </div>
    
    <div class="status">
        <h3>Battery Health (ML Prediction)</h3>
        <div class="data-grid">
            <div class="data-item" style="background: #c8e6c9;">
                <div>SOC (State of Charge)</div>
                <strong>{{ soc }}%</strong>
            </div>
            <div class="data-item" style="background: #b3e5fc;">
                <div>SOH (State of Health)</div>
                <strong>{{ soh }}%</strong>
            </div>
            <div class="data-item" style="background: {% if safety == 'SAFE' %}#c8e6c9{% else %}#ffcdd2{% endif %};">
                <div>Safety Status</div>
                <strong>{{ safety }}</strong>
            </div>
        </div>
    </div>
    
    <div class="status">
        <h3>Control Commands</h3>
        <button class="test" onclick="sendCmd('TEST_ON')">Enable Test Mode</button>
        <button class="protect" onclick="sendCmd('TEST_OFF')">Enable Auto Mode</button>
        <br><br>
        <strong>Test Mode Controls:</strong><br>
        <button class="led" onclick="sendCmd('LED1_ON')">LED1 ON</button>
        <button class="led" onclick="sendCmd('LED1_OFF')">LED1 OFF</button>
        <br>
        <button class="led" onclick="sendCmd('LED2_ON')">LED2 ON</button>
        <button class="led" onclick="sendCmd('LED2_OFF')">LED2 OFF</button>
        <br>
        <button class="led" onclick="sendCmd('LED3_ON')">LED3 ON</button>
        <button class="led" onclick="sendCmd('LED3_OFF')">LED3 OFF</button>
        <br>
        <button class="relay-on" onclick="sendCmd('RELAY_ON')">Relay ON</button>
        <button class="relay-off" onclick="sendCmd('RELAY_OFF')">Relay OFF</button>
        <br>
        <button class="buzzer" onclick="sendCmd('BUZZ_ON')">Buzzer ON</button>
        <button class="buzzer" onclick="sendCmd('BUZZ_OFF')">Buzzer OFF</button>
        <br>
        <button class="idle" onclick="sendCmd('IDLE')">IDLE</button>
    </div>
    
    <script>
        function sendCmd(cmd) {
            fetch('/send_command/' + cmd)
                .then(r => r.json())
                .then(data => {
                    alert('Command sent: ' + cmd);
                    setTimeout(() => location.reload(), 500);
                });
        }
        setInterval(() => location.reload(), 4000);
    </script>
</body>
</html>
"""

@app.route('/bms')
def bms_control():
    """Simple BMS control panel"""
    return render_template_string(HTML_TEMPLATE, 
                                 command=current_command,
                                 mode=last_bms_data.get('mode', 'N/A'),
                                 fault=last_bms_data.get('fault', False),
                                 v1=last_bms_data.get('v1', 0),
                                 v2=last_bms_data.get('v2', 0),
                                 v3=last_bms_data.get('v3', 0),
                                 t1=last_bms_data.get('t1', 0),
                                 t2=last_bms_data.get('t2', 0),
                                 t3=last_bms_data.get('t3', 0),
                                 current=last_bms_data.get('current', 0),
                                 env=last_bms_data.get('env', 0),
                                 soc=last_bms_data.get('soc', 0),
                                 soh=last_bms_data.get('soh', 100),
                                 safety=last_bms_data.get('safety', 'UNKNOWN'))

def save_telemetry_to_db(data):
    """Save telemetry data to SQLite database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO telemetry (
                timestamp, vehicle_id, v1, v2, v3, pack_voltage,
                t1, t2, t3, avg_temp, current, power,
                env_temp, pressure, soc, soh, safety,
                fault, fault_reason, charging, discharging, mode
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('timestamp'),
            'EV-001',
            data.get('v1'), data.get('v2'), data.get('v3'),
            data.get('v1', 0) + data.get('v2', 0) + data.get('v3', 0),
            data.get('t1'), data.get('t2'), data.get('t3'),
            (data.get('t1', 0) + data.get('t2', 0) + data.get('t3', 0)) / 3,
            data.get('current'),
            (data.get('v1', 0) + data.get('v2', 0) + data.get('v3', 0)) * data.get('current', 0),
            data.get('envTemp'),
            data.get('pressure'),
            data.get('soc'),
            data.get('soh'),
            data.get('safety'),
            1 if data.get('fault') else 0,
            data.get('faultReason'),
            1 if data.get('charging') else 0,
            1 if data.get('discharging') else 0,
            data.get('mode')
        ))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Database save error: {e}")

def log_cycle_transition(from_state, to_state, soc, voltage, current, total_cycles):
    """Log charge/discharge cycle transitions to database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        timestamp = datetime.now().isoformat()
        cycle_type = f"{from_state} → {to_state}"
        
        cursor.execute('''
            INSERT INTO cycles (
                vehicle_id, timestamp, cycle_type, from_state, to_state,
                soc, voltage, current, total_cycles
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'EV-001', timestamp, cycle_type, from_state, to_state,
            soc, voltage, current, total_cycles
        ))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Cycle logging error: {e}")

def detect_anomalies(vb1, vb2, vb3, t1, t2, t3, current, pressure):
    """Detect battery anomalies using ML models and threshold-based detection"""
    if anomaly_rf_model is None or anomaly_xgb_model is None:
        return "UNKNOWN", "UNKNOWN", [], {}
    
    try:
        # Calculate features
        cell_imbalance = max(vb1, vb2, vb3) - min(vb1, vb2, vb3)
        avg_temp = (t1 + t2 + t3) / 3
        max_temp = max(t1, t2, t3)
        temp_diff = max_temp - min(t1, t2, t3)
        pack_voltage = vb1 + vb2 + vb3
        
        # Prepare features
        features = pd.DataFrame([[
            vb1, vb2, vb3, t1, t2, t3, current, pressure,
            cell_imbalance, avg_temp, max_temp, temp_diff, pack_voltage
        ]], columns=anomaly_features)
        
        # Predict with Random Forest
        rf_prediction = anomaly_rf_model.predict(features)[0]
        rf_proba = anomaly_rf_model.predict_proba(features)[0]
        rf_confidence = max(rf_proba)
        
        # Predict with XGBoost
        xgb_prediction_encoded = anomaly_xgb_model.predict(features)[0]
        xgb_prediction = anomaly_label_encoder.inverse_transform([xgb_prediction_encoded])[0]
        xgb_proba = anomaly_xgb_model.predict_proba(features)[0]
        xgb_confidence = max(xgb_proba)
        
        # Get all prediction probabilities for display
        classes = anomaly_rf_model.classes_
        all_predictions = {}
        
        # First, populate with ML model predictions
        for i, class_name in enumerate(classes):
            all_predictions[class_name] = {
                'rf_confidence': float(rf_proba[i]),
                'xgb_confidence': float(xgb_proba[i]) if i < len(xgb_proba) else 0.0
            }
        
        # Ensure ALL possible anomaly types are included (even if not in ML model)
        all_anomaly_types = [
            'NORMAL', 'CELL_IMBALANCE', 'CELL_TEMP_HIGH', 'OVERCHARGE_CURRENT',
            'OVERDISCHARGE_CURRENT', 'PRESSURE_HIGH', 'THERMAL_RUNAWAY',
            'OVERVOLTAGE', 'UNDERVOLTAGE'
        ]
        
        for anomaly_type in all_anomaly_types:
            if anomaly_type not in all_predictions:
                all_predictions[anomaly_type] = {
                    'rf_confidence': 0.0,
                    'xgb_confidence': 0.0
                }
        
        # Collect all detected anomalies
        anomalies = []
        detected_types = set()
        
        # 1. Get ML model predictions (if confidence > 0.25 to catch more anomalies)
        for i, prob in enumerate(rf_proba):
            if prob > 0.25 and classes[i] != 'NORMAL':
                anomaly_type = classes[i]
                if anomaly_type not in detected_types:
                    anomalies.append({
                        'type': anomaly_type,
                        'confidence': float(prob),
                        'severity': 'CRITICAL' if prob > 0.8 else 'HIGH' if prob > 0.6 else 'MEDIUM' if prob > 0.4 else 'LOW',
                        'source': 'ML Model (RF)'
                    })
                    detected_types.add(anomaly_type)
        
        # Also check XGBoost probabilities
        for i, prob in enumerate(xgb_proba):
            if prob > 0.25:
                anomaly_type = anomaly_label_encoder.inverse_transform([i])[0]
                if anomaly_type != 'NORMAL' and anomaly_type not in detected_types:
                    anomalies.append({
                        'type': anomaly_type,
                        'confidence': float(prob),
                        'severity': 'CRITICAL' if prob > 0.8 else 'HIGH' if prob > 0.6 else 'MEDIUM' if prob > 0.4 else 'LOW',
                        'source': 'ML Model (XGB)'
                    })
                    detected_types.add(anomaly_type)
        
        # 2. Threshold-based detection for multiple simultaneous anomalies
        # Adjusted for your system: max current 4A, max temp 40°C
        
        # Cell Temperature High (any cell > 35°C, critical at 40°C)
        if max_temp > 35:
            if 'CELL_TEMP_HIGH' not in detected_types:
                confidence = min((max_temp - 35) / 10, 1.0)  # Scale from 35-45°C
                anomalies.append({
                    'type': 'CELL_TEMP_HIGH',
                    'confidence': float(confidence),
                    'severity': 'CRITICAL' if max_temp >= 40 else 'HIGH' if max_temp > 38 else 'MEDIUM',
                    'source': 'Threshold',
                    'details': f'Max temp: {max_temp:.1f}°C (limit: 40°C)'
                })
                detected_types.add('CELL_TEMP_HIGH')
        
        # Cell Imbalance (voltage difference > 0.2V)
        if cell_imbalance > 0.2:
            if 'CELL_IMBALANCE' not in detected_types:
                confidence = min(cell_imbalance / 0.5, 1.0)  # Scale from 0.2-0.7V
                anomalies.append({
                    'type': 'CELL_IMBALANCE',
                    'confidence': float(confidence),
                    'severity': 'CRITICAL' if cell_imbalance > 0.5 else 'HIGH' if cell_imbalance > 0.35 else 'MEDIUM',
                    'source': 'Threshold',
                    'details': f'Imbalance: {cell_imbalance:.3f}V (limit: 0.2V)'
                })
                detected_types.add('CELL_IMBALANCE')
        
        # Overcharge Current (charging current < -3A, critical at -4A)
        if current < -3:
            if 'OVERCHARGE_CURRENT' not in detected_types:
                confidence = min(abs(current + 3) / 2, 1.0)  # Scale from -3 to -5A
                anomalies.append({
                    'type': 'OVERCHARGE_CURRENT',
                    'confidence': float(confidence),
                    'severity': 'CRITICAL' if current <= -4 else 'HIGH' if current < -3.5 else 'MEDIUM',
                    'source': 'Threshold',
                    'details': f'Current: {current:.2f}A (limit: -4A)'
                })
                detected_types.add('OVERCHARGE_CURRENT')
        
        # Overdischarge Current (discharging current > 3A, critical at 4A)
        if current > 3:
            if 'OVERDISCHARGE_CURRENT' not in detected_types:
                confidence = min((current - 3) / 2, 1.0)  # Scale from 3 to 5A
                anomalies.append({
                    'type': 'OVERDISCHARGE_CURRENT',
                    'confidence': float(confidence),
                    'severity': 'CRITICAL' if current >= 4 else 'HIGH' if current > 3.5 else 'MEDIUM',
                    'source': 'Threshold',
                    'details': f'Current: {current:.2f}A (limit: 4A)'
                })
                detected_types.add('OVERDISCHARGE_CURRENT')
        
        # Pressure High (> 1025 hPa)
        if pressure > 1025:
            if 'PRESSURE_HIGH' not in detected_types:
                confidence = min((pressure - 1025) / 25, 1.0)  # Scale from 1025-1050 hPa
                anomalies.append({
                    'type': 'PRESSURE_HIGH',
                    'confidence': float(confidence),
                    'severity': 'CRITICAL' if pressure > 1040 else 'HIGH' if pressure > 1035 else 'MEDIUM',
                    'source': 'Threshold',
                    'details': f'Pressure: {pressure:.1f}hPa (limit: 1025hPa)'
                })
                detected_types.add('PRESSURE_HIGH')
        
        # Thermal Runaway (temp >= 40°C AND pressure > 1025 hPa)
        if max_temp >= 40 and pressure > 1025:
            if 'THERMAL_RUNAWAY' not in detected_types:
                temp_factor = min((max_temp - 40) / 10, 1.0)
                pressure_factor = min((pressure - 1025) / 25, 1.0)
                confidence = max(temp_factor, pressure_factor)  # Use max instead of average
                anomalies.append({
                    'type': 'THERMAL_RUNAWAY',
                    'confidence': float(confidence),
                    'severity': 'CRITICAL',
                    'source': 'Threshold',
                    'details': f'Temp: {max_temp:.1f}°C, Pressure: {pressure:.1f}hPa'
                })
                detected_types.add('THERMAL_RUNAWAY')
        
        # Overvoltage (any cell > 4.2V)
        max_v = max(vb1, vb2, vb3)
        if max_v > 4.2:
            if 'OVERVOLTAGE' not in detected_types:
                confidence = min((max_v - 4.2) / 0.3, 1.0)  # Scale from 4.2-4.5V
                anomalies.append({
                    'type': 'OVERVOLTAGE',
                    'confidence': float(confidence),
                    'severity': 'CRITICAL' if max_v > 4.4 else 'HIGH' if max_v > 4.3 else 'MEDIUM',
                    'source': 'Threshold',
                    'details': f'Max voltage: {max_v:.2f}V (limit: 4.2V)'
                })
                detected_types.add('OVERVOLTAGE')
        
        # Undervoltage (any cell < 2.8V - Deep Discharge)
        min_v = min(vb1, vb2, vb3)
        if min_v < 2.8:
            if 'UNDERVOLTAGE' not in detected_types:
                confidence = min((2.8 - min_v) / 0.8, 1.0)  # Scale from 2.8-2.0V
                anomalies.append({
                    'type': 'UNDERVOLTAGE',
                    'confidence': float(confidence),
                    'severity': 'CRITICAL' if min_v < 2.3 else 'HIGH' if min_v < 2.5 else 'MEDIUM',
                    'source': 'Threshold',
                    'details': f'Min voltage: {min_v:.2f}V (limit: 2.8V, DoD)'
                })
                detected_types.add('UNDERVOLTAGE')
        
        # Sort anomalies by severity and confidence
        severity_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
        anomalies.sort(key=lambda x: (severity_order.get(x['severity'], 4), -x['confidence']))
        
        print(f"🔍 Detected {len(anomalies)} anomalies: {[a['type'] for a in anomalies]}")
        print(f"📊 all_predictions keys: {list(all_predictions.keys())}")
        print(f"📊 all_predictions count: {len(all_predictions)}")
        
        return rf_prediction, xgb_prediction, anomalies, all_predictions
        
    except Exception as e:
        print(f"Anomaly detection error: {e}")
        import traceback
        traceback.print_exc()
        return "UNKNOWN", "UNKNOWN", [], {}

def manage_trip_tracking(data):
    """Track trips based on discharge/charge cycles"""
    global current_trip, trip_start_soc
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Start a new trip when discharging begins
        if data.get('discharging') and current_trip is None:
            current_trip = datetime.now().isoformat()
            trip_start_soc = data.get('soc', 0)
            
            cursor.execute('''
                INSERT INTO trips (vehicle_id, trip_start, start_soc, status)
                VALUES (?, ?, ?, ?)
            ''', ('EV-001', current_trip, trip_start_soc, 'active'))
            
            conn.commit()
            print(f"🚗 Trip started at {current_trip} with SOC: {trip_start_soc}%")
        
        # End trip when charging begins or vehicle goes idle after discharge
        elif current_trip and (data.get('charging') or (not data.get('discharging') and trip_start_soc)):
            trip_end = datetime.now().isoformat()
            end_soc = data.get('soc', 0)
            energy_consumed = (trip_start_soc - end_soc) * 40.5 / 100  # 40.5 kWh battery
            
            cursor.execute('''
                UPDATE trips 
                SET trip_end = ?, end_soc = ?, energy_consumed = ?, status = 'completed'
                WHERE trip_start = ? AND status = 'active'
            ''', (trip_end, end_soc, energy_consumed, current_trip))
            
            conn.commit()
            print(f"🏁 Trip ended. Energy consumed: {energy_consumed:.2f} kWh")
            
            current_trip = None
            trip_start_soc = None
        
        conn.close()
    except Exception as e:
        print(f"Trip tracking error: {e}")

@app.route('/data', methods=['POST'])
def receive_data():
    global last_temperature, last_bms_data, cycle_counter, last_current_sign
    try:
        raw_data = request.data.decode()
        json_data = json.loads(raw_data)
        
        # Check if it's BMS data
        if 'v' in json_data and 't' in json_data:
            # BMS system data
            # NOTE: Voltage readings are cumulative:
            # v[0] = V1 = Pack voltage (Cell1 + Cell2 + Cell3)
            # v[1] = V2 = Cell2 + Cell3
            # v[2] = V3 = Cell3
            v_raw = json_data.get('v', [0, 0, 0])
            
            # Calculate individual cell voltages
            v1_pack = v_raw[0]  # Pack voltage (Cell1 + Cell2 + Cell3)
            v2_sum = v_raw[1]   # Cell2 + Cell3
            v3_cell = v_raw[2]  # Cell3
            
            # Individual cell voltages
            vb1 = v1_pack - v2_sum      # Cell 1 = Pack - (Cell2+Cell3)
            vb2 = v2_sum - v3_cell      # Cell 2 = (Cell2+Cell3) - Cell3
            vb3 = v3_cell               # Cell 3
            
            # Store both raw and calculated voltages
            v = [vb1, vb2, vb3]  # Individual cell voltages
            pack_voltage = v1_pack  # Total pack voltage
            
            t = json_data.get('t', [0, 0, 0])
            current = json_data.get('i', 0)
            env_data = json_data.get('env', {})
            env = env_data.get('temp', 0) if isinstance(env_data, dict) else env_data
            fault = json_data.get('fault', False)
            mode = json_data.get('mode', 'N/A')
            
            # Use average cell voltage for ML prediction
            avg_cell_voltage = np.mean(v)
            avg_temp = np.mean(t)
            
            # Predict SOC and SOH
            soc = 0
            soh = 100
            safety_status = "UNKNOWN"
            ml_soc = 0  # Store ML prediction for reference
            ml_soh = 100
            
            # SIMPLE VOLTAGE-BASED SOC CALCULATION for custom battery
            # Your battery: 3.0V (0%) to 4.0V (100%)
            # Linear interpolation based on voltage
            def calculate_soc_from_voltage(v):
                """Calculate SOC from voltage for custom battery chemistry"""
                v_min = 3.0  # 0% SOC
                v_max = 4.0  # 100% SOC
                
                # Clip voltage to valid range
                v = np.clip(v, v_min, v_max)
                
                # Linear interpolation
                soc = ((v - v_min) / (v_max - v_min)) * 100
                return soc
            
            # Calculate SOC from voltage (simple and accurate for your battery)
            soc = calculate_soc_from_voltage(avg_cell_voltage)
            
            if ml_model is not None:
                try:
                    # VOLTAGE MAPPING for ML model (kept for SOH prediction)
                    # Your battery: 3.8V per cell = 90% SOC
                    # Standard Li-ion: 4.0V per cell = 90% SOC
                    # Map your voltage to standard voltage for ML model
                    def map_voltage_to_standard(v):
                        """Map custom battery voltage to standard Li-ion voltage"""
                        # Your battery voltage range: 3.0V (0%) to 4.0V (100%)
                        # Standard Li-ion range: 3.0V (0%) to 4.2V (100%)
                        # Linear mapping: v_standard = 3.0 + (v_custom - 3.0) * (4.2 - 3.0) / (4.0 - 3.0)
                        v_min_custom = 3.0  # Your battery empty voltage
                        v_max_custom = 4.0  # Your battery full voltage
                        v_min_standard = 3.0  # Standard empty
                        v_max_standard = 4.2  # Standard full
                        
                        # Clip to valid range
                        v = np.clip(v, v_min_custom, v_max_custom)
                        
                        # Linear mapping
                        v_mapped = v_min_standard + (v - v_min_custom) * (v_max_standard - v_min_standard) / (v_max_custom - v_min_custom)
                        return v_mapped
                    
                    # Map the average cell voltage to standard range
                    mapped_voltage = map_voltage_to_standard(avg_cell_voltage)
                    
                    # Debug logging
                    print(f"   🔋 Voltage-based SOC: {soc:.1f}% (from {avg_cell_voltage:.3f}V)")
                    print(f"   🤖 ML Model Input: mapped={mapped_voltage:.3f}V, current={current:.2f}A, temp={avg_temp:.1f}°C, cycles={cycle_counter:.1f}")
                    
                    # Prepare features: voltage, current, temperature, cycle
                    features = pd.DataFrame([[mapped_voltage, current, avg_temp, cycle_counter]], 
                                           columns=['voltage', 'current', 'temperature', 'cycle'])
                    
                    result = ml_model.predict(features)
                    ml_soc, ml_soh = result[0]
                    
                    # Use ML prediction for SOH only (SOC is voltage-based)
                    soh = ml_soh
                    
                    print(f"   📊 ML Model Output: SOC={ml_soc:.1f}% (not used), SOH={soh:.1f}% (used)")
                    
                    # Clip SOH value (SOC already clipped in voltage calculation)
                    soh = np.clip(soh, 0, 100)
                    
                    # Increment cycle counter only when current sign changes
                    # This tracks actual charge/discharge cycles
                    # NOTE: Negative current = CHARGING, Positive current = DISCHARGING
                    current_sign = 0
                    current_state = "IDLE"
                    if current < -1:  # Charging (negative current, threshold to avoid noise)
                        current_sign = -1
                        current_state = "CHARGING"
                    elif current > 1:  # Discharging (positive current)
                        current_sign = 1
                        current_state = "DISCHARGING"
                    
                    # Detect sign change (cycle transition)
                    if last_current_sign != 0 and current_sign != 0 and last_current_sign != current_sign:
                        cycle_counter += 0.5  # Half cycle (charge or discharge)
                        
                        # Determine transition states
                        from_state = "CHARGING" if last_current_sign == -1 else "DISCHARGING"
                        to_state = current_state
                        
                        # Log cycle transition to database
                        log_cycle_transition(
                            from_state, to_state, 
                            soc, pack_voltage, current, 
                            cycle_counter
                        )
                        
                        print(f"   🔄 Cycle transition: {from_state} → {to_state} | Total cycles: {cycle_counter:.1f}")
                    
                    # Update last sign
                    if current_sign != 0:
                        last_current_sign = current_sign
                    
                except Exception as e:
                    print(f"ML model prediction error: {e}")
                    # SOC already calculated from voltage, just set default SOH
                    soh = 100
            else:
                # ML model not available, SOC already calculated from voltage
                print(f"   🔋 Voltage-based SOC: {soc:.1f}% (from {avg_cell_voltage:.3f}V)")
                print(f"   ⚠️  ML model not loaded - using default SOH=100%")
                soh = 100
            
            # Predict Safety Status using Safety Classifier
            if safety_model is not None:
                try:
                    # Prepare 12 features for safety model
                    avg_voltage = np.mean(v)
                    max_temp = max(t)
                    
                    safety_features = np.array([[
                        v[0], v[1], v[2],  # V1, V2, V3
                        t[0], t[1], t[2],  # T1, T2, T3
                        current,           # Current
                        env,               # Env temp
                        1013,              # Pressure (default)
                        avg_voltage,       # Avg voltage
                        avg_temp,          # Avg temp
                        max_temp           # Max temp
                    ]], dtype=np.float32)
                    
                    safety_pred = safety_model.predict(safety_features, verbose=0)
                    safety_class = np.argmax(safety_pred[0])
                    
                    # Map class to status
                    class_names = ["SAFE", "OVERVOLT", "OVERTEMP", "OVERCURR", "UNDERVOLT", "MULTI_FAULT", "OTHER"]
                    safety_status = class_names[safety_class] if safety_class < len(class_names) else "UNKNOWN"
                    
                except Exception as e:
                    print(f"Safety prediction error: {e}")
                    safety_status = "UNKNOWN"
            
            # Get current timestamp
            from datetime import datetime
            timestamp = datetime.now().isoformat()
            
            # Extract additional autonomous mode fields
            charging = json_data.get('charging', False)
            discharging = json_data.get('discharging', False)
            fault_reason = json_data.get('faultReason', '')
            fault_code = json_data.get('faultCode', 'F00')
            hw_charging = json_data.get('hwCharging', False)
            charging_status = json_data.get('chargingStatus', 'NCR')  # CRG or NCR
            load_status = json_data.get('loadStatus', 'NLD')          # MTL or NLD
            motor_load = json_data.get('motorLoad', False)
            env_temp = json_data.get('envTemp', env)
            pressure_val = json_data.get('pressure', 1013.0)
            
            # Detect anomalies using ML models
            rf_anomaly, xgb_anomaly, detected_anomalies, all_predictions = detect_anomalies(
                v[0], v[1], v[2],  # Cell voltages
                t[0], t[1], t[2],  # Cell temperatures
                current,           # Current
                pressure_val       # Pressure
            )
            
            last_bms_data = {
                'v1': v[0], 'v2': v[1], 'v3': v[2],  # Individual cell voltages (calculated)
                'v1_raw': v_raw[0], 'v2_raw': v_raw[1], 'v3_raw': v_raw[2],  # Raw cumulative readings
                'pack_voltage': pack_voltage,  # Total pack voltage
                't1': t[0], 't2': t[1], 't3': t[2],
                'current': current,
                'env': env,
                'envTemp': env_temp,
                'pressure': pressure_val,
                'fault': fault,
                'faultReason': fault_reason,
                'faultCode': fault_code,
                'hwCharging': hw_charging,
                'chargingStatus': charging_status,  # CRG or NCR
                'loadStatus': load_status,          # MTL or NLD
                'motorLoad': motor_load,
                'charging': charging,
                'discharging': discharging,
                'mode': mode,
                'soc': round(soc, 1),
                'soh': round(soh, 1),
                'safety': safety_status,
                'rf_anomaly': rf_anomaly,
                'xgb_anomaly': xgb_anomaly,
                'anomalies': detected_anomalies,
                'all_predictions': all_predictions,
                'timestamp': timestamp
            }
            
            print(f"🔋 VB1:{v[0]:.2f}V VB2:{v[1]:.2f}V VB3:{v[2]:.2f}V (Pack:{pack_voltage:.2f}V) | 🌡️ T:[{t[0]:.1f}, {t[1]:.1f}, {t[2]:.1f}]°C | ⚡ I:{current:.2f}A")
            print(f"   📊 Raw: V1:{v_raw[0]:.2f}V V2:{v_raw[1]:.2f}V V3:{v_raw[2]:.2f}V")
            
            # Status codes
            status_line = f"   📡 Status: [{charging_status}] [{load_status}]"
            if motor_load:
                status_line += " ⚙️ MOTOR LOAD"
            print(status_line)
            
            # Charging status
            if hw_charging:
                print(f"   🔌 HW CHARGING (GPIO 6 HIGH)")
            elif charging:
                print(f"   ⚡ CHARGING (Current < 0)")
            elif discharging:
                print(f"   🔋 DISCHARGING (Current > 0)")
            else:
                print(f"   💤 IDLE")
            
            print(f"   🌡️ Env:{env_temp:.1f}°C | 📊 P:{pressure_val:.0f}hPa")
            print(f"   📊 SOC:{soc:.1f}% SOH:{soh:.1f}% | 🛡️ Safety:{safety_status} | Cycle:{cycle_counter:.1f}")
            print(f"   🔍 Anomaly: RF={rf_anomaly} XGB={xgb_anomaly}")
            if detected_anomalies:
                for anom in detected_anomalies:
                    print(f"      ⚠️  {anom['type']} (Confidence: {anom['confidence']:.2f}, Severity: {anom['severity']})")
            
            if fault:
                print(f"   🚨 FAULT: {fault_code} - {fault_reason if fault_reason else 'Unknown'}")
            
            print(f"   → Sending: {current_command}")
            
            # Save to database
            save_telemetry_to_db(last_bms_data)
            
            # Track trips
            manage_trip_tracking(last_bms_data)
            
        elif 'VB1' in json_data:
            # Old sensor format
            print(f"📊 Voltages: VB1={json_data.get('VB1')}V, VB2={json_data.get('VB2')}V, VB3={json_data.get('VB3')}V, VB4={json_data.get('VB4')}V")
            print(f"🌡️  Temps: T1={json_data.get('T1')}°C, T2={json_data.get('T2')}°C, T3={json_data.get('T3')}°C")
            last_temperature = json_data.get('T1', 'N/A')
        else:
            # Simple temperature
            temp = json_data.get('temperature', 'N/A')
            last_temperature = temp
            print(f"📊 Temperature: {temp}°C | Command: {current_command}")
        
    except json.JSONDecodeError as e:
        print(f"✗ JSON Parse Error: {e}")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    response = {
        "status": "success",
        "command": current_command,
        "soc": last_bms_data.get('soc', 0),
        "soh": last_bms_data.get('soh', 100),
        "message": f"Data received, sending: {current_command}"
    }
    return jsonify(response)

@app.route('/send_command/<cmd>', methods=['GET'])
def send_command(cmd):
    global current_command
    current_command = cmd
    print(f"🎮 Command changed to: {cmd}")
    return jsonify({"status": "Command set", "command": cmd})

# ===== API ENDPOINTS FOR REACT FRONTEND =====

@app.route('/api/bms/live', methods=['GET'])
def get_live_bms_data():
    """Get current BMS data for React frontend"""
    return jsonify({
        "status": "success",
        "data": last_bms_data,
        "timestamp": last_bms_data.get('timestamp', None)
    })

@app.route('/api/bms/history', methods=['GET'])
def get_bms_history():
    """Get historical BMS data with time range filtering"""
    try:
        # Get query parameters
        hours = request.args.get('hours', default=1, type=int)
        limit = request.args.get('limit', default=1000, type=int)
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Calculate time range
        time_ago = (datetime.now() - timedelta(hours=hours)).isoformat()
        
        cursor.execute('''
            SELECT timestamp, v1, v2, v3, pack_voltage, t1, t2, t3, avg_temp,
                   current, power, env_temp, pressure, soc, soh, safety,
                   fault, charging, discharging
            FROM telemetry
            WHERE timestamp >= ?
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (time_ago, limit))
        
        rows = cursor.fetchall()
        conn.close()
        
        history = []
        for row in rows:
            history.append({
                'timestamp': row[0],
                'voltages': [row[1], row[2], row[3]],
                'packVoltage': row[4],
                'temperatures': [row[5], row[6], row[7]],
                'avgTemp': row[8],
                'current': row[9],
                'power': row[10],
                'envTemp': row[11],
                'pressure': row[12],
                'soc': row[13],
                'soh': row[14],
                'safety': row[15],
                'fault': bool(row[16]),
                'charging': bool(row[17]),
                'discharging': bool(row[18])
            })
        
        return jsonify({
            "status": "success",
            "data": history,
            "count": len(history),
            "timeRange": f"Last {hours} hours"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/trips', methods=['GET'])
def get_trips():
    """Get trip history"""
    try:
        limit = request.args.get('limit', default=50, type=int)
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, vehicle_id, trip_start, trip_end, start_soc, end_soc,
                   energy_consumed, distance, avg_speed, max_temp, status
            FROM trips
            ORDER BY trip_start DESC
            LIMIT ?
        ''', (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        trips = []
        for row in rows:
            trips.append({
                'id': row[0],
                'vehicleId': row[1],
                'tripStart': row[2],
                'tripEnd': row[3],
                'startSoc': row[4],
                'endSoc': row[5],
                'energyConsumed': row[6],
                'distance': row[7],
                'avgSpeed': row[8],
                'maxTemp': row[9],
                'status': row[10]
            })
        
        return jsonify({
            "status": "success",
            "trips": trips,
            "count": len(trips)
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/export/csv', methods=['GET'])
def export_csv():
    """Export telemetry data to CSV"""
    try:
        hours = request.args.get('hours', default=24, type=int)
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        time_ago = (datetime.now() - timedelta(hours=hours)).isoformat()
        
        cursor.execute('''
            SELECT * FROM telemetry
            WHERE timestamp >= ?
            ORDER BY timestamp ASC
        ''', (time_ago,))
        
        rows = cursor.fetchall()
        columns = [description[0] for description in cursor.description]
        conn.close()
        
        # Create CSV in memory
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(columns)
        writer.writerows(rows)
        
        # Save to file
        with open(CSV_EXPORT_PATH, 'w', newline='') as f:
            f.write(output.getvalue())
        
        return send_file(
            CSV_EXPORT_PATH,
            mimetype='text/csv',
            as_attachment=True,
            download_name=f'bms_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get statistical summary of BMS data"""
    try:
        hours = request.args.get('hours', default=24, type=int)
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        time_ago = (datetime.now() - timedelta(hours=hours)).isoformat()
        
        cursor.execute('''
            SELECT 
                COUNT(*) as total_records,
                AVG(soc) as avg_soc,
                AVG(soh) as avg_soh,
                AVG(pack_voltage) as avg_voltage,
                AVG(current) as avg_current,
                AVG(avg_temp) as avg_temp,
                MAX(avg_temp) as max_temp,
                MIN(avg_temp) as min_temp,
                SUM(CASE WHEN fault = 1 THEN 1 ELSE 0 END) as fault_count,
                SUM(CASE WHEN charging = 1 THEN 1 ELSE 0 END) as charging_count,
                SUM(CASE WHEN discharging = 1 THEN 1 ELSE 0 END) as discharging_count
            FROM telemetry
            WHERE timestamp >= ?
        ''', (time_ago,))
        
        row = cursor.fetchone()
        conn.close()
        
        return jsonify({
            "status": "success",
            "stats": {
                "totalRecords": row[0],
                "avgSoc": round(row[1], 2) if row[1] else 0,
                "avgSoh": round(row[2], 2) if row[2] else 0,
                "avgVoltage": round(row[3], 2) if row[3] else 0,
                "avgCurrent": round(row[4], 2) if row[4] else 0,
                "avgTemp": round(row[5], 2) if row[5] else 0,
                "maxTemp": round(row[6], 2) if row[6] else 0,
                "minTemp": round(row[7], 2) if row[7] else 0,
                "faultCount": row[8],
                "chargingCount": row[9],
                "dischargingCount": row[10]
            },
            "timeRange": f"Last {hours} hours"
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/cycles', methods=['GET'])
def get_cycles():
    """Get charge/discharge cycle history"""
    try:
        limit = request.args.get('limit', default=50, type=int)
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, vehicle_id, timestamp, cycle_type, from_state, to_state,
                   soc, voltage, current, total_cycles
            FROM cycles
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        cycles = []
        for row in rows:
            cycles.append({
                'id': row[0],
                'vehicleId': row[1],
                'timestamp': row[2],
                'cycleType': row[3],
                'fromState': row[4],
                'toState': row[5],
                'soc': row[6],
                'voltage': row[7],
                'current': row[8],
                'totalCycles': row[9]
            })
        
        return jsonify({
            "status": "success",
            "cycles": cycles,
            "count": len(cycles)
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/anomalies', methods=['GET'])
def get_anomalies():
    """Get current anomaly detection results"""
    try:
        anomalies_data = {
            "rf_prediction": last_bms_data.get('anomaly_rf', 'UNKNOWN'),
            "xgb_prediction": last_bms_data.get('anomaly_xgb', 'UNKNOWN'),
            "detected_anomalies": last_bms_data.get('anomalies', []),
            "timestamp": last_bms_data.get('timestamp', ''),
            "bms_data": {
                "voltages": [
                    last_bms_data.get('v1', 0),
                    last_bms_data.get('v2', 0),
                    last_bms_data.get('v3', 0)
                ],
                "temperatures": [
                    last_bms_data.get('t1', 0),
                    last_bms_data.get('t2', 0),
                    last_bms_data.get('t3', 0)
                ],
                "current": last_bms_data.get('current', 0),
                "pressure": last_bms_data.get('pressure', 0)
            }
        }
        
        return jsonify({
            "status": "success",
            "data": anomalies_data
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    """Get vehicle list with real BMS data"""
    
    # Calculate derived values from real BMS data
    # Individual cell voltages are already calculated
    pack_voltage = last_bms_data.get('pack_voltage', 0)  # Use stored pack voltage
    
    # Determine status based on real data
    if last_bms_data.get('fault', False):
        status = 'maintenance'
    elif last_bms_data.get('charging', False):
        status = 'charging'
    elif last_bms_data.get('discharging', False):
        status = 'active'
    else:
        status = 'idle'
    
    # Calculate approximate range (SOC * max_range)
    soc = last_bms_data.get('soc', 0)
    max_range = 450  # Tata Nexon EV Max range in km
    current_range = int((soc / 100) * max_range)
    
    vehicles = [
        {
            "id": "EV-001",
            "name": "Tata Nexon EV",
            "model": "Nexon EV Max",
            "vin": "MAT123456789",
            "status": status,
            "batteryLevel": last_bms_data.get('soc', 0),
            "batterySoH": last_bms_data.get('soh', 100),
            "range": current_range,
            "mileage": 12450,
            "driver": "Live BMS Hardware",
            "lastLocation": "Real-time Monitoring",
            "lastUpdated": last_bms_data.get('timestamp', 'Live'),
            "lat": 15.3647,
            "lng": 75.1240,
            "bmsData": {
                "voltages": [
                    last_bms_data.get('v1', 0),
                    last_bms_data.get('v2', 0),
                    last_bms_data.get('v3', 0)
                ],
                "packVoltage": pack_voltage,
                "temperatures": [
                    last_bms_data.get('t1', 0),
                    last_bms_data.get('t2', 0),
                    last_bms_data.get('t3', 0)
                ],
                "current": last_bms_data.get('current', 0),
                "envTemp": last_bms_data.get('envTemp', 0),
                "pressure": last_bms_data.get('pressure', 0),
                "fault": last_bms_data.get('fault', False),
                "faultReason": last_bms_data.get('faultReason', ''),
                "charging": last_bms_data.get('charging', False),
                "discharging": last_bms_data.get('discharging', False),
                "safety": last_bms_data.get('safety', 'UNKNOWN'),
                "soc": last_bms_data.get('soc', 0),
                "soh": last_bms_data.get('soh', 100)
            }
        }
    ]
    return jsonify({"status": "success", "vehicles": vehicles})

@app.route('/api/vehicles/<vehicle_id>', methods=['GET'])
def get_vehicle_detail(vehicle_id):
    """Get detailed vehicle data with real-time BMS information"""
    if vehicle_id == "EV-001":
        # Calculate derived values
        # Individual cell voltages are already calculated
        pack_voltage = last_bms_data.get('pack_voltage', 0)  # Use stored pack voltage
        
        # Determine status
        if last_bms_data.get('fault', False):
            status = 'maintenance'
        elif last_bms_data.get('charging', False):
            status = 'charging'
        elif last_bms_data.get('discharging', False):
            status = 'active'
        else:
            status = 'idle'
        
        # Calculate range
        soc = last_bms_data.get('soc', 0)
        max_range = 450
        current_range = int((soc / 100) * max_range)
        
        # Get anomaly detection results
        anomalies = []
        rf_anomaly = last_bms_data.get('rf_anomaly', 'NORMAL')
        xgb_anomaly = last_bms_data.get('xgb_anomaly', 'NORMAL')
        all_predictions = last_bms_data.get('all_predictions', {})
        
        # Debug: Log all_predictions
        print(f"📊 API Response - all_predictions keys: {list(all_predictions.keys())}")
        print(f"📊 API Response - all_predictions count: {len(all_predictions)}")
        
        # Add RF anomaly if not NORMAL
        if rf_anomaly != 'NORMAL' and 'rf_confidence' in last_bms_data:
            confidence = last_bms_data.get('rf_confidence', 0)
            severity = 'CRITICAL' if confidence > 0.8 else 'HIGH' if confidence > 0.6 else 'MEDIUM' if confidence > 0.4 else 'LOW'
            anomalies.append({
                'type': rf_anomaly,
                'confidence': confidence,
                'severity': severity,
                'model': 'Random Forest'
            })
        
        # Add XGB anomaly if not NORMAL
        if xgb_anomaly != 'NORMAL' and 'xgb_confidence' in last_bms_data:
            confidence = last_bms_data.get('xgb_confidence', 0)
            severity = 'CRITICAL' if confidence > 0.8 else 'HIGH' if confidence > 0.6 else 'MEDIUM' if confidence > 0.4 else 'LOW'
            anomalies.append({
                'type': xgb_anomaly,
                'confidence': confidence,
                'severity': severity,
                'model': 'XGBoost'
            })
        
        return jsonify({
            "status": "success",
            "vehicle": {
                "id": "EV-001",
                "name": "Tata Nexon EV",
                "model": "Nexon EV Max",
                "vin": "MAT123456789",
                "status": status,
                "batteryLevel": soc,
                "batterySoH": last_bms_data.get('soh', 100),
                "range": current_range,
                "mileage": 12450,
                "driver": "Live BMS Hardware",
                "lastLocation": "Real-time Monitoring",
                "lastUpdated": last_bms_data.get('timestamp', 'Live'),
                "bmsData": {
                    "voltages": [
                        last_bms_data.get('v1', 0),
                        last_bms_data.get('v2', 0),
                        last_bms_data.get('v3', 0)
                    ],
                    "packVoltage": pack_voltage,
                    "avgVoltage": (last_bms_data.get('v1', 0) + last_bms_data.get('v2', 0) + last_bms_data.get('v3', 0)) / 3,
                    "temperatures": [
                        last_bms_data.get('t1', 0),
                        last_bms_data.get('t2', 0),
                        last_bms_data.get('t3', 0)
                    ],
                    "avgTemp": (last_bms_data.get('t1', 0) + last_bms_data.get('t2', 0) + last_bms_data.get('t3', 0)) / 3,
                    "maxTemp": max(last_bms_data.get('t1', 0), last_bms_data.get('t2', 0), last_bms_data.get('t3', 0)),
                    "current": last_bms_data.get('current', 0),
                    "envTemp": last_bms_data.get('envTemp', 0),
                    "pressure": last_bms_data.get('pressure', 0),
                    "fault": last_bms_data.get('fault', False),
                    "faultReason": last_bms_data.get('faultReason', ''),
                    "faultCode": last_bms_data.get('faultCode', 'F00'),
                    "charging": last_bms_data.get('charging', False),
                    "discharging": last_bms_data.get('discharging', False),
                    "safety": last_bms_data.get('safety', 'UNKNOWN'),
                    "soc": soc,
                    "soh": last_bms_data.get('soh', 100),
                    "cycles": last_bms_data.get('cycles', 0),
                    "rfAnomaly": rf_anomaly,
                    "xgbAnomaly": xgb_anomaly,
                    "anomalies": anomalies,
                    "allPredictions": last_bms_data.get('all_predictions', {}),
                    "timestamp": last_bms_data.get('timestamp', '')
                }
            }
        })
    return jsonify({"status": "error", "message": "Vehicle not found"}), 404

# ===== SERVE REACT FRONTEND =====

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React frontend"""
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 EVOLVE.3X BMS Server Starting...")
    print("="*60)
    print(f"📊 Simple BMS Control: http://localhost:5000/bms")
    print(f"🌐 React Frontend: http://localhost:5000")
    print(f"🔌 API Endpoints: http://localhost:5000/api/*")
    print(f"📡 Arduino Data Endpoint: http://localhost:5000/data")
    print("="*60 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
