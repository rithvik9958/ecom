"use client";
import { useState, useEffect } from "react";
import { X, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Settings2, Layers, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import CustomSelect from '@/components/ui/CustomSelect';

const FIELD_TYPES = ["text", "number", "select", "multi-select", "boolean"];
const FILTER_TYPES = ["", "checkbox", "range", "color-swatch"];
const COMMON_UNITS = ["pcs", "gm", "kg", "ml", "L", "cm", "m", "inch", "dozen", "pack"];

const emptyAttr = () => ({
  key: "", label: "", type: "text", unit: "", options: [],
  required: false, showInFilter: false, filterType: "", filterOrder: 0, placeholder: "",
  _tmpId: Math.random().toString(36).slice(2),
});

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export default function AttributeTemplateModal({ template, onClose, onSave }) {
  const isEdit = !!template;

  const [form, setForm] = useState({
    name: "", slug: "", description: "",
    attributes: [], allowedUnits: [], defaultUnit: "pcs", variantDimensions: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedAttr, setExpandedAttr] = useState(null);
  const [unitInput, setUnitInput] = useState("");
  const [activeTab, setActiveTab] = useState("attributes"); // "attributes" | "variants" | "units"

  useEffect(() => {
    if (template) {
      setForm({
        name: template.name || "",
        slug: template.slug || "",
        description: template.description || "",
        attributes: (template.attributes || []).map((a) => ({ ...a, _tmpId: Math.random().toString(36).slice(2), options: a.options || [] })),
        allowedUnits: template.allowedUnits || [],
        defaultUnit: template.defaultUnit || "pcs",
        variantDimensions: template.variantDimensions || [],
      });
    }
  }, [template]);

  function setField(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleNameChange(v) {
    setForm((f) => ({ ...f, name: v, slug: isEdit ? f.slug : slugify(v) }));
  }

  // -- Attribute helpers --
  function addAttr() {
    const a = emptyAttr();
    setForm((f) => ({ ...f, attributes: [...f.attributes, a] }));
    setExpandedAttr(a._tmpId);
  }

  function removeAttr(tmpId) {
    const attr = form.attributes.find(a => a._tmpId === tmpId);
    setForm((f) => ({
      ...f,
      attributes: f.attributes.filter((a) => a._tmpId !== tmpId),
      variantDimensions: f.variantDimensions.filter(v => v !== attr?.key),
    }));
    if (expandedAttr === tmpId) setExpandedAttr(null);
  }

  function updateAttr(tmpId, key, val) {
    setForm((f) => ({
      ...f,
      attributes: f.attributes.map((a) =>
        a._tmpId === tmpId ? { ...a, [key]: val } : a
      ),
    }));
  }

  function addOption(tmpId) {
    setForm((f) => ({
      ...f,
      attributes: f.attributes.map((a) =>
        a._tmpId === tmpId ? { ...a, options: [...(a.options || []), ""] } : a
      ),
    }));
  }

  function updateOption(tmpId, idx, val) {
    setForm((f) => ({
      ...f,
      attributes: f.attributes.map((a) =>
        a._tmpId === tmpId ? { ...a, options: a.options.map((o, i) => i === idx ? val : o) } : a
      ),
    }));
  }

  function removeOption(tmpId, idx) {
    setForm((f) => ({
      ...f,
      attributes: f.attributes.map((a) =>
        a._tmpId === tmpId ? { ...a, options: a.options.filter((_, i) => i !== idx) } : a
      ),
    }));
  }

  // -- Variant dimension toggle --
  function toggleVariantDim(key) {
    setForm((f) => {
      const has = f.variantDimensions.includes(key);
      return { ...f, variantDimensions: has ? f.variantDimensions.filter(v => v !== key) : [...f.variantDimensions, key] };
    });
  }

  // -- Units --
  function addUnit(u) {
    const v = u.trim();
    if (!v || form.allowedUnits.includes(v)) return;
    setForm((f) => ({ ...f, allowedUnits: [...f.allowedUnits, v] }));
    setUnitInput("");
  }

  function removeUnit(u) {
    setForm((f) => ({ ...f, allowedUnits: f.allowedUnits.filter(x => x !== u) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.slug.trim()) { setError("Name and slug are required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        attributes: form.attributes.map(({ _tmpId, ...rest }) => rest),
      };
      const url = isEdit
        ? `/api/admin/attribute-templates/${template._id}`
        : "/api/admin/attribute-templates";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); return; }
      onSave(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition";
  const labelCls = "block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-bold text-base text-foreground">
                {isEdit ? "Edit Attribute Template" : "New Attribute Template"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">Define dynamic fields, filters & variants for a product category</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Template Name *</label>
                <input className={inputCls} value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Clothing" required />
              </div>
              <div>
                <label className={labelCls}>Slug * (auto-generated)</label>
                <input className={inputCls + " font-mono"} value={form.slug} onChange={e => setField("slug", slugify(e.target.value))} placeholder="clothing" required />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Description</label>
                <input className={inputCls} value={form.description} onChange={e => setField("description", e.target.value)} placeholder="Optional description" />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-border pb-3 overflow-x-auto no-scrollbar">
              {[
                { id: "attributes", label: "Attributes", icon: Settings2 },
                { id: "variants", label: "Variant Dimensions", icon: Layers },
                { id: "units", label: "Units", icon: Filter },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>

            {/* ── Tab: Attributes ── */}
            {activeTab === "attributes" && (
              <div className="space-y-3">
                {form.attributes.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                    No attributes yet. Click &quot;Add Attribute&quot; to define the first field.
                  </div>
                )}
                {form.attributes.map((attr, idx) => (
                  <div key={attr._tmpId} className="border border-border rounded-xl overflow-hidden bg-background">
                    {/* Attr header row */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition"
                      onClick={() => setExpandedAttr(expandedAttr === attr._tmpId ? null : attr._tmpId)}
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">
                            {attr.label || <span className="text-muted-foreground italic">Unnamed #{idx + 1}</span>}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{attr.type}</span>
                          {attr.required && <span className="text-xs text-red-500 font-bold">required</span>}
                          {attr.showInFilter && <span className="text-xs text-blue-500 font-bold">filter</span>}
                          {form.variantDimensions.includes(attr.key) && <span className="text-xs text-purple-500 font-bold">variant</span>}
                        </div>
                        {attr.key && <span className="text-xs font-mono text-muted-foreground">{attr.key}</span>}
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeAttr(attr._tmpId); }} className="w-7 h-7 rounded flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {expandedAttr === attr._tmpId ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </div>

                    {/* Attr expanded editor */}
                    {expandedAttr === attr._tmpId && (
                      <div className="border-t border-border bg-muted/20 p-4 grid grid-cols-2 gap-3">

                        <div>
                          <label className={labelCls}>Label (display name)</label>
                          <input className={inputCls} value={attr.label} onChange={e => { updateAttr(attr._tmpId, "label", e.target.value); if (!isEdit) updateAttr(attr._tmpId, "key", slugify(e.target.value)); }} placeholder="e.g. Net Weight" />
                        </div>
                        <div>
                          <label className={labelCls}>Key (machine name)</label>
                          <input className={inputCls + " font-mono"} value={attr.key} onChange={e => updateAttr(attr._tmpId, "key", slugify(e.target.value))} placeholder="net_weight" />
                        </div>

                        <div>
                          <label className={labelCls}>Field Type</label>
                          <CustomSelect
                            value={attr.type}
                            onChange={val => updateAttr(attr._tmpId, "type", val)}
                            size="md"
                            options={FIELD_TYPES.map(t => ({ value: t, label: t }))}
                          />
                        </div>

                        <div>
                          <label className={labelCls}>Unit (optional)</label>
                          <input className={inputCls} value={attr.unit} onChange={e => updateAttr(attr._tmpId, "unit", e.target.value)} placeholder="gm / kg / ml" />
                        </div>

                        <div>
                          <label className={labelCls}>Placeholder</label>
                          <input className={inputCls} value={attr.placeholder} onChange={e => updateAttr(attr._tmpId, "placeholder", e.target.value)} placeholder="e.g. Enter color name" />
                        </div>

                        <div className="flex flex-col gap-2 justify-end">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={attr.required} onChange={e => updateAttr(attr._tmpId, "required", e.target.checked)} className="accent-primary" />
                            <span className="text-sm text-foreground">Required field</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={attr.showInFilter} onChange={e => updateAttr(attr._tmpId, "showInFilter", e.target.checked)} className="accent-primary" />
                            <span className="text-sm text-foreground">Show in filters</span>
                          </label>
                        </div>

                        {attr.showInFilter && (
                          <div>
                            <label className={labelCls}>Filter UI Type</label>
                            <CustomSelect
                              value={attr.filterType || ""}
                              onChange={val => updateAttr(attr._tmpId, "filterType", val)}
                              size="md"
                              options={FILTER_TYPES.map(t => ({ value: t, label: t || "— select —" }))}
                            />
                          </div>
                        )}

                        {/* Options for select/multi-select */}
                        {(attr.type === "select" || attr.type === "multi-select") && (
                          <div className="col-span-2">
                            <label className={labelCls}>Options</label>
                            <div className="flex flex-col gap-1.5">
                              {(attr.options || []).map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <input className={inputCls} value={opt} onChange={e => updateOption(attr._tmpId, i, e.target.value)} placeholder={`Option ${i + 1}`} />
                                  <button type="button" onClick={() => removeOption(attr._tmpId, i)} className="w-7 h-7 rounded bg-red-500/10 text-red-500 flex items-center justify-center shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              ))}
                              <button type="button" onClick={() => addOption(attr._tmpId)} className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline mt-1">
                                <Plus className="w-3.5 h-3.5" /> Add Option
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <button type="button" onClick={addAttr} className="flex items-center gap-2 w-full justify-center px-4 py-2.5 border-2 border-dashed border-border rounded-xl text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition">
                  <Plus className="w-4 h-4" /> Add Attribute
                </button>
              </div>
            )}

            {/* ── Tab: Variant Dimensions ── */}
            {activeTab === "variants" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Select which attributes define a variant. Each unique combination (e.g. Size=M + Color=Red) will be a separate SKU with its own price and stock.</p>
                {form.attributes.filter(a => a.key).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                    Add attributes first, then choose which ones define variants.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {form.attributes.filter(a => a.key).map(attr => {
                    const active = form.variantDimensions.includes(attr.key);
                    return (
                      <button key={attr._tmpId} type="button"
                        onClick={() => toggleVariantDim(attr.key)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition ${active ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30" : "border-border hover:border-border/80"}`}
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${active ? "border-purple-500 bg-purple-500" : "border-muted-foreground"}`}>
                          {active && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{attr.label || attr.key}</div>
                          <div className="text-xs font-mono text-muted-foreground">{attr.key}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {form.variantDimensions.length > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                    <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="text-sm text-purple-700 dark:text-purple-300">
                      Variants defined by: <strong>{form.variantDimensions.join(" + ")}</strong>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Units ── */}
            {activeTab === "units" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Define allowed measurement units for this category. These will appear as options when entering quantities.</p>
                <div className="max-w-xs">
                  <label className={labelCls}>Default Unit</label>
                  <CustomSelect
                    value={form.defaultUnit}
                    onChange={val => setField("defaultUnit", val)}
                    size="md"
                    options={[...COMMON_UNITS, ...form.allowedUnits.filter(u => !COMMON_UNITS.includes(u))].map(u => ({
                      value: u,
                      label: u
                    }))}
                  />
                </div>
                <div>
                  <label className={labelCls}>Allowed Units</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.allowedUnits.map(u => (
                      <span key={u} className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-lg text-sm font-mono font-semibold">
                        {u}
                        <button type="button" onClick={() => removeUnit(u)} className="text-muted-foreground hover:text-red-500 transition">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {!form.allowedUnits.length && <span className="text-sm text-muted-foreground">No units added yet</span>}
                  </div>
                  <div className="flex gap-2 max-w-sm">
                    <input className={inputCls} value={unitInput} onChange={e => setUnitInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUnit(unitInput); }}} placeholder="Type unit and press Enter..." />
                    <button type="button" onClick={() => addUnit(unitInput)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shrink-0 hover:opacity-90 transition">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {COMMON_UNITS.filter(u => !form.allowedUnits.includes(u)).map(u => (
                      <button key={u} type="button" onClick={() => setForm(f => ({ ...f, allowedUnits: [...f.allowedUnits, u] }))} className="px-2 py-0.5 border border-dashed border-border rounded text-xs text-muted-foreground hover:border-primary hover:text-primary transition font-mono">
                        + {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Update Template" : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}