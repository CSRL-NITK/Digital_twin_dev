import random
from sensors import tank_state

def inject_anomaly():
    """Randomly injects an anomaly into one of the tanks or the pump."""
    if not tank_state or random.random() > 0.1: # 10% chance per check (if called periodically)
        return
        
    node_id = random.choice(list(tank_state.keys()))
    state = tank_state[node_id]
    
    if "ph" in state:
        anomaly_type = random.choice(["ph_drop", "tds_spike", "temp_spike"])
        
        if anomaly_type == "ph_drop":
            state["ph"] -= 1.5
        elif anomaly_type == "tds_spike":
            state["tds"] += 350.0
        elif anomaly_type == "temp_spike":
            state["water_temp"] += 5.0
            
        print(f"*** ANOMALY INJECTED into {node_id}: {anomaly_type} ***")
    else:
        # It's a pump
        state["status"] = "offline" if state["status"] == "healthy" else "healthy"
        print(f"*** PUMP STATUS FLIPPED to {state['status']} ***")
