import os

TICK_INTERVAL_SECONDS = 2
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1884))

# Network topology configuration (used to bootstrap state if needed)
NODES = [
    {"id": "T1", "type": "tank"},
    {"id": "T2", "type": "tank"},
    {"id": "T3", "type": "tank"},
    {"id": "T4", "type": "tank"},
    {"id": "Central", "type": "central_tank"},
    {"id": "Pump", "type": "pump"}
]
