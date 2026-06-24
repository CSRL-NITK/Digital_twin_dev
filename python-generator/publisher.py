import json
import paho.mqtt.client as mqtt
import config

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, "virtual_sensor_emulator_v2")

try:
    client.connect(config.MQTT_BROKER, config.MQTT_PORT, 60)
    client.loop_start()
    print(f"Connected to MQTT Broker at {config.MQTT_BROKER}:{config.MQTT_PORT}")
except Exception as e:
    print(f"Failed to connect to MQTT broker: {e}")

def publish_payload(node_id, payload):
    """
    Publishes the strictly structured JSON payload to the specific MQTT topic.
    Format: water/star/{node_id}
    """
    node_slug = node_id.lower()
    if "central" in node_slug:
        node_slug = "central"
    elif "pump" in node_slug:
        node_slug = "pump"
    
    topic = f"water/star/{node_slug}"
    
    try:
        client.publish(topic, json.dumps(payload))
        print(f"Published to {topic}: {payload}")
    except Exception as e:
        print(f"Error publishing to topic {topic}: {e}")
