# config.py

# API Configuration
BACKEND_API_URL = "http://localhost:3001/api"

# Timing
TICK_INTERVAL_SECONDS = 2
ANOMALY_INTERVAL_SECONDS = 45  # between 30 and 60 seconds average

# Tank Initialization Baselines
TANK_BASELINE = {
    "waterLevel": 78.0,
    "ph": 7.2,
    "tds": 420.0,
    "temperature": 24.0
}

CENTRAL_TANK_BASELINE = {
    "waterLevel": 88.0,
    "ph": 7.1,
    "tds": 450.0,
    "temperature": 23.5
}
