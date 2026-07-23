import { useEffect, useState } from 'react';
import { useGlobalTopology } from '../components/layout/MainLayout';
import { useTheme } from '../components/ThemeProvider';
import axios from 'axios';

const GRAFANA_BASE   = 'http://localhost:3000';
const WATER_DIST_UID = 'water-distribution-dt';
const HYDRO_UID      = 'ad6jj2c';

interface Topology {
  id: number;
  name: string;
}

function buildGrafanaUrl(topology: Topology | null, grafanaTheme: 'dark' | 'light'): string {
  if (!topology) return '';

  const isHydro = topology.name.toLowerCase().includes('hydro');
  const theme = `theme=${grafanaTheme}`;

  if (isHydro) {
    // Hydrophobic dashboard
    return `${GRAFANA_BASE}/d/${HYDRO_UID}/hydrophobic-dashboard?orgId=1&from=now-5m&to=now&timezone=browser&${theme}&kiosk`;
  }

  // Smart Water Distribution dashboard with specific topology parameter
  const topoVar = encodeURIComponent(topology.name);
  return `${GRAFANA_BASE}/d/${WATER_DIST_UID}/new-smart-water-distribution?orgId=1&from=now-2d&to=now&timezone=browser&var-Topology=${topoVar}&${theme}&kiosk`;
}

export default function Dashboard() {
  const { globalTopologyId } = useGlobalTopology();
  const { theme } = useTheme();
  const grafanaTheme = theme === 'dark' ? 'dark' : 'light';

  const [topologies, setTopologies] = useState<Topology[]>([]);
  const [topology, setTopology]     = useState<Topology | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch all topologies
  useEffect(() => {
    axios.get('http://localhost:3001/api/topologies')
      .then(res => setTopologies(res.data))
      .catch(err => console.error('Failed to fetch topologies:', err));
  }, []);

  // Resolve active topology whenever globalTopologyId or topologies list changes
  useEffect(() => {
    if (!topologies.length) return;
    const found = topologies.find(t => t.id.toString() === globalTopologyId.toString());
    setTopology(found ?? topologies[0]);
    setRefreshKey(k => k + 1);
  }, [globalTopologyId, topologies]);

  // Reload iframe when theme changes to keep colors matched
  useEffect(() => {
    setRefreshKey(k => k + 1);
  }, [grafanaTheme]);

  const grafanaUrl = buildGrafanaUrl(topology, grafanaTheme);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      background: theme === 'dark' ? '#111215' : '#f5f6f8',
    }}>
      {grafanaUrl ? (
        <iframe
          key={refreshKey}
          src={grafanaUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
          title={`Grafana — ${topology?.name ?? 'Dashboard'}`}
          allow="fullscreen"
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '3px solid rgba(0,255,255,0.15)',
            borderTopColor: '#00ffff',
            animation: 'dashSpin 0.7s linear infinite',
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
            Loading dashboard…
          </span>
          <style>{`@keyframes dashSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}
