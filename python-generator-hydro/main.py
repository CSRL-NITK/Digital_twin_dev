import time
import config
from sensors import calculate_physics_tick, get_payloads
from publisher import publish_payload
from anomalies import inject_anomaly

def main():
    print("Starting Virtual Sensor Network...")
    
    last_anomaly_time = time.time()
    
    while True:
        current_time = time.time()
        
        # Anomaly injection disabled to keep sensor data normal and stable
        # if current_time - last_anomaly_time > 30:
        #     inject_anomaly()
        #     last_anomaly_time = current_time
            
        # 1. Update the state physics
        calculate_physics_tick()
        
        # 2. Get the structured payloads
        payloads = get_payloads()
        
        # 3. Publish to MQTT
        for p in payloads:
            publish_payload(p["nodeId"], p)
            
        # 4. Wait for next tick
        time.sleep(config.TICK_INTERVAL_SECONDS)

if __name__ == "__main__":
    main()
