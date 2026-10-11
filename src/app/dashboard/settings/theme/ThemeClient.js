'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ThemeClient() {
  const [theme, setTheme] = useState({
    primaryColor: '#000000',
    secondaryColor: '#333333',
    backgroundColor: '#ffffff',
    textColor: '#111111'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    try {
      const res = await fetch('/api/admin/theme');
      if (res.ok) {
        const data = await res.json();
        setTheme({
          primaryColor: data.primaryColor || '#000000',
          secondaryColor: data.secondaryColor || '#333333',
          backgroundColor: data.backgroundColor || '#ffffff',
          textColor: data.textColor || '#111111'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme)
      });
      
      if (!res.ok) {
        throw new Error('Failed to save theme');
      }
      setSuccess('Theme updated successfully! Changes will apply to the storefront immediately.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading theme settings...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <form onSubmit={handleSave} className="space-y-6 bg-card p-6 rounded-lg border border-border shadow-sm">
        {error && <div className="text-red-500 text-sm p-3 bg-red-50 rounded">{error}</div>}
        {success && <div className="text-green-600 text-sm p-3 bg-green-50 rounded">{success}</div>}

        <div className="space-y-2">
          <label className="text-sm font-medium">Primary Color</label>
          <div className="flex gap-4 items-center">
            <Input 
              type="color" 
              value={theme.primaryColor} 
              onChange={e => setTheme({...theme, primaryColor: e.target.value})}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input 
              type="text" 
              value={theme.primaryColor} 
              onChange={e => setTheme({...theme, primaryColor: e.target.value})}
              className="uppercase font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground">Used for buttons, links, and primary accents.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Secondary / Hover Color</label>
          <div className="flex gap-4 items-center">
            <Input 
              type="color" 
              value={theme.secondaryColor} 
              onChange={e => setTheme({...theme, secondaryColor: e.target.value})}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input 
              type="text" 
              value={theme.secondaryColor} 
              onChange={e => setTheme({...theme, secondaryColor: e.target.value})}
              className="uppercase font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground">Used for button hovers and secondary accents.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Background Color</label>
          <div className="flex gap-4 items-center">
            <Input 
              type="color" 
              value={theme.backgroundColor} 
              onChange={e => setTheme({...theme, backgroundColor: e.target.value})}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input 
              type="text" 
              value={theme.backgroundColor} 
              onChange={e => setTheme({...theme, backgroundColor: e.target.value})}
              className="uppercase font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground">Used for the main website background.</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Text Color</label>
          <div className="flex gap-4 items-center">
            <Input 
              type="color" 
              value={theme.textColor} 
              onChange={e => setTheme({...theme, textColor: e.target.value})}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input 
              type="text" 
              value={theme.textColor} 
              onChange={e => setTheme({...theme, textColor: e.target.value})}
              className="uppercase font-mono"
            />
          </div>
          <p className="text-xs text-muted-foreground">Used for headings and main body text.</p>
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Theme Configuration'}
        </Button>
      </form>

      {/* Live Preview Pane */}
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[400px]">
        <h3 className="text-sm font-medium absolute top-4 left-4 text-muted-foreground">Live Storefront Preview</h3>
        
        <div 
          className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl transition-colors duration-300 relative border"
          style={{ backgroundColor: theme.backgroundColor, borderColor: '#eee' }}
        >
          {/* Mock Header */}
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: '#eaeaea' }}>
            <div className="font-bold text-lg" style={{ color: theme.primaryColor }}>Your Brand</div>
            <div className="flex gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primaryColor, opacity: 0.2 }}></div>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primaryColor, opacity: 0.2 }}></div>
            </div>
          </div>
          
          {/* Mock Body */}
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold" style={{ color: theme.textColor }}>Discover Luxury</h2>
            <p className="text-sm opacity-80" style={{ color: theme.textColor }}>Experience the finest quality products curated just for you.</p>
            
            <div className="pt-4 space-y-3">
              <button 
                className="w-full py-2.5 rounded-lg text-white font-medium text-sm transition-colors duration-300"
                style={{ backgroundColor: theme.primaryColor }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.secondaryColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = theme.primaryColor}
              >
                Shop Collection
              </button>
              
              <button 
                className="w-full py-2.5 rounded-lg font-medium text-sm border-2 transition-colors duration-300 bg-transparent"
                style={{ color: theme.primaryColor, borderColor: theme.primaryColor }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.primaryColor; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = theme.primaryColor; }}
              >
                View Lookbook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
