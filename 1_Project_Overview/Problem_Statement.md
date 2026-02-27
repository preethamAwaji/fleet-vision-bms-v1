# Problem Statement

## Theme 2: Fleet-Level Battery Performance Dashboard

### Real EV Battery Problem Being Addressed

Electric vehicle fleet operators face critical challenges in managing battery health and performance across multiple vehicles:

#### 1. Lack of Centralized Visibility
- Fleet operators cannot monitor battery performance across all vehicles from a single location
- Manual inspection of individual vehicles is time-consuming and inefficient
- No real-time insights into battery health degradation patterns
- Difficult to identify which vehicles need immediate attention

#### 2. Reactive Maintenance Approach
- Battery failures occur unexpectedly, causing vehicle downtime
- No predictive alerts for battery degradation
- Maintenance is performed on fixed schedules rather than actual need
- High costs due to emergency repairs and replacements

#### 3. Inefficient Resource Allocation
- Charging infrastructure is not optimally utilized
- No visibility into charging slot availability across the fleet
- Vehicles wait unnecessarily for charging slots
- Poor scheduling leads to operational inefficiencies

#### 4. No Data-Driven Decision Making
- Fleet managers lack historical data for analysis
- Cannot identify usage patterns or optimization opportunities
- Difficult to plan battery replacement budgets
- No comparative analysis between vehicles

#### 5. Safety Risks
- Undetected cell imbalances can lead to thermal runaway
- Temperature anomalies may go unnoticed until critical
- Overcurrent conditions during charging/discharging
- No early warning system for dangerous conditions

### Why This Problem is Critical in Practical EV Systems

#### Cost Impact
- **Battery replacement costs**: 30-40% of total EV cost (₹3-5 lakhs per vehicle)
- **Unexpected failures**: Lead to emergency repairs at 2-3x normal cost
- **Downtime costs**: ₹5,000-10,000 per day per vehicle in lost revenue
- **Inefficient charging**: Wastes 15-20% of energy due to poor management

#### Safety Concerns
- **Thermal runaway**: Can cause fires and explosions
- **Cell failures**: May lead to complete battery pack failure
- **Overcharging**: Reduces battery life and creates safety hazards
- **Imbalanced cells**: Increase risk of catastrophic failure

#### Operational Efficiency
- **Fleet downtime**: Unexpected failures disrupt operations
- **Maintenance scheduling**: Reactive approach increases costs
- **Charging delays**: Poor slot management reduces vehicle availability
- **Resource waste**: Inefficient use of charging infrastructure

#### Scalability Issues
- **Manual monitoring**: Doesn't scale beyond 10-20 vehicles
- **Data silos**: Each vehicle operates independently
- **No fleet-wide insights**: Cannot optimize across the entire fleet
- **Growth limitations**: Adding vehicles increases complexity exponentially

### Our Solution: Fleet Vision BMS

A centralized, cloud-based dashboard that provides:

1. **Multi-Vehicle Data Aggregation**
   - Real-time monitoring of all vehicles from single dashboard
   - Centralized database for historical analysis
   - Fleet-wide performance metrics

2. **Battery Performance Analytics**
   - State of Charge (SOC) tracking for each vehicle
   - State of Health (SOH) prediction using ML models
   - Voltage, temperature, and current monitoring
   - Anomaly detection (9 types) using dual ML models

3. **Comparative Analysis Tools**
   - Compare battery performance across vehicles
   - Identify underperforming batteries
   - Benchmark against fleet averages
   - Trip-by-trip analysis

4. **Intuitive Fleet Management UI**
   - Real-time dashboard with live updates
   - Interactive charts and visualizations
   - Maintenance logs and alerts
   - Charging slot availability management

### Core Objective

**Enable data-driven decisions for cost optimization and preventive maintenance across the entire fleet.**

#### Measurable Goals
- **Reduce unexpected failures** by 80% through predictive maintenance
- **Decrease maintenance costs** by 30% with data-driven scheduling
- **Improve charging efficiency** by 25% with slot management
- **Extend battery life** by 15-20% through optimal usage patterns
- **Minimize downtime** by 50% with proactive alerts

### Implementation Approach

#### 1. Multi-Vehicle Data Aggregation
- VSDSquadron ULTRA-based BMS on each vehicle
- Real-time data transmission every 3 seconds
- Cloud database (SQLite/PostgreSQL) for centralized storage
- RESTful API for data access

#### 2. Battery Performance Analytics
- Voltage monitoring (3-cell Li-ion pack)
- Temperature sensing (3 points per battery)
- Current measurement (bidirectional ±4A)
- GPS tracking for location-aware monitoring
- ML-powered anomaly detection (Random Forest + XGBoost)
- SOC/SOH prediction models

#### 3. Comparative Analysis Tools
- Fleet overview dashboard
- Vehicle-to-vehicle comparison
- Historical trend analysis
- Trip tracking and statistics
- Performance benchmarking

#### 4. Intuitive Fleet Management UI
- React-based web dashboard
- Real-time updates (3-second polling)
- Interactive charts (Recharts library)
- Mobile-responsive design
- Alert notifications
- Maintenance log management

### Expected Impact

#### For Fleet Operators
- Complete visibility into battery health across all vehicles
- Predictive maintenance reduces unexpected failures
- Optimized charging infrastructure utilization
- Data-driven decision making for replacements and upgrades

#### For Drivers
- Confidence in battery reliability
- Real-time battery status on OLED display
- GPS tracking for safety
- Reduced vehicle downtime

#### For Business
- 30% reduction in maintenance costs
- 25% improvement in operational efficiency
- 15-20% extension in battery lifespan
- Better ROI on EV fleet investment

### Technical Innovation

1. **Edge + Cloud Architecture**: Processing distributed between VSDSquadron ULTRA (edge) and cloud server
2. **Dual ML Models**: Random Forest + XGBoost for robust anomaly detection
3. **9-Type Anomaly Classification**: Beyond simple threshold-based detection
4. **GPS Integration**: Location-aware battery monitoring
5. **Real-Time Fleet Dashboard**: Live updates across multiple vehicles
6. **Scalable Design**: Supports 1-100+ vehicles with same architecture

### Conclusion

Fleet Vision BMS addresses the critical need for centralized battery management in EV fleets by providing real-time monitoring, predictive analytics, and data-driven insights. This solution transforms reactive maintenance into proactive fleet management, reducing costs, improving safety, and optimizing operational efficiency.
