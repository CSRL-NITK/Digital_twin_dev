import time
import random
import psycopg2
import psycopg2.extras
import requests
from datetime import datetime
import datetime as dt
import json

# ==========================================
# AQUATWIN STAR TOPOLOGY - DIRECT DB SIMULATOR
# ==========================================
# Flow: Python Generator -> PostgreSQL (direct) + Backend Webhook (for live Socket.IO)

# ── Config ──────────────────────────────────────────────
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "DT-MAIN",
    "user": "postgres",
    "password": "postgres123",
}

BACKEND_WEBHOOK = "http://localhost:3001/api/telemetry/thingsboard"

# ── Alert Thresholds (mirrors backend alert.service.ts) ──
def evaluate_sensor(sensor_type: str, value: float) -> str:
    if sensor_type == "water_level":
        if value < 15:
            return "Critical"
        if value < 30:
            return "Warning"
        return "Healthy"
    elif sensor_type == "ph":
        if value < 6.5 or value > 8.5:
            return "Warning"
        return "Healthy"
    elif sensor_type == "tds":
        if value > 700:
            return "Warning"
        return "Healthy"
    elif sensor_type == "temperature":
        if value > 35:
            return "Warning"
        return "Healthy"
    return "Healthy"


def worst_status(statuses: list) -> str:
    if "Critical" in statuses:
        return "Critical"
    if "Warning" in statuses:
        return "Warning"
    if "Offline" in statuses:
        return "Offline"
    return "Healthy"


