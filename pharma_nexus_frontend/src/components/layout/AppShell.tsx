import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import FloatingAssistant from '../features/ai/FloatingAssistant';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-[240px]">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main key={location.pathname} className="mx-auto max-w-[1400px] animate-fade-in px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
      <FloatingAssistant />
    </div>
  );
}
