# api_writer.py
import requests
import config

def insert_db(payload):
    """
    Phase 1: HTTP Post to Express Backend
    The Express backend handles the PostgreSQL insertion and emits the Socket.IO event.
    
    In Phase 2, this function can be modified to publish to MQTT:
    mqtt.publish(f"water/star/{payload['nodeId']}", json.dumps(payload))
    """
    try:
        response = requests.post(f"{config.BACKEND_API_URL}/telemetry", json=payload)
        if response.status_code != 200:
            print(f"Failed to push telemetry. Status: {response.status_code}")
    except Exception as e:
        print(f"Error pushing telemetry to API: {e}")
