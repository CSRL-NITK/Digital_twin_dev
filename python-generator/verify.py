import os
import psycopg2
import psycopg2.extras
from urllib.parse import urlparse

def get_db_config():
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        result = urlparse(db_url)
        return {
            "host": result.hostname or "localhost",
            "port": result.port or 5432,
            "dbname": result.path.lstrip("/").split("?")[0] or "DT-MAIN",
            "user": result.username or "postgres",
            "password": result.password or "postgres123",
        }
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", 5432)),
        "dbname": os.getenv("DB_NAME", "DT-MAIN"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "postgres123"),
    }

conn = psycopg2.connect(**get_db_config())
cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

print("=== NODES ===")
cur.execute("SELECT id, node_name, node_type FROM nodes ORDER BY id")
for r in cur.fetchall():
    print(f"  #{r['id']}: {r['node_name']} ({r['node_type']})")

print("\n=== SENSORS ===")
cur.execute("SELECT count(*) as cnt FROM sensors")
print(f"  Total: {cur.fetchone()['cnt']} sensors")

print("\n=== EDGES ===")
cur.execute("SELECT id, source_node, target_node FROM edges ORDER BY id")
for r in cur.fetchall():
    print(f"  #{r['id']}: node {r['source_node']} -> node {r['target_node']}")

cur.close()
conn.close()