class StarTopologySimulator:
    def __init__(self, topo_id):
        self.conn = None
        self.topology_id = topo_id

        # Node lists (by integer DB id)
        self.central_tanks = []
        self.source_tanks = []
        self.pumps = []
        self.all_tank_ids = []
        self.all_node_ids = []

        # Edges: list of { source, target }
        self.edges = []

        # sensor_map: node_id -> { sensor_type: sensor_id }
        self.sensor_map = {}

        # Live physics state per node
        self.state = {}

    # ── DB Connection ──────────────────────────────────
    def connect_db(self):
        print("Connecting to PostgreSQL...")
        self.conn = psycopg2.connect(**DB_CONFIG)
        self.conn.autocommit = True
        print("Connected!")

    # ── Load Topology ──────────────────────────────────
    def load_topology(self):
        cur = self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("SELECT id, name FROM topologies WHERE id = %s LIMIT 1", (self.topology_id,))
        row = cur.fetchone()
        if not row:
            print(f"ERROR: Topology with ID {self.topology_id} not found in DB.")
            return False
            
        print(f"Found Topology: {row['name']} (id={self.topology_id})")

        cur.execute(
            "SELECT id, node_name, node_type, status, attributes FROM nodes WHERE topology_id = %s",
            (self.topology_id,),
        )
        nodes = cur.fetchall()

        for n in nodes:
            nid = n["id"]
            ntype = n["node_type"]
            self.all_node_ids.append(nid)

            attrs = n["attributes"] if n["attributes"] else {}
            if isinstance(attrs, str):
                try:
                    attrs = json.loads(attrs)
                except:
                    attrs = {}

            if ntype == 'central_tank':
                self.central_tanks.append(nid)
                self.state[nid] = {
                    'waterLevel': 60.0,
                    'temperature': random.uniform(20, 25),
                    'ph': random.uniform(6.8, 7.4),
                    'tds': random.uniform(180, 250),
                    'inletValveOn': attrs.get('inletValveOn', True),
                    'outletValveOn': attrs.get('outletValveOn', True)
                }
            elif ntype in ('source_tank', 'tank', 'source'):
                self.source_tanks.append(nid)
                self.state[nid] = {
                    'waterLevel': 0.0,
                    'temperature': random.uniform(16, 22),
                    'ph': random.uniform(6.9, 7.3),
                    'tds': random.uniform(150, 220),
                    'inletValveOn': attrs.get('inletValveOn', True),
                    'outletValveOn': attrs.get('outletValveOn', True)
                }
            elif ntype == "pump":
                self.pumps.append(nid)
                self.state[nid] = {
                    "status": "Healthy",
                    "vibration": round(random.uniform(1.5, 2.2), 2),
                    "pumpOn": attrs.get("pumpOn", True)
                }

        self.all_tank_ids = self.central_tanks + self.source_tanks

        cur.execute(
            "SELECT source_node, target_node FROM edges WHERE topology_id = %s",
            (self.topology_id,),
        )
        self.edges = [{"source": e["source_node"], "target": e["target_node"]} for e in cur.fetchall()]

        for nid in self.all_tank_ids:
            cur.execute(
                "SELECT id, sensor_type FROM sensors WHERE node_id = %s", (nid,)
            )
            sensors = cur.fetchall()
            self.sensor_map[nid] = {s["sensor_type"]: s["id"] for s in sensors}

        cur.close()

        print(f"Topology Loaded:")
        print(f"  Central Tanks : {len(self.central_tanks)}  {self.central_tanks}")
        print(f"  Tanks         : {len(self.source_tanks)}  {self.source_tanks}")
        print(f"  Pumps         : {len(self.pumps)}  {self.pumps}")
        print(f"  Edges         : {len(self.edges)}")
        return True

    def sync_node_attributes(self):
        """Read the live attributes from the database to respect user UI interactions."""
        if not self.all_node_ids:
            return
            
        cur = self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id, attributes FROM nodes WHERE id = ANY(%s)", (self.all_node_ids,))
        for row in cur.fetchall():
            nid = row["id"]
            attrs = row["attributes"] if row["attributes"] else {}
            if isinstance(attrs, str):
                try:
                    attrs = json.loads(attrs)
                except:
                    attrs = {}
                    
            if nid in self.pumps:
                self.state[nid]["pumpOn"] = attrs.get("pumpOn", True)
            elif nid in self.all_tank_ids:
                self.state[nid]["inletValveOn"] = attrs.get("inletValveOn", True)
                self.state[nid]["outletValveOn"] = attrs.get("outletValveOn", True)
                
        cur.close()

    def mix_fluids(self, dst, src, actual_flow):
        mass_ratio = actual_flow / (dst["waterLevel"] or 1)
        src_temp, dst_temp = src["temperature"], dst["temperature"]
        dst["temperature"] = round((dst_temp * (1 - mass_ratio)) + (src_temp * mass_ratio), 4)
        src_tds, dst_tds = src["tds"], dst["tds"]
        dst["tds"] = round((dst_tds * (1 - mass_ratio)) + (src_tds * mass_ratio), 2)

    def run_tick(self):
        self.sync_node_attributes()

        # Environmental drift
        for nid in self.all_tank_ids:
            s = self.state[nid]
            s["ph"] = round(max(0, min(14, s["ph"] + random.gauss(0, 0.008))), 4)
            s["tds"] = round(max(0, s["tds"] + random.gauss(0, 0.3)), 2)
            s["temperature"] = round(s["temperature"] + random.gauss(0, 0.02), 4)

        # 1. Pump flows (Generalized for ANY topology)
        for pump_id in self.pumps:
            ps = self.state[pump_id]
            
            if not ps["pumpOn"]:
                ps["status"] = "Offline"
                ps["vibration"] = 0.0
                continue

            # Find active source tanks and active target tanks for this pump
            src_edges = [e["source"] for e in self.edges if e["target"] == pump_id]
            tgt_edges = [e["target"] for e in self.edges if e["source"] == pump_id]

            active_sources = [s for s in src_edges if s in self.state and self.state[s]["outletValveOn"]]
            active_targets = [t for t in tgt_edges if t in self.state and self.state[t]["inletValveOn"]]

            if not active_sources:
                ps["status"] = "Critical" # Cavitation: pump on, but valves shut or no sources
                ps["vibration"] = round(min(6.0, ps["vibration"] + random.uniform(0.4, 0.8)), 2)
                continue

            if not active_targets:
                ps["status"] = "Warning" # Deadheading: pump on, but target valves shut
                ps["vibration"] = round(min(4.5, ps["vibration"] + random.uniform(0.1, 0.4)), 2)
                continue

            total_water_available = sum(self.state[s]["waterLevel"] for s in active_sources)
            if total_water_available <= 0.1:
                ps["status"] = "Critical" # Cavitation: tanks empty
                ps["vibration"] = round(min(6.0, ps["vibration"] + random.uniform(0.4, 0.8)), 2)
                continue

            # Healthy flow
            total_flow_capacity = random.uniform(2.5, 3.5)
            flow_per_target = total_flow_capacity / len(active_targets)

            flow_occurred = False
            for tgt_id in active_targets:
                tgt = self.state[tgt_id]
                space_available = max(0, 100.0 - tgt["waterLevel"])
                flow_to_this_target = min(flow_per_target, space_available)
                
                if flow_to_this_target > 0:
                    # Pull this flow equally from active sources
                    flow_per_source = flow_to_this_target / len(active_sources)
                    for src_id in active_sources:
                        src = self.state[src_id]
                        actual_src_flow = min(flow_per_source, src["waterLevel"])
                        if actual_src_flow > 0:
                            src["waterLevel"] = round(max(0, src["waterLevel"] - actual_src_flow), 4)
                            tgt["waterLevel"] = round(min(100, tgt["waterLevel"] + actual_src_flow), 4)
                            self.mix_fluids(tgt, src, actual_src_flow)
                            flow_occurred = True

            if flow_occurred:
                ps["status"] = "Healthy"
                ps["vibration"] = round(1.8 + random.gauss(0, 0.15), 2)
            else:
                ps["status"] = "Warning" # Flow attempted but no space
                ps["vibration"] = round(min(4.0, ps["vibration"] + random.uniform(0.1, 0.3)), 2)

        # 2. Gravity / Direct Tank-to-Tank flows (No pump)
        for e in self.edges:
            src_id = e["source"]
            tgt_id = e["target"]
            if src_id in self.all_tank_ids and tgt_id in self.all_tank_ids:
                src = self.state[src_id]
                tgt = self.state[tgt_id]
                if src["outletValveOn"] and tgt["inletValveOn"]:
                    flow_rate = random.uniform(0.8, 1.2)
                    actual_flow = min(flow_rate, src["waterLevel"], max(0, 100.0 - tgt["waterLevel"]))
                    if actual_flow > 0:
                        src["waterLevel"] = round(max(0, src["waterLevel"] - actual_flow), 4)
                        tgt["waterLevel"] = round(min(100, tgt["waterLevel"] + actual_flow), 4)
                        self.mix_fluids(tgt, src, actual_flow)

    def write_to_db(self):
        now = datetime.now(dt.timezone.utc)
        cur = self.conn.cursor()

        readings_to_insert = []

        for nid in self.all_tank_ids:
            s = self.state[nid]
            sensors = self.sensor_map.get(nid, {})

            sensor_statuses = []
            for stype in ("water_level", "ph", "tds", "temperature"):
                value = s.get(stype if stype != "water_level" else "waterLevel", 0)
                if stype == "water_level":
                    value = s.get("waterLevel", 0)

                sensor_id = sensors.get(stype)
                if sensor_id is None:
                    continue

                status = evaluate_sensor(stype, value)
                sensor_statuses.append(status)

                readings_to_insert.append((sensor_id, round(value, 4), now))

                cur.execute(
                    "UPDATE sensors SET status = %s, last_seen = %s WHERE id = %s",
                    (status, now, sensor_id),
                )

            node_status = worst_status(sensor_statuses) if sensor_statuses else "Healthy"
            cur.execute(
                "UPDATE nodes SET status = %s WHERE id = %s",
                (node_status, nid),
            )

        for pid in self.pumps:
            ps = self.state[pid]
            cur.execute(
                "UPDATE nodes SET status = %s WHERE id = %s",
                (ps["status"], pid),
            )

        if readings_to_insert:
            psycopg2.extras.execute_values(
                cur,
                "INSERT INTO sensor_readings (sensor_id, value, created_at) VALUES %s",
                readings_to_insert,
                template="(%s, %s, %s)",
            )

        cur.close()

    # ── Notify Backend (Socket.IO via webhook) ──────────
    def notify_backend(self):
        for nid in self.all_tank_ids:
            s = self.state[nid]
            payload = {
                "deviceName": str(nid),
                "telemetry": {
                    "waterLevel": round(s["waterLevel"], 2),
                    "ph": round(s["ph"], 2),
                    "tds": round(s["tds"], 2),
                    "temperature": round(s["temperature"], 2),
                },
            }
            try:
                requests.post(BACKEND_WEBHOOK, json=payload, timeout=1)
            except Exception:
                pass 

        for pid in self.pumps:
            ps = self.state[pid]
            payload = {
                "deviceName": str(pid),
                "telemetry": {"status": ps["status"].lower()},
            }
            try:
                requests.post(BACKEND_WEBHOOK, json=payload, timeout=1)
            except Exception:
                pass

    def print_status(self):
        ts = datetime.now().strftime("%H:%M:%S")
        print(f"\n-- Tick [{ts}] --------------------------")
        for cid in self.central_tanks:
            s = self.state[cid]
            print(f"  Central Tank #{cid}: WL={s['waterLevel']:6.2f}%  V=[IN:{s['inletValveOn']} OUT:{s['outletValveOn']}]")
        for sid in self.source_tanks:
            s = self.state[sid]
            print(f"  Source Tank  #{sid}: WL={s['waterLevel']:6.2f}%  V=[IN:{s['inletValveOn']} OUT:{s['outletValveOn']}]")
        for pid in self.pumps:
            ps = self.state[pid]
            print(f"  Pump         #{pid}: State={ps['pumpOn']} -> Health={ps['status']} (Vib:{ps['vibration']:.2f})")

    # ── Main Loop ───────────────────────────────────────
    def start(self):
        self.connect_db()
        if not self.load_topology():
            print("Exiting. Please create a Star Topology with nodes first.")
            return

        print("\n" + "=" * 55)
        print("  AQUATWIN STAR TOPOLOGY SIMULATOR - RUNNING")
        print("  Press Ctrl+C to stop")
        print("=" * 55)

        try:
            while True:
                self.run_tick()
                self.write_to_db()
                self.notify_backend()
                self.print_status()
                time.sleep(2.0)
        except KeyboardInterrupt:
            print("\nStopped.")

if __name__ == "__main__":
    topo_id_input = input("Enter the Topology ID to simulate: ")
    try:
        topo_id = int(topo_id_input.strip())
    except ValueError:
        print("Invalid Topology ID. Must be an integer.")
        exit(1)

    sim = StarTopologySimulator(topo_id)
    sim.start()
