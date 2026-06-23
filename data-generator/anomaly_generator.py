import random
from tank_generator import tank_state

def inject_anomaly(node):
    if node['status'] == 'Offline':
        return False
        
    node_id = node['id']
    if node_id not in tank_state:
        return False
        
    state = tank_state[node_id]
    
    # Only allow certain anomalies
    anomaly_type = random.choice([
        "POLLUTION",
        "TANK_LEAK",
        "SENSOR_FAILURE_PH",
        "SENSOR_FAILURE_TEMP"
    ])
    
    print(f"[ANOMALY] Triggering {anomaly_type} for {node['nodeName']}")
    
    if anomaly_type == "POLLUTION":
        state["tds"] = 750.0
    elif anomaly_type == "TANK_LEAK":
        # sudden drop of 50 liters
        state["current"] = max(0.0, state["current"] - 50.0)
    elif anomaly_type == "SENSOR_FAILURE_PH":
        state["ph"] = -999
    elif anomaly_type == "SENSOR_FAILURE_TEMP":
        state["temperature"] = -999
        
    return True
