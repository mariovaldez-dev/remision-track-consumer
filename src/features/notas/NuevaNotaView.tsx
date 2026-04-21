import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Eye, EyeOff, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';

interface Cliente { id: string; nombreComercial: string; rfc?: string; direccionCalle?: string; direccionCiudad?: string; email?: string }
interface Producto { id: string; nombre: string; precioUnitario: number; unidadMedida?: string }

interface Item {
  key: number;
  productoId: string;
  descripcion: string;
  cantidad: number;
  unidadMedida: string;
  precioUnitario: number;
  descuentoPct: number;
}

const fmtMXN = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

const today = () => new Date().toISOString().split('T')[0];

let _key = 0;
const newItem = (): Item => ({ key: ++_key, productoId: '', descripcion: '', cantidad: 1, unidadMedida: 'PZA', precioUnitario: 0, descuentoPct: 0 });

const inputCls = 'w-full h-9 rounded-lg border border-input bg-card px-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
const labelCls = 'block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1';

export const NuevaNotaView = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClientSaving, setNewClientSaving] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ nombreComercial: '', rfc: '', email: '', telefono: '' });

  const handleQuickCreateCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewClientSaving(true);
    try {
      const { data } = await api.post('/clientes', {
        nombreComercial: newClientForm.nombreComercial,
        ...(newClientForm.rfc && { rfc: newClientForm.rfc }),
        ...(newClientForm.email && { email: newClientForm.email }),
        ...(newClientForm.telefono && { telefono: newClientForm.telefono }),
      });
      const created: Cliente = data.data ?? data;
      setClientes((prev) => [...prev, created]);
      setClienteId(created.id);
      setNewClientOpen(false);
      setNewClientForm({ nombreComercial: '', rfc: '', email: '', telefono: '' });
      toast.success(`Cliente "${created.nombreComercial}" creado`);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al crear cliente');
    } finally {
      setNewClientSaving(false);
    }
  };

  const [clienteId, setClienteId] = useState('');
  const [folioMode, setFolioMode] = useState<'auto' | 'manual'>('auto');
  const [folioManual, setFolioManual] = useState('');
  const [fechaEmision, setFechaEmision] = useState(today());
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [condicionesPago, setCondicionesPago] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<Item[]>([newItem()]);

  useEffect(() => {
    api.get('/clientes').then(({ data }) => setClientes(data.data)).catch(() => {});
    api.get('/productos').then(({ data }) => setProductos(data.data)).catch(() => {});
  }, []);

  const selectedCliente = clientes.find((c) => c.id === clienteId);

  const updateItem = (key: number, field: keyof Item, value: string | number) =>
    setItems((prev) => prev.map((it) => {
      if (it.key !== key) return it;
      const updated = { ...it, [field]: value };
      if (field === 'productoId' && value) {
        const prod = productos.find((p) => p.id === value);
        if (prod) {
          updated.descripcion = prod.nombre;
          updated.precioUnitario = prod.precioUnitario;
          updated.unidadMedida = prod.unidadMedida ?? 'PZA';
        }
      }
      return updated;
    }));

  const removeItem = (key: number) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));

  const subtotalItem = (it: Item) => it.cantidad * it.precioUnitario;
  const descuentoItem = (it: Item) => subtotalItem(it) * (it.descuentoPct / 100);
  const totalItem = (it: Item) => subtotalItem(it) - descuentoItem(it);

  const subtotal = items.reduce((s, it) => s + subtotalItem(it), 0);
  const descuento = items.reduce((s, it) => s + descuentoItem(it), 0);
  const total = subtotal - descuento;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) { toast.error('Selecciona un cliente'); return; }
    if (items.every((it) => !it.descripcion && !it.productoId)) {
      toast.error('Agrega al menos un item'); return;
    }
    setSaving(true);
    try {
      await api.post('/notas', {
        clienteId,
        fechaEmision,
        fechaVencimiento: fechaVencimiento || undefined,
        condicionesPago: condicionesPago || undefined,
        observaciones: observaciones || undefined,
        ...(folioMode === 'manual' && folioManual.trim() && { folioManual: folioManual.trim() }),
        items: items.map(({ productoId, descripcion, cantidad, unidadMedida, precioUnitario, descuentoPct }) => ({
          productoId: productoId || undefined,
          descripcion: descripcion || undefined,
          cantidad,
          unidadMedida,
          precioUnitario,
          descuentoPct,
        })),
      });
      toast.success('Nota de remisión creada');
      navigate('/notas');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al crear la nota');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <PageHeader
        title="Nueva Nota de Remisión"
        backTo="/notas"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs rounded-lg"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPreview ? 'Ocultar preview' : 'Ver preview'}
            </Button>
            <Button type="submit" size="sm" className="gap-1.5 text-xs rounded-lg shadow-sm shadow-primary/25" disabled={saving}>
              {saving ? (
                <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={13} />
              )}
              Guardar nota
            </Button>
          </>
        }
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Form column */}
        <div className={cn(
          'flex-1 overflow-y-auto p-4 md:p-6 space-y-6 transition-all duration-300',
          showPreview && 'md:max-w-[58%]'
        )}>

          {/* Header section */}
          <section>
            <h2 className="text-[13px] font-bold text-foreground mb-4">Encabezado</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Fecha de emisión</label>
                <input type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Fecha de vencimiento</label>
                <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Folio */}
            <div className="mt-4">
              <label className={labelCls}>Folio</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFolioMode('auto')}
                  className={cn(
                    'h-9 px-3 rounded-lg text-xs font-semibold border transition-colors',
                    folioMode === 'auto'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-input hover:border-primary/50'
                  )}
                >
                  Autogenerar
                </button>
                <button
                  type="button"
                  onClick={() => setFolioMode('manual')}
                  className={cn(
                    'h-9 px-3 rounded-lg text-xs font-semibold border transition-colors',
                    folioMode === 'manual'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-input hover:border-primary/50'
                  )}
                >
                  Manual
                </button>
                {folioMode === 'manual' && (
                  <input
                    value={folioManual}
                    onChange={(e) => setFolioManual(e.target.value.toUpperCase())}
                    placeholder="Ej. NR-2026-CLIENTE-01"
                    className={cn(inputCls, 'flex-1 font-mono')}
                  />
                )}
                {folioMode === 'auto' && (
                  <span className={cn(inputCls, 'flex-1 text-muted-foreground/60 italic text-xs flex items-center')}>
                    Se asignará automáticamente al guardar
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className={labelCls}>Cliente *</label>
              <div className="flex gap-2">
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className={cn(inputCls, 'flex-1 cursor-pointer')}
                >
                  <option value="">Buscar cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombreComercial}{c.rfc ? ` — ${c.rfc}` : ''}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setNewClientOpen(true)}
                  className="h-9 px-3 rounded-lg border border-primary text-primary text-xs font-semibold hover:bg-accent transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Plus size={13} /> Nuevo cliente
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className={labelCls}>Condiciones de pago</label>
                <select value={condicionesPago} onChange={(e) => setCondicionesPago(e.target.value)} className={cn(inputCls, 'cursor-pointer')}>
                  <option value="">Seleccionar...</option>
                  <option>Contado</option>
                  <option>15 días</option>
                  <option>30 días</option>
                  <option>45 días</option>
                  <option>60 días</option>
                  <option>Crédito</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Observaciones</label>
                <input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Notas adicionales..." className={inputCls} />
              </div>
            </div>
          </section>

          <div className="border-t border-border" />

          {/* Items section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[13px] font-bold text-foreground">Conceptos</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setItems((p) => [...p, newItem()])}
                  className="h-8 px-3 rounded-lg border border-primary text-primary text-xs font-semibold hover:bg-accent transition-colors flex items-center gap-1.5"
                >
                  <Plus size={13} /> Agregar concepto
                </button>
              </div>
            </div>

            {/* Items table header — hidden on mobile */}
            <div className="hidden sm:grid grid-cols-[1fr_70px_80px_90px_70px_32px] gap-2 px-1 mb-1.5">
              {['Descripción / Producto', 'Cant.', 'U.M.', 'P. Unitario', 'Desc. %', ''].map((h) => (
                <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</span>
              ))}
            </div>

            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.key} className="grid grid-cols-1 sm:grid-cols-[1fr_70px_80px_90px_70px_32px] gap-2 items-start sm:items-center bg-card border border-border rounded-xl px-3 py-3">
                  <div>
                    <select
                      value={it.productoId}
                      onChange={(e) => updateItem(it.key, 'productoId', e.target.value)}
                      className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 mb-1"
                    >
                      <option value="">Producto (opcional)</option>
                      {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                    <input
                      value={it.descripcion}
                      onChange={(e) => updateItem(it.key, 'descripcion', e.target.value)}
                      placeholder="Descripción del concepto..."
                      className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div className="grid grid-cols-4 sm:contents gap-2">
                    <div className="col-span-1">
                      <p className="text-[10px] text-muted-foreground mb-0.5 sm:hidden">Cant.</p>
                      <input type="number" min="1" value={it.cantidad} onChange={(e) => updateItem(it.key, 'cantidad', +e.target.value)} className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div className="col-span-1">
                      <p className="text-[10px] text-muted-foreground mb-0.5 sm:hidden">U.M.</p>
                      <input value={it.unidadMedida} onChange={(e) => updateItem(it.key, 'unidadMedida', e.target.value)} placeholder="PZA" className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div className="col-span-1">
                      <p className="text-[10px] text-muted-foreground mb-0.5 sm:hidden">Precio</p>
                      <input type="number" min="0" step="0.01" value={it.precioUnitario} onChange={(e) => updateItem(it.key, 'precioUnitario', +e.target.value)} className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div className="col-span-1">
                      <p className="text-[10px] text-muted-foreground mb-0.5 sm:hidden">Desc.%</p>
                      <input type="number" min="0" max="100" value={it.descuentoPct} onChange={(e) => updateItem(it.key, 'descuentoPct', +e.target.value)} className="w-full h-7 rounded-md border border-input bg-background px-2 text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                  </div>
                  <button type="button" onClick={() => removeItem(it.key)} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors self-start sm:self-center">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-56 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>{fmtMXN(subtotal)}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Descuento</span><span>- {fmtMXN(descuento)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-1.5 flex justify-between font-bold text-foreground">
                  <span>Total</span><span className="text-primary">{fmtMXN(total)}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Preview column — desktop only as side panel, mobile as bottom sheet */}
        {showPreview && (
          <>
            {/* Desktop side panel */}
            <div className="hidden md:block w-[42%] shrink-0 border-l border-border bg-muted/30 overflow-y-auto p-6">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6 text-sm">
              {/* Preview header */}
              <div className="flex items-start justify-between mb-5">
                <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-md shadow-primary/30">
                  <FileText size={15} className="text-white" />
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-foreground">Nota de Remisión</p>
                  <p className="text-xs text-muted-foreground">Folio: NR-{new Date().getFullYear()}-####</p>
                  <p className="text-xs text-muted-foreground">Emisión: {fechaEmision || '—'}</p>
                </div>
              </div>

              {/* Client info */}
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Cliente</p>
                {selectedCliente ? (
                  <div>
                    <p className="font-semibold text-foreground">{selectedCliente.nombreComercial}</p>
                    {selectedCliente.rfc && <p className="text-xs text-muted-foreground">RFC: {selectedCliente.rfc}</p>}
                    {selectedCliente.email && <p className="text-xs text-muted-foreground">{selectedCliente.email}</p>}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs italic">Sin cliente seleccionado</p>
                )}
              </div>

              {condicionesPago && (
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Condiciones</p>
                  <p className="text-xs text-foreground">{condicionesPago}</p>
                </div>
              )}

              {/* Items table */}
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Conceptos</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 text-muted-foreground font-semibold">Descripción</th>
                      <th className="text-center py-1.5 text-muted-foreground font-semibold">Cant.</th>
                      <th className="text-right py-1.5 text-muted-foreground font-semibold">Precio</th>
                      <th className="text-right py-1.5 text-muted-foreground font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.key} className="border-b border-border/50">
                        <td className="py-1.5 text-foreground">{it.descripcion || <span className="text-muted-foreground/50 italic">—</span>}</td>
                        <td className="py-1.5 text-center text-muted-foreground">{it.cantidad} {it.unidadMedida}</td>
                        <td className="py-1.5 text-right text-muted-foreground">{fmtMXN(it.precioUnitario)}</td>
                        <td className="py-1.5 text-right font-medium">{fmtMXN(totalItem(it))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-1 text-xs border-t border-border pt-3">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>{fmtMXN(subtotal)}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Descuento</span><span>- {fmtMXN(descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-border">
                  <span>Total Due</span>
                  <span className="text-primary">{fmtMXN(total)}</span>
                </div>
              </div>

              {observaciones && (
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Observaciones</p>
                  <p className="text-xs text-muted-foreground">{observaciones}</p>
                </div>
              )}

              {/* Footer */}
              <div className="mt-5 pt-3 border-t border-border/50 flex items-center gap-2">
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <FileText size={10} className="text-white" />
                </div>
                <p className="text-[10px] text-muted-foreground/60">
                  Emitido por: {user?.nombre} {user?.apellido}
                </p>
              </div>
            </div>
            </div>

            {/* Mobile bottom sheet overlay */}
            <div
              className="md:hidden fixed inset-0 z-50 flex flex-col justify-end"
              onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false); }}
            >
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPreview(false)} />
              <div className="relative bg-card rounded-t-2xl border-t border-border shadow-2xl overflow-y-auto max-h-[85dvh] p-5 z-10">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-bold text-foreground">Vista previa</p>
                  <button type="button" onClick={() => setShowPreview(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold leading-none">&times;</button>
                </div>
                {/* Reuse preview content */}
                <div className="text-sm space-y-3">
                  <div className="flex justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Cliente</p>
                    <p className="text-xs">{selectedCliente?.nombreComercial ?? 'Sin cliente'}</p>
                  </div>
                  <table className="w-full text-xs">
                    <thead><tr className="border-b"><th className="text-left py-1">Descripción</th><th className="text-right py-1">Cant.</th><th className="text-right py-1">Total</th></tr></thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.key} className="border-b border-border/50">
                          <td className="py-1">{it.descripcion || '—'}</td>
                          <td className="py-1 text-right">{it.cantidad} {it.unidadMedida}</td>
                          <td className="py-1 text-right font-medium">{fmtMXN(totalItem(it))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">{fmtMXN(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Modal open={newClientOpen} onClose={() => setNewClientOpen(false)} title="Nuevo cliente" subtitle="Se agregará y seleccionará automáticamente">
        <form onSubmit={handleQuickCreateCliente} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Nombre comercial *</label>
            <input required value={newClientForm.nombreComercial} onChange={(e) => setNewClientForm((f) => ({ ...f, nombreComercial: e.target.value }))} className={inputCls} placeholder="Razón social o nombre" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>RFC</label>
              <input value={newClientForm.rfc} onChange={(e) => setNewClientForm((f) => ({ ...f, rfc: e.target.value }))} className={inputCls} placeholder="RFC opcional" />
            </div>
            <div>
              <label className={labelCls}>Teléfono</label>
              <input value={newClientForm.telefono} onChange={(e) => setNewClientForm((f) => ({ ...f, telefono: e.target.value }))} className={inputCls} placeholder="10 dígitos" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={newClientForm.email} onChange={(e) => setNewClientForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} placeholder="correo@ejemplo.com" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1 rounded-lg h-9" onClick={() => setNewClientOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 rounded-lg h-9 shadow-sm shadow-primary/20" disabled={newClientSaving}>
              {newClientSaving ? 'Guardando...' : 'Crear cliente'}
            </Button>
          </div>
        </form>
      </Modal>
    </form>
  );
};
