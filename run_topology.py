"""
Launch the topology simulator for a specific topology by ID.
Usage: python run_topology.py <topology_id>
"""
import sys
import os

# Add the python-generator directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'python-generator'))

from main import StarTopologySimulator

if len(sys.argv) < 2:
    print("Usage: python run_topology.py <topology_id>")
    sys.exit(1)

topo_id = int(sys.argv[1])
print(f"Starting simulator for topology ID={topo_id}")
sim = StarTopologySimulator(topo_id)
sim.start()
