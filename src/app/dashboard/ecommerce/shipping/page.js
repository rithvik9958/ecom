'use client';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import Toast from '@/components/dashboard/Toast';
import { Truck, Map, Settings, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ZoneTab from './ZoneTab';
import MethodTab from './MethodTab';
import RuleTab from './RuleTab';

export default function ShippingManagementPage() {
  const [activeTab, setActiveTab] = useState('rules'); // 'zones', 'methods', 'rules'
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb
        title="Delivery Management"
        subtitle="Configure zones, delivery methods, and shipping rules matrix"
        crumbs={[
          { label: 'Storefront Management', href: '/dashboard/ecommerce' },
          { label: 'Shipping Rules' }
        ]}
      />

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="flex flex-wrap gap-2 border-b border-border p-3 pb-3">
          <button onClick={() => setActiveTab('rules')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'rules' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
            <Settings size={14} /> Shipping Rules Matrix
          </button>
          <button onClick={() => setActiveTab('methods')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'methods' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
            <Truck size={14} /> Delivery Methods
          </button>
          <button onClick={() => setActiveTab('zones')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'zones' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'}`}>
            <Map size={14} /> Pincode Zones
          </button>
        </div>

        
        <div className="p-6">
           {activeTab === 'rules' && <RuleTab />}
           {activeTab === 'methods' && <MethodTab />}
           {activeTab === 'zones' && <ZoneTab />}
        </div>
      </div>
    </div>
  );
}
