import os
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
cur = conn.cursor()
cur.execute('''
    SELECT t.name, e.source_node, e.target_node, n1.node_type as src_type, n1.node_name as src_name, n2.node_type as tgt_type, n2.node_name as tgt_name 
    FROM edges e 
    JOIN topologies t ON e.topology_id = t.id 
    JOIN nodes n1 ON e.source_node = n1.id 
    JOIN nodes n2 ON e.target_node = n2.id 
    WHERE t.name ILIKE '%star%'
''')
for r in cur.fetchall(): print(r)
