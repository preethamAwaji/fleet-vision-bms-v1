"""
Battery Anomaly Detection Model Training
Detects: Cell temp increase, cell imbalance, overcurrent (charge/discharge), 
         pressure increase, thermal runaway
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import xgboost as xgb
import joblib
from datetime import datetime

# Generate synthetic training data with anomalies
def generate_training_data(n_samples=10000):
    """Generate synthetic BMS data with labeled anomalies"""
    
    np.random.seed(42)
    data = []
    
    for i in range(n_samples):
        # Normal operating conditions (70% of data)
        if i < n_samples * 0.7:
            vb1 = np.random.uniform(3.6, 4.1)
            vb2 = np.random.uniform(3.6, 4.1)
            vb3 = np.random.uniform(3.6, 4.1)
            t1 = np.random.uniform(20, 35)
            t2 = np.random.uniform(20, 35)
            t3 = np.random.uniform(20, 35)
            current = np.random.uniform(-30, 30)
            pressure = np.random.uniform(1000, 1020)
            anomaly = 'NORMAL'
            
        # Cell temperature increase (5%)
        elif i < n_samples * 0.75:
            vb1 = np.random.uniform(3.6, 4.1)
            vb2 = np.random.uniform(3.6, 4.1)
            vb3 = np.random.uniform(3.6, 4.1)
            t1 = np.random.uniform(45, 60)  # High temp
            t2 = np.random.uniform(20, 35)
            t3 = np.random.uniform(20, 35)
            current = np.random.uniform(-30, 30)
            pressure = np.random.uniform(1000, 1020)
            anomaly = 'CELL_TEMP_HIGH'
            
        # Cell imbalance (5%)
        elif i < n_samples * 0.80:
            vb1 = np.random.uniform(3.6, 4.1)
            vb2 = np.random.uniform(3.2, 3.5)  # Low voltage
            vb3 = np.random.uniform(3.9, 4.2)  # High voltage
            t1 = np.random.uniform(20, 35)
            t2 = np.random.uniform(20, 35)
            t3 = np.random.uniform(20, 35)
            current = np.random.uniform(-30, 30)
            pressure = np.random.uniform(1000, 1020)
            anomaly = 'CELL_IMBALANCE'
            
        # Overcharging current (5%)
        elif i < n_samples * 0.85:
            vb1 = np.random.uniform(3.6, 4.1)
            vb2 = np.random.uniform(3.6, 4.1)
            vb3 = np.random.uniform(3.6, 4.1)
            t1 = np.random.uniform(20, 35)
            t2 = np.random.uniform(20, 35)
            t3 = np.random.uniform(20, 35)
            current = np.random.uniform(-50, -35)  # High negative (charging)
            pressure = np.random.uniform(1000, 1020)
            anomaly = 'OVERCHARGE_CURRENT'
            
        # Overdischarging current (5%)
        elif i < n_samples * 0.90:
            vb1 = np.random.uniform(3.6, 4.1)
            vb2 = np.random.uniform(3.6, 4.1)
            vb3 = np.random.uniform(3.6, 4.1)
            t1 = np.random.uniform(20, 35)
            t2 = np.random.uniform(20, 35)
            t3 = np.random.uniform(20, 35)
            current = np.random.uniform(35, 50)  # High positive (discharging)
            pressure = np.random.uniform(1000, 1020)
            anomaly = 'OVERDISCHARGE_CURRENT'
            
        # Pressure increase (5%)
        elif i < n_samples * 0.95:
            vb1 = np.random.uniform(3.6, 4.1)
            vb2 = np.random.uniform(3.6, 4.1)
            vb3 = np.random.uniform(3.6, 4.1)
            t1 = np.random.uniform(20, 35)
            t2 = np.random.uniform(20, 35)
            t3 = np.random.uniform(20, 35)
            current = np.random.uniform(-30, 30)
            pressure = np.random.uniform(1030, 1050)  # High pressure
            anomaly = 'PRESSURE_HIGH'
            
        # Thermal runaway (5%)
        else:
            vb1 = np.random.uniform(3.8, 4.3)
            vb2 = np.random.uniform(3.8, 4.3)
            vb3 = np.random.uniform(3.8, 4.3)
            t1 = np.random.uniform(60, 80)  # Very high temp
            t2 = np.random.uniform(60, 80)
            t3 = np.random.uniform(60, 80)
            current = np.random.uniform(-30, 30)
            pressure = np.random.uniform(1030, 1050)  # High pressure
            anomaly = 'THERMAL_RUNAWAY'
        
        # Calculate features
        cell_imbalance = max(vb1, vb2, vb3) - min(vb1, vb2, vb3)
        avg_temp = (t1 + t2 + t3) / 3
        max_temp = max(t1, t2, t3)
        temp_diff = max_temp - min(t1, t2, t3)
        pack_voltage = vb1 + vb2 + vb3
        
        data.append({
            'vb1': vb1,
            'vb2': vb2,
            'vb3': vb3,
            't1': t1,
            't2': t2,
            't3': t3,
            'current': current,
            'pressure': pressure,
            'cell_imbalance': cell_imbalance,
            'avg_temp': avg_temp,
            'max_temp': max_temp,
            'temp_diff': temp_diff,
            'pack_voltage': pack_voltage,
            'anomaly': anomaly
        })
    
    return pd.DataFrame(data)

# Train Random Forest model
def train_random_forest(X_train, y_train):
    """Train Random Forest classifier"""
    print("Training Random Forest model...")
    
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    rf_model.fit(X_train, y_train)
    return rf_model

# Train XGBoost model
def train_xgboost(X_train, y_train):
    """Train XGBoost classifier"""
    print("Training XGBoost model...")
    
    # Convert labels to numeric
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    y_train_encoded = le.fit_transform(y_train)
    
    xgb_model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1
    )
    
    xgb_model.fit(X_train, y_train_encoded)
    return xgb_model, le

# Main training function
def main():
    print("="*60)
    print("Battery Anomaly Detection - Model Training")
    print("="*60)
    
    # Generate training data
    print("\n1. Generating training data...")
    df = generate_training_data(10000)
    print(f"   Generated {len(df)} samples")
    print(f"\n   Anomaly distribution:")
    print(df['anomaly'].value_counts())
    
    # Prepare features and labels
    feature_columns = ['vb1', 'vb2', 'vb3', 't1', 't2', 't3', 'current', 
                      'pressure', 'cell_imbalance', 'avg_temp', 'max_temp', 
                      'temp_diff', 'pack_voltage']
    
    X = df[feature_columns]
    y = df['anomaly']
    
    # Split data
    print("\n2. Splitting data (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Train Random Forest
    print("\n3. Training Random Forest...")
    rf_model = train_random_forest(X_train, y_train)
    rf_pred = rf_model.predict(X_test)
    rf_accuracy = (rf_pred == y_test).mean()
    print(f"   Random Forest Accuracy: {rf_accuracy:.4f}")
    
    # Train XGBoost
    print("\n4. Training XGBoost...")
    xgb_model, label_encoder = train_xgboost(X_train, y_train)
    xgb_pred_encoded = xgb_model.predict(X_test)
    xgb_pred = label_encoder.inverse_transform(xgb_pred_encoded)
    xgb_accuracy = (xgb_pred == y_test).mean()
    print(f"   XGBoost Accuracy: {xgb_accuracy:.4f}")
    
    # Feature importance (Random Forest)
    print("\n5. Feature Importance (Random Forest):")
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'importance': rf_model.feature_importances_
    }).sort_values('importance', ascending=False)
    print(feature_importance.to_string(index=False))
    
    # Save models
    print("\n6. Saving models...")
    joblib.dump(rf_model, 'anomaly_detector_rf.pkl')
    joblib.dump(xgb_model, 'anomaly_detector_xgb.pkl')
    joblib.dump(label_encoder, 'anomaly_label_encoder.pkl')
    joblib.dump(feature_columns, 'anomaly_features.pkl')
    print("   ✓ Saved: anomaly_detector_rf.pkl")
    print("   ✓ Saved: anomaly_detector_xgb.pkl")
    print("   ✓ Saved: anomaly_label_encoder.pkl")
    print("   ✓ Saved: anomaly_features.pkl")
    
    # Classification report
    print("\n7. Classification Report (Random Forest):")
    print(classification_report(y_test, rf_pred))
    
    print("\n8. Classification Report (XGBoost):")
    print(classification_report(y_test, xgb_pred))
    
    print("\n" + "="*60)
    print("Training Complete!")
    print("="*60)
    print("\nAnomaly Types Detected:")
    print("  1. NORMAL - Normal operation")
    print("  2. CELL_TEMP_HIGH - Cell temperature increase")
    print("  3. CELL_IMBALANCE - Voltage imbalance between cells")
    print("  4. OVERCHARGE_CURRENT - Excessive charging current")
    print("  5. OVERDISCHARGE_CURRENT - Excessive discharging current")
    print("  6. PRESSURE_HIGH - Pressure increase")
    print("  7. THERMAL_RUNAWAY - Critical thermal runaway condition")
    print("="*60)

if __name__ == "__main__":
    main()
