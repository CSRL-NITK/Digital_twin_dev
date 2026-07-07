import psycopg2, psycopg2.extras
conn = psycopg2.connect(host='localhost', port=5432, dbname='dummyDb_DT', user='postgres', password='jeethu0808')
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
