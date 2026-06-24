import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import StatusBar from './StatusBar';

export default function MainLayout() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-text">
      <Navbar />
      
      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden bg-surface-light">
        <Outlet />
      </main>

      <StatusBar />
    </div>
  );
}
