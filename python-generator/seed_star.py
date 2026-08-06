"""
Seed script: Creates a Star Topology with 1 Central Tank, 4 Water Tanks, 2 Pumps
and all edges + sensors directly in PostgreSQL.
"""
import psycopg2
import psycopg2.extras

import os
from urllib.parse import urlparse

def get_db_config():
    possible_env_paths = [
        os.path.join(os.path.dirname(__file__), "..", "backend", ".env"),
        os.path.join(os.path.dirname(__file__), "backend", ".env"),
        os.path.join(os.getcwd(), "..", "backend", ".env"),
        os.path.join(os.getcwd(), "backend", ".env"),
    ]

    db_url = os.getenv("DATABASE_URL")

    if not db_url:
        for env_path in possible_env_paths:
            if os.path.exists(env_path):
                try:
                    with open(env_path, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("DATABASE_URL="):
                                raw_val = line.split("=", 1)[1].strip()
                                if (raw_val.startswith('"') and raw_val.endswith('"')) or (raw_val.startswith("'") and raw_val.endswith("'")):
                                    raw_val = raw_val[1:-1]
                                db_url = raw_val
                                break
                    if db_url:
                        break
                except Exception:
                    pass

    if db_url:
        try:
            result = urlparse(db_url)
            return {
                "host": result.hostname or "localhost",
                "port": result.port or 5432,
                "dbname": result.path.lstrip("/").split("?")[0] or "dummyDb_DT",
                "user": result.username or "postgres",
                "password": result.password or "jeethu0808",
            }
        except Exception:
            pass

    return {
        "host": "localhost",
        "port": 5432,
        "dbname": "dummyDb_DT",
        "user": "postgres",
        "password": "jeethu0808",
    }

DB_CONFIG = get_db_config()

def seed():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    cur = conn.cursor()

    # ── 1. Create Topology ──
    cur.execute(
        "INSERT INTO topologies (name, description) VALUES (%s, %s) RETURNING id",
        ("Star Topology", None),
    )
    topo_id = cur.fetchone()[0]
    print(f"Created Star Topology (id={topo_id})")

    # ── 2. Create Nodes ──
    #   Layout positions for a nice star:
    #
    #     Tank-1       Tank-2
    #        \  Pump-1  Pump-2  /
    #         \   \      /   /
    #          ── Central Tank ──
    #         /                  \
    #     Tank-3              Tank-4
    #
    nodes = [
        # (name, type, x, y)
        ("Central Tank",  "central_tank", 400, 300),
        ("Tank 1",        "tank",        -100, -50),
        ("Tank 2",        "tank",         900, -50),
        ("Tank 3",        "tank",        -100, 650),
        ("Tank 4",        "tank",         900, 650),
        ("Pump P1",       "pump",         150, 150),
        ("Pump P2",       "pump",         650, 150),
    ]

    node_ids = {}  # name -> id
    for name, ntype, x, y in nodes:
        cur.execute(
            """INSERT INTO nodes (topology_id, node_name, node_type, position_x, position_y, status)
               VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
            (topo_id, name, ntype, x, y, "Healthy"),
        )
        nid = cur.fetchone()[0]
        node_ids[name] = nid
        print(f"  Node #{nid}: {name} ({ntype})")

    # ── 3. Create Sensors (4 per tank) ──
    sensor_types = ["water_level", "ph", "tds", "temperature"]
    tank_names = ["Central Tank", "Tank 1", "Tank 2", "Tank 3", "Tank 4"]

    for tname in tank_names:
        nid = node_ids[tname]
        for stype in sensor_types:
            pretty = stype.replace("_", " ").upper()
            cur.execute(
                """INSERT INTO sensors (node_id, sensor_name, sensor_type, status)
                   VALUES (%s, %s, %s, %s)""",
                (nid, f"{tname} {pretty}", stype, "Online"),
            )
        print(f"  Created 4 sensors for {tname}")

    # ── 4. Create Edges (star flow) ──
    #   Tank 1 → Pump P1 → Central Tank
    #   Tank 2 → Pump P2 → Central Tank
    #   Central Tank → Tank 3
    #   Central Tank → Tank 4
    edges = [
        ("Tank 1",       "Pump P1"),
        ("Tank 2",       "Pump P2"),
        ("Pump P1",      "Central Tank"),
        ("Pump P2",      "Central Tank"),
        ("Central Tank", "Tank 3"),
        ("Central Tank", "Tank 4"),
    ]

    for src, tgt in edges:
        cur.execute(
            """INSERT INTO edges (topology_id, source_node, target_node, edge_type, status)
               VALUES (%s, %s, %s, %s, %s)""",
            (topo_id, node_ids[src], node_ids[tgt], "pipe", "normal"),
        )
        print(f"  Edge: {src} -> {tgt}")

    cur.close()
    conn.close()

    print("\n✅ Star Topology seeded successfully!")
    print(f"   Topology ID : {topo_id}")
    print(f"   Nodes       : {len(nodes)}")
    print(f"   Sensors     : {len(tank_names) * 4}")
    print(f"   Edges       : {len(edges)}")
    print("\nRestart your backend and refresh the browser to see it!")


if __name__ == "__main__":
    seed()
