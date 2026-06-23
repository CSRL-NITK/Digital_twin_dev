import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Activity, LayoutDashboard, Share2 } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import StarTopology from './pages/StarTopology';
import './index.css';

function Navigation() {
  const location = useLocation();
  
  return (
    <nav className="glass-panel w-64 h-screen fixed left-0 top-0 p-6 flex flex-col z-50">
      <div className="flex items-center gap-3 mb-10 text-primary">
        <Activity size={32} />
        <h1 className="text-xl font-bold text-white tracking-tight">WaterTwin</h1>
      </div>
      
      <div className="flex flex-col gap-2 flex-grow">
        <Link 
          to="/" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:bg-surface-light hover:text-white'}`}
        >
          <LayoutDashboard size={20} />
          <span className="font-medium">Dashboard</span>
        </Link>
        <Link 
          to="/topology" 
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === '/topology' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:bg-surface-light hover:text-white'}`}
        >
          <Share2 size={20} />
          <span className="font-medium">Star Topology</span>
        </Link>
      </div>
      
      <div className="mt-auto">
        <div className="bg-surface-light/50 p-4 rounded-lg">
          <p className="text-xs text-text-muted">System Status</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-healthy animate-pulse"></div>
            <span className="text-sm font-medium">Live & Connected</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-background text-text">
        <Navigation />
        <main className="flex-1 ml-64 p-8 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/topology" element={<StarTopology />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
