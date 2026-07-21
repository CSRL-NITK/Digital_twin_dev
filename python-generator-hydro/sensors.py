import random
import config
from datetime import datetime, timezone

tank_state = {}

def initialize_state():
    for node in config.NODES:
        if node["type"] == "tank":
            # Tiers under grow lights
            tank_state[node["id"]] = {
                "ph": 6.2,
                "tds": 700.0,
                "turbidity": 12.0,
                "water_temp": 22.0,
                "air_temp": 24.0,
                "light_intensity": 350.0,
                "status": "healthy"
            }
        elif node["type"] == "central_tank":
            # Central Reservoir (main tank at bottom, covered)
            tank_state[node["id"]] = {
                "ph": 6.2,
                "tds": 700.0,
                "turbidity": 12.0,
                "water_temp": 22.0,
                "air_temp": 24.0,
                "light_intensity": 5.0,
                "status": "healthy"
            }
        elif node["type"] == "pump":
            tank_state[node["id"]] = {
                "status": "healthy"
            }

def calculate_physics_tick():
    """Applies physics tick where tier sensors mirror the main bottom tank (Central Reservoir)."""
    if not tank_state:
        initialize_state()

    # 1. Update the Main Bottom Tank (Central Reservoir) sensor values with drift
    central = tank_state["Central"]
    
    # Drift for pH (Optimal: 6.0 - 6.5)
    central["ph"] += random.uniform(-0.02, 0.02)
    central["ph"] = max(6.0, min(6.5, central["ph"]))

    # Drift for TDS (Optimal: 650 - 750 ppm)
    central["tds"] += random.uniform(-5.0, 5.0)
    central["tds"] = max(650.0, min(750.0, central["tds"]))

    # Drift for Turbidity (Good: <20 NTU)
    central["turbidity"] += random.uniform(-0.5, 0.5)
    central["turbidity"] = max(5.0, min(20.0, central["turbidity"]))

    # Drift for Water Temp (Optimal: 21 - 23°C)
    central["water_temp"] += random.uniform(-0.1, 0.1)
    central["water_temp"] = max(21.0, min(23.0, central["water_temp"]))

    # Drift for Air Temp (Optimal: 22 - 26°C)
    central["air_temp"] += random.uniform(-0.15, 0.15)
    central["air_temp"] = max(22.0, min(26.0, central["air_temp"]))

    # Central reservoir is covered (low light)
    central["light_intensity"] = max(2.0, min(8.0, central["light_intensity"] + random.uniform(-0.5, 0.5)))

    # 2. Update Tiers (T1, T2, T3, T4)
    # Since there are no physical sensors on the tiers, their values mirror the main tank.
    # Light intensity remains high on tiers because of the grow lights above each shelf.
    for node_id in ["T1", "T2", "T3", "T4"]:
        state = tank_state[node_id]
        state["ph"] = central["ph"]
        state["tds"] = central["tds"]
        state["turbidity"] = central["turbidity"]
        state["water_temp"] = central["water_temp"]
        state["air_temp"] = central["air_temp"]
        
        # Grow lights are active above each tier (drifting around 350 lux)
        state["light_intensity"] = max(330.0, min(370.0, state["light_intensity"] + random.uniform(-2.0, 2.0)))

    # Evaluate health statuses
    for state in tank_state.values():
        state["status"] = "healthy"

def get_payloads():
    """Generates the hydroponic flat JSON payload array."""
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
                "ph": round(state["ph"], 2),
                "tds": round(state["tds"], 1),
                "turbidity": round(state["turbidity"], 1),
                "water_temp": round(state["water_temp"], 1),
                "air_temp": round(state["air_temp"], 1),
                "light_intensity": round(state["light_intensity"], 1),
                "status": state["status"]
            })
    return payloads
