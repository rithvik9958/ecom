'use client';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import DataTable from '@/components/dashboard/DataTable';
import TableToolbar from '@/components/dashboard/TableToolbar';
import { Badge } from '@/components/ui/badge';
import Toast from '@/components/dashboard/Toast';
import { Mail, Calendar, User, MapPin } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);
  
  useEffect(() => {
    fetch('/api/admin/store-customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleBulkDelete = async (selectedIds) => {
    setBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map(id => 
        fetch(`/api/admin/store-customers/${id}`, { method: 'DELETE' })
      ));
      setCustomers(prev => prev.filter(c => !selectedIds.includes(c._id) && !selectedIds.includes(c.id)));
      addToast(`${selectedIds.length} customers deleted`, 'warning');
    } catch (e) {
      addToast('Error during bulk delete', 'danger');
    } finally {
      setBulkDeleting(false);
    }
  };

  const filteredData = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: 'user',
      label: 'Customer',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
            {row.name ? row.name.charAt(0).toUpperCase() : <User size={16} />}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground">{row.name || 'Anonymous'}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Mail size={10} /> {row.email}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'addresses',
      label: 'Saved Addresses',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin size={14} className="text-primary/70" />
          <span>{row.addresses?.length || 0} locations</span>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Status',
      render: (row) => (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Active
        </Badge>
      )
    },
    {
      key: 'joined',
      label: 'Joined',
      render: (row) => (
        <div className="flex flex-col text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(row.createdAt).toLocaleDateString()}</span>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Customers" 
        subtitle={`View registered storefront users (${customers.length} total)`}
        crumbs={[{ label: 'Storefront Management' }, { label: 'Customers' }]} 
      />
      
      <TableToolbar 
        search={search}
        onSearchChange={setSearch}
        hideSort={true}
      />

      <DataTable 
        columns={columns}
        data={filteredData}
        loading={loading}
        actions={false}
        onBulkDelete={handleBulkDelete}
        isBulkDeleting={bulkDeleting}
      />
      
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
