import math
import random
import datetime
import config

# Global state dictionary to store physics simulation parameters
tank_state = {}

def get_consumption_multiplier():
    """Returns a multiplier based on the current hour of the day."""
    hour = datetime.datetime.now().hour
    if 6 <= hour <= 9:
        return 1.8
    elif 12 <= hour <= 16:
        return 0.6
    elif 18 <= hour <= 22:
        return 1.5
    else: # night
        return 0.2

def get_base_temperature():
    """Calculates temperature using a sine wave based on time of day (coolest at 4 AM, hottest at 4 PM)."""
    now = datetime.datetime.now()
    # Convert hour to a value between 0 and 2*pi. 
    # Shifted so that min is at 4 (night) and max is at 16 (afternoon).
    hour_float = now.hour + now.minute / 60.0
    # Peak at 16:00, trough at 4:00 -> period is 24 hours.
    # sin( (hour - 10) / 24 * 2pi ) gives peak at 16 and trough at 4.
    sin_val = math.sin((hour_float - 10) * (2 * math.pi / 24))
    
    # Base temp around 26, oscillates by 5 degrees (21 to 31)
    base = 26.0 + (sin_val * 5.0)
    return base

def initialize_network(nodes):
    """Initializes the volumetric state for all tanks."""
    for node in nodes:
        if node['nodeType'] in ['tank', 'central_tank']:
            node_id = node['id']
            if node_id not in tank_state:
                is_central = node['nodeType'] == 'central_tank'
                # Setup volumetric capacities
                capacity = 10000.0 if is_central else 1000.0
                baseline = config.CENTRAL_TANK_BASELINE if is_central else config.TANK_BASELINE
                
                # Start at the baseline percentage
                current_vol = capacity * (baseline["waterLevel"] / 100.0)
                
                tank_state[node_id] = {
                    "capacity": capacity,
                    "current": current_vol,
                    "ph": baseline["ph"] + random.uniform(-0.1, 0.1),
                    "tds": baseline["tds"] + random.uniform(-10, 10),
                    # Temperature is strictly calculated, but keep a tiny jitter
                    "temperature_jitter": random.uniform(-0.2, 0.2)
                }

def simulate_pump(node):
    if node['status'] == 'Offline':
        return False
    return True

def calculate_physics_tick(nodes, pump_is_on):
    """
    Executes one tick of the causal hydraulic physics engine.
    Pump -> Central -> Branch
    """
    initialize_network(nodes)
    
    # 1. Identify Central and Branch Tanks
    central_node = next((n for n in nodes if n['nodeType'] == 'central_tank'), None)
    branch_nodes = [n for n in nodes if n['nodeType'] == 'tank']
    
    multiplier = get_consumption_multiplier()
    pump_inflow = 20.0 if pump_is_on else 0.0
    
    # We need to process branch tanks first to see how much they take from central
    total_requested_from_central = 0.0
    branch_transfers = {}
    
    for branch in branch_nodes:
        if branch['status'] == 'Offline':
            continue
            
        b_state = tank_state[branch['id']]
        
        # Branch tank consumes water
        consumption = random.uniform(1.0, 2.0) * multiplier
        b_state["current"] -= consumption
        
        # If branch is below 95% capacity, it requests water from central
        target_vol = b_state["capacity"] * 0.95
        if b_state["current"] < target_vol:
            # Transfer up to 2.5 L/tick
            requested = min(2.5, target_vol - b_state["current"])
            branch_transfers[branch['id']] = requested
            total_requested_from_central += requested
            
    # Now process Central Tank
    if central_node and central_node['status'] != 'Offline':
        c_state = tank_state[central_node['id']]
        
        # Add pump inflow
        c_state["current"] += pump_inflow
        
        # Fulfill branch requests
        # If central doesn't have enough, it distributes what it has proportionally (or just runs empty)
        if c_state["current"] >= total_requested_from_central:
            c_state["current"] -= total_requested_from_central
            # Grant all requests
            for bid, amount in branch_transfers.items():
                tank_state[bid]["current"] += amount
        else:
            # Central is almost empty, give whatever is left proportionally
            available = max(0.0, c_state["current"])
            c_state["current"] -= available
            if total_requested_from_central > 0:
                for bid, amount in branch_transfers.items():
                    granted = available * (amount / total_requested_from_central)
                    tank_state[bid]["current"] += granted
                    
        # Cap central capacity
        if c_state["current"] > c_state["capacity"]:
            c_state["current"] = c_state["capacity"]
            
    # Cap branch capacities and prevent negative
    for n in nodes:
        if n['nodeType'] in ['tank', 'central_tank'] and n['id'] in tank_state:
            state = tank_state[n['id']]
            state["current"] = max(0.0, min(state["capacity"], state["current"]))
            
            # Sensory Drift Physics
            state["ph"] += random.uniform(-0.02, 0.02)
            state["ph"] = max(6.8, min(7.6, state["ph"]))
            
            state["tds"] += random.uniform(-2.0, 2.0)
            state["tds"] = max(250.0, min(500.0, state["tds"]))
            
            # Base temperature + specific tank jitter
            target_temp = get_base_temperature() + state["temperature_jitter"]
            # To avoid sudden jumps, we don't assign it instantly but it's sin wave so it's smooth anyway.
            state["temperature"] = target_temp

def get_telemetry_payload(node):
    if node['status'] == 'Offline' or node['nodeType'] not in ['tank', 'central_tank']:
        return None
        
    node_id = node['id']
    if node_id not in tank_state:
        return None
        
    state = tank_state[node_id]
    
    # Support sensor failure injection (-999)
    # If the anomaly generator forced -999, don't overwrite it with physics.
    
    water_pct = (state["current"] / state["capacity"]) * 100.0
    
    ph_val = state["ph"] if state.get("ph") == -999 else round(state["ph"], 2)
    tds_val = state["tds"] if state.get("tds") == -999 else round(state["tds"], 2)
    temp_val = state.get("temperature", 24.0)
    temp_val = temp_val if temp_val == -999 else round(temp_val, 2)
    
    return {
        "nodeId": node_id,
        "waterLevel": round(water_pct, 1),
        "ph": ph_val,
        "tds": tds_val,
        "temperature": temp_val
    }
