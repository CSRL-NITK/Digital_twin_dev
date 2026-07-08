import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, Plus, Trash2, Edit2, Server, LayoutTemplate, 
  ExternalLink, Search, X, AlertCircle, Loader2
} from 'lucide-react';
import { useTheme } from '../components/ThemeProvider';
import BorderGlow from '../components/ui/BorderGlow';
import PushableButton from '../components/ui/PushableButton';

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

  // Helper to safely extract description if it was stored as JSON
  const getDisplayDescription = (desc: string | null) => {
    if (!desc) return '';
    try {
      const parsed = JSON.parse(desc);
      if (parsed && typeof parsed === 'object') {
        return parsed.description || parsed.notes || 'Configuration Data';
      }
    } catch (e) {
      // Not JSON
    }
    return desc;
  };

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [activeTopology, setActiveTopology] = useState<Topology | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
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

  const openEdit = (topology: Topology) => {
    setActiveTopology(topology);
    setFormData({ name: topology.name, description: getDisplayDescription(topology.description) });
    setIsEditModalOpen(true);
  };

  const openDelete = (topology: Topology) => {
    setActiveTopology(topology);
    setIsDeleteModalOpen(true);
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: dark ? 'rgba(0,255,255,0.1)' : 'rgba(0,200,200,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${dark ? 'rgba(0,255,255,0.2)' : 'rgba(0,200,200,0.2)'}`
            }}>
              <Server size={24} color={dark ? '#00ffff' : '#00c8c8'} />
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.5px' }}>
              Topologies
            </h1>
          </div>
          <p style={{ color: dark ? '#9ca3af' : '#6b7280', margin: 0, fontSize: 15, paddingLeft: 56 }}>
            Manage and launch your topologies.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ position: 'relative', width: 300 }}>
            <Search size={18} color={dark ? '#9ca3af' : '#6b7280'} style={{ position: 'absolute', left: 16, top: 13 }} />
            <input 
              type="text" 
              placeholder="Search topologies..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', height: 44, padding: '0 16px 0 44px',
                borderRadius: 12, border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                background: dark ? '#1c1d22' : '#ffffff', color: dark ? '#fff' : '#000',
                fontSize: 14, outline: 'none'
              }}
            />
          </div>

          <PushableButton
            onClick={() => { setFormData({ name: '', description: '' }); setIsCreateModalOpen(true); }}
          >
            <Plus size={18} strokeWidth={2.5} />
            New Topology
          </PushableButton>
        </div>
      </div>

      {/* Grid */}
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
                
                {/* Context Menu / Actions */}
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
                margin: '0 0 20px', flex: 1,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {getDisplayDescription(topology.description) || 'No description provided.'}
              </p>

              {(() => {
                const counts = { tanks: 0, pumps: 0, valves: 0, sensors: 0 };
                if (topology.nodes) {
                  topology.nodes.forEach((n: any) => {
                    const type = n.nodeType?.toLowerCase();
                    if (type === 'tank' || type === 'reservoir') counts.tanks++;
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

                    <button
                      onClick={() => navigate(`/topology/${topology.id}`)}
                      style={{
                        height: 36, padding: '0 16px', borderRadius: 8, border: 'none',
                        background: dark ? '#22232a' : '#f3f4f6',
                        color: dark ? '#f0f0f2' : '#17181c', fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'background 0.15s',
                        width: '100%'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = dark ? '#2a2b33' : '#e5e7eb'}
                      onMouseLeave={e => e.currentTarget.style.background = dark ? '#22232a' : '#f3f4f6'}
                    >
                      Open Topology <ExternalLink size={14} />
                    </button>
                  </div>
                );
              })()}
              </div>
            </BorderGlow>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
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
      </div>
    </div>
  );
}
