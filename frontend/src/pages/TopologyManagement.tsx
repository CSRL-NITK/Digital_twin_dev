import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Plus, Trash2, Edit2, Server, LayoutTemplate, 
  Search, X, AlertCircle, Loader2, Gauge, Settings
} from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import BorderGlow from '../components/ui/BorderGlow';
import PushableButton from '../components/ui/PushableButton';
import OpenTopologyButton from '../components/ui/OpenTopologyButton';

const BACKEND_URL = 'http://localhost:3001';
const FONT = "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";

interface Topology {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  _count: {
    nodes: number;
    edges: number;
  };
  nodes?: { type: string }[];
}

interface SensorCatalogItem {
  id: string;
  name: string;
  type: string;
  svgName: string;
  description: string;
  unit: string;
  accuracy: string;
  color: string;
  svgContent?: string;
}

const DEFAULT_SENSOR_CATALOG: SensorCatalogItem[] = [
  {
    id: 'water_level',
    name: 'Ultrasonic Level Sensor',
    type: 'water_level',
    svgName: 'ultrasonic',
    description: 'Measures liquid level and tank volume using acoustic transceivers. Ideal for tank telemetry.',
    unit: '%',
    accuracy: '±0.5%',
    color: '#38bdf8',
  },
  {
    id: 'ph',
    name: 'pH Quality Probe',
    type: 'ph',
    svgName: 'ph',
    description: 'Monitors acidity and alkalinity (pH balance) of the fluid flow to identify contamination.',
    unit: 'pH',
    accuracy: '±0.02 pH',
    color: '#10b981',
  },
  {
    id: 'tds',
    name: 'TDS Conductivity Probe',
    type: 'tds',
    svgName: 'tds',
    description: 'Checks Total Dissolved Solids to verify total mineral/metallic impurity levels in the reservoirs.',
    unit: 'ppm',
    accuracy: '±5.0 ppm',
    color: '#f59e0b',
  },
  {
    id: 'temperature',
    name: 'Digital Thermometer',
    type: 'temperature',
    svgName: 'temperature',
    description: 'High-precision insertion temperature sensor to monitor thermal thresholds of the fluid system.',
    unit: '°C',
    accuracy: '±0.2°C',
    color: '#ef4444',
  },
];

const Badge = ({ icon, count, label, dark, color }: any) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 8px', borderRadius: 6,
    background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
    fontSize: 12, fontWeight: 600, color: dark ? '#d1d5db' : '#4b5563'
  }}>
    <span style={{ filter: dark ? 'brightness(0.9)' : 'none' }}>{icon}</span>
    <span style={{ color }}>{count}</span>
    <span style={{ fontWeight: 500, color: dark ? '#9ca3af' : '#6b7280' }}>{label}</span>
  </div>
);

