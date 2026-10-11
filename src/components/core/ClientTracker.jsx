'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ClientTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track public routes (ignore dashboard / admin routes to avoid skewed analytics)
    if (pathname && !pathname.startsWith('/dashboard') && !pathname.startsWith('/login')) {
      let sessionId = sessionStorage.getItem('jindal_session_id');
      
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathname, sessionId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.sessionId) {
          sessionStorage.setItem('jindal_session_id', data.sessionId);
        }
      })
      .catch(err => console.error("Tracking failed:", err));
    }
  }, [pathname]);

  return null;
}
