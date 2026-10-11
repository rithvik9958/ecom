'use client';
import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/dashboard/Breadcrumb';
import DataTable from '@/components/dashboard/DataTable';
import TableToolbar from '@/components/dashboard/TableToolbar';
import { Badge } from '@/components/ui/badge';
import Toast from '@/components/dashboard/Toast';
import { Eye, Edit2 } from 'lucide-react';
import OrderModal from './OrderModal';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const addToast = (msg, type = 'success') => setToasts(t => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => {
    fetch('/api/admin/store-orders')
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = (updatedOrder) => {
    setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
    setModal(updatedOrder);
  };

  const handleBulkDelete = async (selectedIds) => {
    setBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map(id => 
        fetch(`/api/admin/store-orders/${id}`, { method: 'DELETE' })
      ));
      setOrders(prev => prev.filter(o => !selectedIds.includes(o._id)));
      addToast(`${selectedIds.length} orders deleted`, 'warning');
    } catch (e) {
      addToast('Error during bulk delete', 'danger');
    } finally {
      setBulkDeleting(false);
    }
  };

  const filteredData = orders.filter(o => 
    o._id?.toLowerCase().includes(search.toLowerCase()) || 
    o.email?.toLowerCase().includes(search.toLowerCase()) ||
    o.address?.firstName?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusVariant = (s) => {
    switch (s) {
      case 'paid': case 'delivered': return 'success';
      case 'pending': case 'processing': return 'warning';
      case 'shipped': return 'info';
      case 'cancelled': case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'Order ID / Date',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-foreground">#{row._id.substring(row._id.length - 8).toUpperCase()}</span>
          <span className="text-xs text-muted-foreground mt-0.5">{new Date(row.createdAt).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.address?.firstName} {row.address?.lastName}</span>
          <span className="text-xs text-muted-foreground mt-0.5">{row.email}</span>
        </div>
      )
    },
    {
      key: 'total',
      label: 'Total',
      render: (row) => (
        <span className="font-bold text-sm text-primary">₹{(row.total || 0).toLocaleString('en-IN')}</span>
      )
    },
    {
      key: 'status',
      label: 'Order Status',
      render: (row) => (
        <div className="flex flex-col gap-1 items-start">
          <Badge variant={getStatusVariant(row.status)}>
            {row.status.toUpperCase()}
          </Badge>
          {row.returnRequest && row.returnRequest.status && (
            <Badge variant="warning" className="text-[10px] uppercase font-bold">
              🔄 {row.returnRequest.status.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'payment',
      label: 'Payment Method / Status',
      render: (row) => {
        const rawMethod = String(row.paymentMethod || '').toLowerCase().trim();
        const hasStripe = Boolean(row.stripeSessionId);
        const isStripe = hasStripe || rawMethod === 'stripe' || rawMethod === 'card';
        const isUpi = rawMethod === 'upi';
        const methodLabel = isStripe ? 'CARD' : isUpi ? 'UPI' : 'COD';

        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-muted text-foreground border border-border uppercase tracking-wide">
              {methodLabel}
            </span>
            <Badge variant={getStatusVariant(row.paymentStatus || 'pending')} className="text-[10px] uppercase font-bold">
              {(row.paymentStatus || 'pending').toUpperCase()}
            </Badge>
          </div>
        );
      }
    },
    {
      key: 'actions',
      align: 'right',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setModal(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-muted text-muted-foreground hover:text-foreground"
            title="View Order"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setModal(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Order"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb 
        title="Store Orders" 
        subtitle={`Manage customer orders (${orders.length} total)`}
        crumbs={[{ label: 'Storefront Management' }, { label: 'Orders' }]} 
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
        onRowClick={(row) => setModal(row)}
        actions={false}
        onBulkDelete={handleBulkDelete}
        isBulkDeleting={bulkDeleting}
      />

      {modal && (
        <OrderModal 
          order={modal} 
          onClose={() => setModal(null)} 
          onSave={handleSave} 
          onToast={addToast}
        />
      )}
      
      <Toast toasts={toasts} onRemove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
