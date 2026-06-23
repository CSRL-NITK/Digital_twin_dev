# main.py
import time
import requests
import config
from tank_generator import calculate_physics_tick, get_telemetry_payload, simulate_pump
from anomaly_generator import inject_anomaly
from api_writer import insert_db

def get_nodes():
    try:
        response = requests.get(f"{config.BACKEND_API_URL}/nodes")
        if response.status_code == 200:
            return response.json()
        print(f"Failed to fetch nodes. Status: {response.status_code}")
        return []
    except Exception as e:
        print(f"Error connecting to backend: {e}")
        return []

def main():
    print("Starting Stateful Virtual Sensor Emulator...")
    
    last_anomaly_time = time.time()
    
    while True:
        nodes = get_nodes()
        if not nodes:
            print("No nodes found or backend is down. Retrying...")
            time.sleep(5)
            continue
            
        current_time = time.time()
        
        # Check if we should inject an anomaly
        should_inject_anomaly = False
        if current_time - last_anomaly_time > config.ANOMALY_INTERVAL_SECONDS:
            should_inject_anomaly = True
            last_anomaly_time = current_time
            
        active_tanks = [n for n in nodes if n['nodeType'] in ['tank', 'central_tank'] and n['status'] != 'Offline']
            
        if should_inject_anomaly and len(active_tanks) > 0:
            import random
            target = random.choice(active_tanks)
            inject_anomaly(target)
            
        # Find pump status
        pump_node = next((n for n in nodes if n['nodeType'] == 'pump'), None)
        pump_is_on = pump_node is not None and pump_node['status'] != 'Offline'

        # Execute one tick of the causal hydraulic engine
        calculate_physics_tick(nodes, pump_is_on)

        # Broadcast the results
        for node in nodes:
            if node['nodeType'] == 'pump':
                simulate_pump(node)
            else:
                payload = get_telemetry_payload(node)
                if payload:
                    insert_db(payload)
            
        time.sleep(config.TICK_INTERVAL_SECONDS)

if __name__ == "__main__":
    main()
