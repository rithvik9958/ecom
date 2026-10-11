"use client";
import { useState, useEffect } from "react";
import Breadcrumb from "@/components/dashboard/Breadcrumb";
import DataTable from "@/components/dashboard/DataTable";
import TableToolbar from "@/components/dashboard/TableToolbar";
import ConfirmDeleteModal from "@/components/dashboard/ConfirmDeleteModal";
import Toast from "@/components/dashboard/Toast";
import StatusSwitch from "@/components/dashboard/StatusSwitch";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Settings2 } from "lucide-react";
import AttributeTemplateModal from "./AttributeTemplateModal";

export default function AttributeTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [togglingId, setTogglingId] = useState(null);

  const addToast = (msg, type = "success") =>
    setToasts((t) => [...t, { id: Date.now(), message: msg, type }]);

  useEffect(() => {
    fetch("/api/admin/attribute-templates")
      .then((r) => r.json())
      .then((data) => { setTemplates(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = (saved) => {
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t._id === saved._id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
    setModal(null);
    addToast("Template saved successfully");
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/admin/attribute-templates/${confirmDelete}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t._id !== confirmDelete));
      addToast("Template deleted", "warning");
    } catch { addToast("Failed to delete", "danger"); }
    finally { setDeleting(false); setConfirmDelete(null); }
  };

  const handleToggle = async (id, cur) => {
    try {
      setTogglingId(id);
      const res = await fetch(`/api/admin/attribute-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !cur }),
      });
      if (res.ok) {
        setTemplates((prev) => prev.map((t) => t._id === id ? { ...t, isActive: !cur } : t));
        addToast("Template status updated");
      } else {
        throw new Error("Failed to update status");
      }
    } catch (e) {
      addToast(e.message || "Failed to update", "danger");
    } finally {
      setTogglingId(null);
    }
  };

  const handleReorder = (reorderedList) => {
    setTemplates(reorderedList);
    addToast("Template order updated");
  };

  const filtered = templates.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      key: "icon",
      label: "",
      render: () => (
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Settings2 className="w-4 h-4 text-primary" />
        </div>
      ),
    },
    {
      key: "details",
      label: "Template",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-foreground">{row.name}</span>
          <span className="text-xs text-muted-foreground font-mono mt-0.5">{row.slug}</span>
        </div>
      ),
    },
    {
      key: "attrs",
      label: "Attributes",
      render: (row) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {(row.attributes || []).slice(0, 4).map((a) => (
            <Badge key={a.key} variant="outline" className="text-xs">{a.label}</Badge>
          ))}
          {(row.attributes || []).length > 4 && (
            <Badge variant="secondary" className="text-xs">+{row.attributes.length - 4} more</Badge>
          )}
          {!(row.attributes || []).length && (
            <span className="text-xs text-muted-foreground">No attributes</span>
          )}
        </div>
      ),
    },
    {
      key: "variants",
      label: "Variant Dims",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.variantDimensions || []).map((v) => (
            <Badge key={v} className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">{v}</Badge>
          ))}
          {!(row.variantDimensions || []).length && (
            <span className="text-xs text-muted-foreground">None</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Active",
      render: (row) => (
        <StatusSwitch
          checked={row.isActive !== false}
          loading={togglingId === row._id}
          onCheckedChange={() => handleToggle(row._id, row.isActive !== false)}
          label={row.isActive !== false ? "Active" : "Inactive"}
        />
      ),
    },
    {
      key: "actions",
      align: "right",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setModal(row); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-primary/10 text-primary hover:bg-primary/20"
            title="Edit Template"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(row._id); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors bg-destructive/10 text-destructive hover:bg-destructive/20"
            title="Delete Template"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-background min-h-full">
      <Breadcrumb
        title="Attribute Templates"
        subtitle={`Dynamic attribute schemas per product category (${templates.length} total)`}
        crumbs={[{ label: "Storefront Management" }, { label: "Attribute Templates" }]}
      />

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        hideSort
        onAdd={() => setModal("new")}
        addLabel="New Template"
      />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        onRowClick={(row) => setModal(row)}
        actions={false}
        onReorder={handleReorder}
      />

      {modal && (
        <AttributeTemplateModal
          template={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      <ConfirmDeleteModal
        isOpen={!!confirmDelete}
        isDeleting={deleting}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Template"
        message="Delete this attribute template? Products using it will keep their saved attrs but lose the schema definition."
      />

      <Toast toasts={toasts} onRemove={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}