export default function TopologyManagement() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const navigate = useNavigate();

  const [topologies, setTopologies] = useState<Topology[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<'topologies' | 'sensors'>(() => {
    const saved = localStorage.getItem('dt-active-tab');
    return (saved === 'sensors' || saved === 'topologies') ? saved : 'topologies';
  });

  useEffect(() => {
    localStorage.setItem('dt-active-tab', activeTab);
  }, [activeTab]);

  // Sensor Catalog State
  const [sensors, setSensors] = useState<SensorCatalogItem[]>(() => {
    const saved = localStorage.getItem('dt-sensor-catalog');
    return saved ? JSON.parse(saved) : DEFAULT_SENSOR_CATALOG;
  });

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSensorEditModalOpen, setIsSensorEditModalOpen] = useState(false);
  const [isCreatingSensor, setIsCreatingSensor] = useState(false);
  const [sensorColor, setSensorColor] = useState('#38bdf8');
  const [sensorTelemetryType, setSensorTelemetryType] = useState('flow_rate');

  // Form State
  const [activeTopology, setActiveTopology] = useState<Topology | null>(null);
  const [activeSensor, setActiveSensor] = useState<SensorCatalogItem | null>(null);
  const [previewSvg, setPreviewSvg] = useState<SensorCatalogItem | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [sensorFormData, setSensorFormData] = useState({ name: '', description: '', svgName: '', unit: '', accuracy: '', svgContent: '' });
  const [dragOver, setDragOver] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTopologies = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${BACKEND_URL}/api/topologies`);
      setTopologies(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load topologies.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopologies();
  }, [fetchTopologies]);

  const filteredTopologies = topologies.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    (t.description?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const filteredSensors = sensors.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.description.toLowerCase().includes(search.toLowerCase()) || 
    s.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/topologies`, formData);
      setTopologies([{ ...data, _count: { nodes: 0, edges: 0 } }, ...topologies]);
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '' });
      // Redirect to the new workspace
      navigate(`/topology/${data.id}`);
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create workspace.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopology) return;
    setFormLoading(true);
    setFormError(null);
    try {
      const { data } = await axios.patch(`${BACKEND_URL}/api/topologies/${activeTopology.id}`, formData);
      setTopologies(topologies.map(t => (t.id === data.id ? { ...t, ...data } : t)));
      setIsEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to update workspace.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeTopology) return;
    setFormLoading(true);
    setFormError(null);
    try {
      await axios.delete(`${BACKEND_URL}/api/topologies/${activeTopology.id}`);
      setTopologies(topologies.filter(t => t.id !== activeTopology.id));
      setIsDeleteModalOpen(false);
    } catch (err: any) {
      setFormError('Failed to delete workspace.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSensorEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sensorFormData.svgContent) {
      try {
        await axios.post(`${BACKEND_URL}/api/sensors/upload`, {
          svgName: sensorFormData.svgName,
          svgContent: sensorFormData.svgContent,
        });
      } catch (error) {
        console.error('Failed to upload custom SVG file:', error);
        alert('Failed to save the custom SVG file on the server, but it will still be used locally.');
      }
    }

    if (isCreatingSensor) {
      if (!sensorTelemetryType) {
        alert('Telemetry Type Key is required.');
        return;
      }
      const newSensor: SensorCatalogItem = {
        id: sensorTelemetryType,
        name: sensorFormData.name,
        type: sensorTelemetryType,
        svgName: sensorFormData.svgName,
        description: sensorFormData.description,
        unit: sensorFormData.unit,
        accuracy: sensorFormData.accuracy,
        color: sensorColor,
        svgContent: sensorFormData.svgContent || undefined,
      };

      if (sensors.some(s => s.id === newSensor.id)) {
        alert('A sensor template with this Telemetry Type Key already exists.');
        return;
      }

      const updated = [...sensors, newSensor];
      setSensors(updated);
      localStorage.setItem('dt-sensor-catalog', JSON.stringify(updated));
    } else {
      if (!activeSensor) return;
      const updated = sensors.map(s => {
        if (s.id === activeSensor.id) {
          return {
            ...s,
            name: sensorFormData.name,
            description: sensorFormData.description,
            svgName: sensorFormData.svgName,
            unit: sensorFormData.unit,
            accuracy: sensorFormData.accuracy,
            color: sensorColor,
            svgContent: sensorFormData.svgContent || undefined,
          };
        }
        return s;
      });
      setSensors(updated);
      localStorage.setItem('dt-sensor-catalog', JSON.stringify(updated));
    }
    setIsSensorEditModalOpen(false);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSensorFormData(prev => ({ ...prev, svgContent: event.target!.result as string }));
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a valid SVG file.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSensorFormData(prev => ({ ...prev, svgContent: event.target!.result as string }));
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid SVG file.');
    }
  };

  const openEdit = (topology: Topology) => {
    setActiveTopology(topology);
    setFormData({ name: topology.name, description: topology.description || '' });
    setIsEditModalOpen(true);
  };

  const openDelete = (topology: Topology) => {
    setActiveTopology(topology);
    setIsDeleteModalOpen(true);
  };

  const openSensorEdit = (sensor: SensorCatalogItem) => {
    setIsCreatingSensor(false);
    setActiveSensor(sensor);
    setSensorColor(sensor.color);
    setSensorTelemetryType(sensor.type);
    setSensorFormData({
      name: sensor.name,
      description: sensor.description,
      svgName: sensor.svgName,
      unit: sensor.unit,
      accuracy: sensor.accuracy,
      svgContent: sensor.svgContent || '',
    });
    setIsSensorEditModalOpen(true);
  };

  const openSensorCreate = () => {
    setIsCreatingSensor(true);
    setActiveSensor(null);
    setSensorColor('#38bdf8');
    setSensorTelemetryType('');
    setSensorFormData({
      name: '',
      description: '',
      svgName: '',
      unit: '',
      accuracy: '',
      svgContent: '',
    });
    setIsSensorEditModalOpen(true);
  };

  const inputStyle = {
    height: 44, padding: '0 14px', borderRadius: 10, width: '100%',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'}`,
    background: dark ? '#22232a' : '#f3f3f3',
    fontSize: 14, color: dark ? '#f0f0f2' : '#17181c',
    outline: 'none', fontFamily: FONT,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  return (
    <div style={{
      backgroundColor: 'transparent',
      backgroundImage: dark 
        ? 'radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px)' 
        : 'radial-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      height: '100%', overflowY: 'auto'
    }}>
      <div style={{
        padding: '40px 48px', maxWidth: 1400, margin: '0 auto', fontFamily: FONT,
        color: dark ? '#f0f0f2' : '#17181c',
      }}>
        
        {/* Tab Selection Header */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, paddingBottom: 12 }}>
          <button 
            onClick={() => { setActiveTab('topologies'); setSearch(''); }}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              background: activeTab === 'topologies' ? (dark ? 'rgba(0,255,255,0.12)' : '#e0f2fe') : 'transparent',
              color: activeTab === 'topologies' ? (dark ? '#00ffff' : '#0369a1') : (dark ? '#9ca3af' : '#4b5563'),
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Topologies
          </button>
          <button 
            onClick={() => { setActiveTab('sensors'); setSearch(''); }}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              background: activeTab === 'sensors' ? (dark ? 'rgba(0,255,255,0.12)' : '#e0f2fe') : 'transparent',
              color: activeTab === 'sensors' ? (dark ? '#00ffff' : '#0369a1') : (dark ? '#9ca3af' : '#4b5563'),
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Sensor Catalog
          </button>
        </div>

        {/* Header Title Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: dark ? 'rgba(0,255,255,0.1)' : 'rgba(0,200,200,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${dark ? 'rgba(0,255,255,0.2)' : 'rgba(0,200,200,0.2)'}`
              }}>
                {activeTab === 'topologies' 
                  ? <Server size={24} color={dark ? '#00ffff' : '#00c8c8'} />
                  : <Gauge size={24} color={dark ? '#00ffff' : '#00c8c8'} />
                }
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
                {activeTab === 'topologies' ? 'Topologies' : 'Sensor Catalog'}
              </h1>
            </div>
            <p style={{ color: dark ? '#9ca3af' : '#6b7280', margin: 0, fontSize: 15, paddingLeft: 56 }}>
              {activeTab === 'topologies' ? 'Manage and launch your topologies.' : 'Configure available telemetry sensors and customize properties.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ position: 'relative', width: 300 }}>
              <Search size={18} color={dark ? '#9ca3af' : '#6b7280'} style={{ position: 'absolute', left: 16, top: 13 }} />
              <input 
                type="text" 
                placeholder={activeTab === 'topologies' ? 'Search topologies...' : 'Search sensors...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', height: 44, padding: '0 16px 0 44px',
                  boxSizing: 'border-box',
                  borderRadius: 12, border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  background: dark ? '#1c1d22' : '#ffffff', color: dark ? '#fff' : '#000',
                  fontSize: 14, outline: 'none'
                }}
              />
            </div>

            {activeTab === 'topologies' && (
              <PushableButton
                onClick={() => { setFormData({ name: '', description: '' }); setIsCreateModalOpen(true); }}
              >
                <Plus size={18} strokeWidth={2.5} />
                New Topology
              </PushableButton>
            )}

            {activeTab === 'sensors' && (
              <PushableButton
                onClick={openSensorCreate}
              >
                <Plus size={18} strokeWidth={2.5} />
                New Sensor
              </PushableButton>
            )}
          </div>
        </div>

        {/* Topologies View */}
        {activeTab === 'topologies' && (
          <>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                <Loader2 size={32} className="animate-spin" color="#00ffff" />
              </div>
            ) : filteredTopologies.length === 0 ? (
              <div style={{
                padding: '60px 0', textAlign: 'center',
                background: dark ? '#1c1d22' : '#ffffff',
                borderRadius: 20, border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
              }}>
                <FolderOpen size={48} color={dark ? '#374151' : '#d1d5db'} style={{ marginBottom: 16 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Topologies Found</h3>
                <p style={{ fontSize: 14, color: dark ? '#9ca3af' : '#6b7280', maxWidth: 400, margin: '0 auto' }}>
                  {search ? 'Try adjusting your search query.' : 'Get started by creating your first topology.'}
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24
              }}>
                {filteredTopologies.map(topology => (
                  <BorderGlow
                    key={topology.id}
                    backgroundColor={dark ? '#1c1d22' : '#ffffff'}
                    borderRadius={24}
                    glowColor={dark ? '180 100 50' : '180 100 30'}
                    colors={dark ? ['#00ffff', '#0d9488', '#38bdf8'] : ['#0d9488', '#00ffff', '#38bdf8']}
                    animated={true}
                    glowRadius={40}
                    coneSpread={30}
                    edgeSensitivity={35}
                    style={{ '--card-shadow': dark ? '0 8px 32px rgba(0,0,0,0.2)' : '0 10px 40px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.03)' } as React.CSSProperties}
                  >
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: dark ? '#22232a' : '#f3f4f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <LayoutTemplate size={20} color={dark ? '#00ffff' : '#0d9488'} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: '-0.3px', color: dark ? '#fff' : '#111' }}>
                              {topology.name}
                            </h3>
                            <p style={{ fontSize: 12, color: dark ? '#9ca3af' : '#6b7280', margin: '2px 0 0' }}>
                              ID: {topology.id} &middot; Created {new Date(topology.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(topology)} style={{
                            width: 32, height: 32, borderRadius: 8, border: 'none',
                            background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#d1d5db' : '#4b5563'
                          }} title="Edit details">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => openDelete(topology)} style={{
                            width: 32, height: 32, borderRadius: 8, border: 'none',
                            background: dark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444'
                          }} title="Delete workspace">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      <p style={{ 
                        fontSize: 13.5, color: dark ? '#d1d5db' : '#4b5563', lineHeight: 1.5,
                        margin: '0 0 20px', flex: 1, minHeight: 81,
                        display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                      }}>
                        {topology.description || 'No description provided.'}
                      </p>

                      {(() => {
                        const counts = { tanks: 0, pumps: 0, valves: 0, sensors: 0 };
                        if (topology.nodes) {
                          topology.nodes.forEach((n: any) => {
                            const type = n.nodeType?.toLowerCase();
                            if (type === 'tank' || type === 'reservoir' || type === 'central_tank' || type === 'source_tank') counts.tanks++;
                            else if (type === 'pump') counts.pumps++;
                            else if (type === 'valve') counts.valves++;
                            
                            if (n._count?.sensors) {
                              counts.sensors += n._count.sensors;
                            }
                          });
                        }
                        
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16, borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {counts.tanks > 0 && <Badge icon="💧" count={counts.tanks} label="Tanks" dark={dark} color="#3b82f6" />}
                              {counts.pumps > 0 && <Badge icon="⚙️" count={counts.pumps} label="Pumps" dark={dark} color="#8b5cf6" />}
                              {counts.valves > 0 && <Badge icon="🚰" count={counts.valves} label="Valves" dark={dark} color="#10b981" />}
                              {counts.sensors > 0 && <Badge icon="📊" count={counts.sensors} label="Sensors" dark={dark} color="#f59e0b" />}
                              {(!topology.nodes || topology.nodes.length === 0) && (
                                <span style={{ fontSize: 13, color: dark ? '#6b7280' : '#9ca3af', fontStyle: 'italic' }}>No assets configured</span>
                              )}
                            </div>

                            <OpenTopologyButton onClick={() => navigate(`/topology/${topology.id}`)} dark={dark} />
                          </div>
                        );
                      })()}
                    </div>
                  </BorderGlow>
                ))}
              </div>
            )}
          </>
        )}

        {/* Sensors Catalog View */}
        {activeTab === 'sensors' && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24
          }}>
            {filteredSensors.map(sensor => (
              <BorderGlow
                key={sensor.id}
                backgroundColor={dark ? '#1c1d22' : '#ffffff'}
                borderRadius={24}
                glowColor={dark ? '180 100 50' : '180 100 30'}
                colors={dark ? [sensor.color, '#00ffff', '#38bdf8'] : [sensor.color, '#0d9488', '#38bdf8']}
                animated={true}
                glowRadius={40}
                coneSpread={30}
                edgeSensitivity={35}
                style={{ '--card-shadow': dark ? '0 8px 32px rgba(0,0,0,0.2)' : '0 10px 40px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.03)' } as React.CSSProperties}
              >
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div 
                        onClick={() => setPreviewSvg(sensor)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.08)';
                          e.currentTarget.style.borderColor = '#00ffff';
                          e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        style={{
                          width: 50, height: 50, borderRadius: 12,
                          background: dark ? '#22232a' : '#f3f4f6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1.5px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        title="Click to view full screen vector"
                      >
                        {sensor.svgContent ? (
                          <div 
                            style={{ width: '80%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            dangerouslySetInnerHTML={{ __html: sensor.svgContent }} 
                          />
                        ) : (
                          <img 
                            src={`/assets/sensors/${sensor.svgName}.svg`} 
                            alt={sensor.name} 
                            style={{ width: '80%', height: '80%', objectFit: 'contain' }}
                          />
                        )}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: '-0.3px', color: dark ? '#fff' : '#111' }}>
                          {sensor.name}
                        </h3>
                        <p style={{ fontSize: 12, color: dark ? '#6b7280' : '#9ca3af', margin: '2px 0 0', fontWeight: 600, fontFamily: 'monospace' }}>
                          Type: {sensor.type}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => openSensorEdit(sensor)}
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none',
                        background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#d1d5db' : '#4b5563',
                        transition: 'all 0.15s ease'
                      }} 
                      title="Edit sensor details"
                    >
                      <Settings size={15} />
                    </button>
                  </div>

                  <p style={{ 
                    fontSize: 13.5, color: dark ? '#d1d5db' : '#4b5563', lineHeight: 1.5,
                    margin: '0 0 20px', flex: 1, minHeight: 81,
                    display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {sensor.description}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16, borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <Badge icon="📏" count={sensor.unit} label="Metric Unit" dark={dark} color={sensor.color} />
                      <Badge icon="🎯" count={sensor.accuracy} label="Accuracy" dark={dark} color={sensor.color} />
                      <Badge icon="📁" count={`${sensor.svgName}.svg`} label="Asset Vector" dark={dark} color={dark ? '#9ca3af' : '#4b5563'} />
                    </div>
                  </div>
                </div>
              </BorderGlow>
            ))}
          </div>
        )}

        {/* Topology Create / Edit Modal */}
        {(isCreateModalOpen || isEditModalOpen) && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: dark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              background: dark ? '#1c1d22' : '#ffffff',
              borderRadius: 24, width: '100%', maxWidth: 440,
              border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: dark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <div style={{ padding: '24px 32px', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  {isCreateModalOpen ? 'Create New Workspace' : 'Edit Workspace Details'}
                </h2>
                <button 
                  onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#9ca3af' : '#6b7280' }}
                >
                  <X size={20} />
                </button>
              </div>
              <div style={{ padding: 32 }}>
                {formError && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)',
                    color: '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20
                  }}>
                    <AlertCircle size={16} /> {formError}
                  </div>
                )}
                <form onSubmit={isCreateModalOpen ? handleCreate : handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: dark ? '#d1d5db' : '#4b5563' }}>
                      Workspace Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Sector 7 Treatment Plant"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: dark ? '#d1d5db' : '#4b5563' }}>
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this plant/facility..."
                      style={{ ...inputStyle, height: 100, padding: '12px 14px', resize: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                      style={{
                        flex: 1, height: 44, borderRadius: 10, border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        background: 'transparent', color: dark ? '#f0f0f2' : '#17181c', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      style={{
                        flex: 1, height: 44, borderRadius: 10, border: 'none',
                        background: '#00ffff', color: '#17181c', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}
                    >
                      {formLoading ? <Loader2 size={16} className="animate-spin" /> : isCreateModalOpen ? 'Create & Launch' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && activeTopology && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: dark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              background: dark ? '#1c1d22' : '#ffffff',
              borderRadius: 24, width: '100%', maxWidth: 400,
              border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: dark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.1)',
              padding: 32, textAlign: 'center'
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
              }}>
                <AlertCircle size={28} color="#ef4444" />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>Delete Workspace?</h2>
              <p style={{ fontSize: 14, color: dark ? '#9ca3af' : '#6b7280', margin: '0 0 24px', lineHeight: 1.5 }}>
                Are you sure you want to delete <strong>{activeTopology.name}</strong>? This will permanently erase all connected assets, pipes, and sensors. This action cannot be undone.
              </p>
              {formError && (
                <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{formError}</p>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  style={{
                    flex: 1, height: 44, borderRadius: 10, border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    background: 'transparent', color: dark ? '#f0f0f2' : '#17181c', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={formLoading}
                  style={{
                    flex: 1, height: 44, borderRadius: 10, border: 'none',
                    background: '#ef4444', color: '#ffffff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  {formLoading ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit/Create Sensor Modal */}
        {isSensorEditModalOpen && (isCreatingSensor || activeSensor) && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: dark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '20px 16px', boxSizing: 'border-box'
          }}>
            <div style={{
              background: dark ? '#1c1d22' : '#ffffff',
              borderRadius: 24, width: '100%', maxWidth: 460,
              maxHeight: 'calc(100vh - 40px)',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: dark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.1)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
              <div style={{ padding: '20px 32px', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                  {isCreatingSensor ? 'Create New Sensor Template' : 'Customize Sensor Metadata'}
                </h2>
                <button 
                  onClick={() => setIsSensorEditModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#9ca3af' : '#6b7280' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSensorEdit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', margin: 0 }}>
                <div style={{ padding: '24px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: dark ? '#d1d5db' : '#4b5563' }}>
                      Sensor Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      required
                      value={sensorFormData.name}
                      onChange={e => setSensorFormData({ ...sensorFormData, name: e.target.value })}
                      placeholder="e.g. Ultrasonic Level Transmitter"
                      style={inputStyle}
                    />
                  </div>

                  {!isCreatingSensor && (
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: dark ? '#d1d5db' : '#4b5563' }}>
                        Telemetry Type Key (Read-Only)
                      </label>
                      <input
                        disabled
                        value={sensorTelemetryType}
                        style={{ ...inputStyle, background: dark ? 'rgba(255,255,255,0.03)' : '#f1f5f9', color: dark ? '#6b7280' : '#94a3b8', cursor: 'not-allowed' }}
                      />
                    </div>
                  )}

                  {isCreatingSensor && (
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: dark ? '#d1d5db' : '#4b5563' }}>
                        Telemetry Type Key <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        required
                        value={sensorTelemetryType}
                        onChange={e => setSensorTelemetryType(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="e.g. flow_rate, pressure, vibration"
                        style={inputStyle}
                      />
                      <span style={{ fontSize: 11, color: dark ? '#6b7280' : '#9ca3af', marginTop: 4, display: 'block' }}>
                        Lowercase alphanumeric and underscores only.
                      </span>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: dark ? '#d1d5db' : '#4b5563' }}>
                      Theme Accent Color
                    </label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {[
                        { value: '#38bdf8', label: 'Sky Blue' },
                        { value: '#10b981', label: 'Emerald Green' },
                        { value: '#f59e0b', label: 'Amber Orange' },
                        { value: '#ec4899', label: 'Rose Pink' },
                        { value: '#8b5cf6', label: 'Violet Purple' },
                        { value: '#ef4444', label: 'Crimson Red' },
                      ].map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setSensorColor(c.value)}
                          style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: c.value, border: sensorColor === c.value ? `2.5px solid ${dark ? '#fff' : '#000'}` : '2.5px solid transparent',
                            cursor: 'pointer', transition: 'all 0.15s ease',
                            boxShadow: sensorColor === c.value ? `0 0 10px ${c.value}` : 'none'
                          }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: dark ? '#d1d5db' : '#4b5563' }}>
                      Description
                    </label>
                    <textarea
                      value={sensorFormData.description}
                      onChange={e => setSensorFormData({ ...sensorFormData, description: e.target.value })}
                      placeholder="Brief description of this sensor's utility..."
                      style={{ ...inputStyle, height: 80, padding: '12px 14px', resize: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: dark ? '#d1d5db' : '#4b5563' }}>
                        Metric Unit
                      </label>
                      <input
                        value={sensorFormData.unit}
                        onChange={e => setSensorFormData({ ...sensorFormData, unit: e.target.value })}
                        placeholder="e.g. pH, ppm, %"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: dark ? '#d1d5db' : '#4b5563' }}>
                        Accuracy Spec
                      </label>
                      <input
                        value={sensorFormData.accuracy}
                        onChange={e => setSensorFormData({ ...sensorFormData, accuracy: e.target.value })}
                        placeholder="e.g. ±0.05 pH"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: dark ? '#d1d5db' : '#4b5563' }}>
                        SVG Vector Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        required
                        value={sensorFormData.svgName}
                        onChange={e => setSensorFormData({ ...sensorFormData, svgName: e.target.value })}
                        placeholder="e.g. ph, ultrasonic, tds"
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 16 }}>
                      <span style={{ fontSize: 11, color: dark ? '#6b7280' : '#9ca3af', fontWeight: 600 }}>
                        Default mapping:
                      </span>
                      <span style={{ fontSize: 11, color: dark ? '#9ca3af' : '#4b5563', fontFamily: 'monospace', marginTop: 2 }}>
                        /assets/sensors/{sensorFormData.svgName || '...'}.svg
                      </span>
                    </div>
                  </div>

                  {/* SVG Source Configuration */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)', padding: 16, borderRadius: 12, border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: dark ? '#00ffff' : '#0369a1', letterSpacing: '0.04em' }}>
                      CUSTOM SENSOR VECTOR (SVG)
                    </label>

                    {/* Drag & Drop Area */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleFileDrop}
                      style={{
                        height: 90, border: `2px dashed ${dragOver ? '#00ffff' : (dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.20)')}`,
                        borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        background: dragOver ? (dark ? 'rgba(0,255,255,0.05)' : '#ecfdf5') : 'transparent',
                        cursor: 'pointer', transition: 'all 0.15s ease', position: 'relative'
                      }}
                      onClick={() => document.getElementById('svg-file-input')?.click()}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: dark ? '#d1d5db' : '#4b5563' }}>
                        Drag & drop SVG file here, or <span style={{ color: '#00ffff', textDecoration: 'underline' }}>browse</span>
                      </span>
                      <span style={{ fontSize: 11, color: dark ? '#6b7280' : '#9ca3af', marginTop: 4 }}>
                        Supports only valid .svg files
                      </span>
                      <input
                        id="svg-file-input"
                        type="file"
                        accept=".svg,image/svg+xml"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: dark ? '#4b5563' : '#cbd5e1' }}>
                      — OR —
                    </div>

                    {/* SVG Code Input */}
                    <div>
                      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: dark ? '#9ca3af' : '#4b5563', marginBottom: 6 }}>
                        Paste raw SVG code/markup
                      </label>
                      <textarea
                        value={sensorFormData.svgContent}
                        onChange={e => setSensorFormData({ ...sensorFormData, svgContent: e.target.value })}
                        placeholder='<svg xmlns="http://www.w3.org/2000/svg" ... > ... </svg>'
                        style={{ ...inputStyle, height: 80, padding: '10px 12px', resize: 'none', fontFamily: 'monospace', fontSize: 12 }}
                      />
                    </div>

                    {/* Preview / Revert Actions */}
                    {sensorFormData.svgContent && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, padding: '8px 12px', borderRadius: 8, background: dark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>✓ Custom SVG loaded</span>
                          <div style={{ width: 28, height: 28, background: dark ? '#22232a' : '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2, border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
                            <div 
                              style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              dangerouslySetInnerHTML={{ __html: sensorFormData.svgContent }} 
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSensorFormData(prev => ({ ...prev, svgContent: '' }))}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444',
                            fontSize: 12, fontWeight: 700, padding: 0
                          }}
                        >
                          Clear custom SVG
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fixed Footer */}
                <div style={{ padding: '20px 32px', borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', gap: 12, flexShrink: 0 }}>
                  {!isCreatingSensor && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the sensor template "${activeSensor?.name}"?`)) {
                          const updated = sensors.filter(s => s.id !== activeSensor?.id);
                          setSensors(updated);
                          localStorage.setItem('dt-sensor-catalog', JSON.stringify(updated));
                          setIsSensorEditModalOpen(false);
                        }
                      }}
                      style={{
                        padding: '0 16px', height: 44, borderRadius: 10, border: 'none',
                        background: '#ef4444', color: '#ffffff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      title="Delete this template from the catalog"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsSensorEditModalOpen(false)}
                    style={{
                      flex: 1, height: 44, borderRadius: 10, border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      background: 'transparent', color: dark ? '#f0f0f2' : '#17181c', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1, height: 44, borderRadius: 10, border: 'none',
                      background: '#00ffff', color: '#17181c', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    {isCreatingSensor ? 'Create Template' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lightbox Preview Modal */}
        {previewSvg && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(10,11,15,0.92)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000
          }} onClick={() => setPreviewSvg(null)}>
            {/* Modern Circular Close Button at top-right */}
            <button
              onClick={() => setPreviewSvg(null)}
              style={{
                position: 'absolute', top: 32, right: 32,
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#ffffff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            {/* Lightbox Content Container */}
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '90%', maxWidth: 500, height: '90%', maxHeight: 500,
                background: dark ? '#1c1d22' : '#ffffff',
                borderRadius: 32,
                border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 40, boxSizing: 'border-box'
              }}
            >
              {previewSvg.svgContent ? (
                <div 
                  style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  dangerouslySetInnerHTML={{ __html: previewSvg.svgContent }} 
                />
              ) : (
                <img 
                  src={`/assets/sensors/${previewSvg.svgName}.svg`} 
                  alt={previewSvg.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
