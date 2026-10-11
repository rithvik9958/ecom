'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';
import "@/components/dashboard/dashboard.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import { ThemeProvider } from '@/components/dashboard/ThemeProvider';
import { Toaster } from 'react-hot-toast';

function DashboardGuard({ children }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/admin-login';
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0f172a] flex flex-col items-center justify-center z-50">
        {/* Outer spinning ring */}
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-slate-700/50 border-t-primary animate-spin" />
          <div className="absolute w-14 h-14 rounded-full border-4 border-slate-700/30 border-b-primary/60 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
          {/* Brand Letter in center */}
          <div className="absolute w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shadow-xl overflow-hidden">
            <span className="font-extrabold text-primary text-lg">E</span>
          </div>
        </div>
        {/* Brand text */}
        <div className="mt-6 text-center">
          <h2 className="text-white font-bold text-base tracking-wide">EShop Admin</h2>
          <p className="text-slate-400 text-xs mt-0.5 tracking-widest uppercase">Admin Panel</p>
        </div>
        {/* Loading dots */}
        <div className="flex gap-1.5 mt-5">
          {[0, 0.2, 0.4].map((delay, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return children;
}

import { applyDashboardCSSVariables } from '@/components/dashboard/DashboardThemeConfig';

function DashboardShell({ children }) {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const applyFaviconAndTheme = () => {
      fetch('/api/admin/theme')
        .then(res => res.json())
        .then(data => {
          if (data.theme?.favicon) {
            let link = document.querySelector("link[rel*='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'shortcut icon';
              document.head.appendChild(link);
            }
            link.href = data.theme.favicon;
          }
          if (data.theme?.dashboardTheme) {
            applyDashboardCSSVariables(data.theme.dashboardTheme);
          }
        })
        .catch(() => {});
    };

    applyFaviconAndTheme();
    window.addEventListener('themeUpdated', applyFaviconAndTheme);
    window.addEventListener('dashboardThemeUpdated', applyFaviconAndTheme);
    return () => {
      window.removeEventListener('themeUpdated', applyFaviconAndTheme);
      window.removeEventListener('dashboardThemeUpdated', applyFaviconAndTheme);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground font-inter antialiased transition-colors duration-200">
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
        <Topbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <DashboardGuard>
          <DashboardShell>
            {children}
          </DashboardShell>
        </DashboardGuard>
      </AuthProvider>
      <Toaster position="bottom-right" reverseOrder={false} />
    </ThemeProvider>
  );
}
