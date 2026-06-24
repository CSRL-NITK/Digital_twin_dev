import random
import config
from datetime import datetime, timezone

tank_state = {}

def initialize_state():
    for node in config.NODES:
        if node["type"] in ["tank", "central_tank"]:
            tank_state[node["id"]] = {
                "waterLevel": 75.0 if node["type"] == "tank" else 90.0,
                "ph": 7.2,
                "tds": 430.0,
                "temperature": 24.5,
                "status": "healthy"
            }
        elif node["type"] == "pump":
            tank_state[node["id"]] = {
                "status": "healthy"
            }

def calculate_physics_tick():
    """Applies realistic drift to the sensor values."""
    if not tank_state:
        initialize_state()

    for node_id, state in tank_state.items():
        if "waterLevel" in state:
            # Realistic drift
            state["waterLevel"] += random.uniform(-0.5, 0.5)
            state["waterLevel"] = max(0.0, min(100.0, state["waterLevel"]))

            state["ph"] += random.uniform(-0.03, 0.03)
            state["ph"] = max(0.0, min(14.0, state["ph"]))

            state["tds"] += random.uniform(-5.0, 5.0)
            state["tds"] = max(0.0, state["tds"])

            state["temperature"] += random.uniform(-0.2, 0.2)
            
            # Simple status evaluation
            if state["ph"] < 6.5 or state["ph"] > 8.5 or state["waterLevel"] < 20:
                state["status"] = "warning"
            else:
                state["status"] = "healthy"

def get_payloads():
    """Generates the perfectly structured flat JSON payload array."""
    payloads = []
    now_str = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    
    for node in config.NODES:
        node_id = node["id"]
        state = tank_state.get(node_id)
        if not state:
            continue
            
        if node["type"] == "pump":
            payloads.append({
                "nodeId": node_id,
                "timestamp": now_str,
                "status": state["status"]
            })
        else:
            payloads.append({
                "nodeId": node_id,
                "timestamp": now_str,
                "waterLevel": round(state["waterLevel"], 1),
                "ph": round(state["ph"], 2),
                "tds": round(state["tds"], 1),
                "temperature": round(state["temperature"], 1),
                "status": state["status"]
            })
    return payloads
