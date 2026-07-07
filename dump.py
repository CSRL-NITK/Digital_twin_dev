import psycopg2
conn = psycopg2.connect(host='localhost', port=5432, dbname='dummyDb_DT', user='postgres', password='jeethu0808')
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
