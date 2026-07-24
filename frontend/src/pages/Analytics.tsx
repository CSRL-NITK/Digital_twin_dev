import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useGlobalTopology } from '../components/layout/MainLayout';
import HydroponicsSimulation from './hydro/Analytics';
import WaterDistributionLiveAnalytics from './WaterDistributionLiveAnalytics';

export default function Analytics() {
  const { id } = useParams();
  const { globalTopologyId } = useGlobalTopology();
  const activeTopologyId = id || globalTopologyId;
  const [isHydro, setIsHydro] = useState<boolean | null>(null);

  useEffect(() => {
    if (!activeTopologyId) {
      const t = setTimeout(() => setIsHydro(false), 0);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    axios.get(`http://localhost:3001/api/topologies/${activeTopologyId}`)
      .then(res => {
        if (!cancelled) setIsHydro(res.data.name.toLowerCase().includes('hydroponic'));
      })
      .catch(err => {
        console.error(err);
        if (!cancelled) setIsHydro(false);
      });
    return () => { cancelled = true; };
  }, [activeTopologyId]);

  if (isHydro === null) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '3px solid rgba(0,255,255,0.20)',
          borderTopColor: '#00ffff',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isHydro) {
    return <HydroponicsSimulation />;
  }

  // Render the water distribution live analytics page:
  return <WaterDistributionLiveAnalytics globalTopologyId={activeTopologyId} />;
}
