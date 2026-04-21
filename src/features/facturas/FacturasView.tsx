import { useEffect, useState, useMemo } from 'react';
import { Plus, FileText, Search, CheckSquare, Square, ExternalLink, X, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';

// ─── Modal de confirmación genérico ─────────────────────────────────────────────────────
type ConfirmVariant = 'success' | 'warning' | 'danger';
interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  variant: ConfirmVariant;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}
const CONFIRM_IDLE: ConfirmState = {
  open: false, title: '', description: '', variant: 'warning',
  confirmLabel: 'Confirmar', onConfirm: async () => {},
};

const variantStyles: Record<ConfirmVariant, { icon: React.ReactNode; btn: string; iconBg: string }> = {
  success: {
    icon: <CheckCircle size={22} className="text-emerald-600" />,
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    iconBg: 'bg-emerald-50',
  },
  warning: {
    icon: <AlertTriangle size={22} className="text-orange-500" />,
    btn: 'bg-orange-500 hover:bg-orange-600 text-white',
    iconBg: 'bg-orange-50',
  },
  danger: {
    icon: <Trash2 size={22} className="text-destructive" />,
    btn: 'bg-destructive hover:bg-destructive/90 text-white',
    iconBg: 'bg-red-50',
  },
};

const ConfirmModal = ({
  state, onClose, loading
}: { state: ConfirmState; onClose: () => void; loading: boolean }) => {
  if (!state.open) return null;
  const { icon, btn, iconBg } = variantStyles[state.variant];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm z-10 overflow-hidden">
        <div className="p-6">
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mb-4', iconBg)}>
            {icon}
          </div>
          <h3 className="font-bold text-foreground text-[15px] mb-1">{state.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{state.description}</p>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={state.onConfirm}
            disabled={loading}
            className={cn('flex-1 h-10 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2', btn)}
          >
            {loading && <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface NotaSelectable {
  id: string; folio: string; total: number; saldoPendiente: number;
  estadoPago: string; fechaEmision: string;
  cliente?: { nombreComercial: string };
}
interface Factura {
  id: string; folioFiscal?: string; serie?: string; folio?: string;
  fechaTimbrado?: string; subtotal?: number; iva?: number; total?: number;
  estatus: string; createdAt: string;
  notas: { nota: { id: string; folio: string; total: number; cliente?: { nombreComercial: string } } }[];
}

const fmtMXN = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

const labelCls = 'block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1';
const inputCls = 'w-full h-9 rounded-lg border border-input bg-card px-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';

// ─── Modal: Nueva Factura ─────────────────────────────────────────────────────
const NuevaFacturaModal = ({
  onClose, onSuccess
}: { onClose: () => void; onSuccess: () => void }) => {
  const [notas, setNotas] = useState<NotaSelectable[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Campos del CFDI
  const [uuid, setUuid] = useState('');
  const [serie, setSerie] = useState('');
  const [folio, setFolio] = useState('');
  const [fechaTimbrado, setFechaTimbrado] = useState(new Date().toISOString().slice(0, 16));
  const [subtotal, setSubtotal] = useState('');
  const [iva, setIva] = useState('');
  const [total, setTotal] = useState('');

  useEffect(() => {
    // Cargar notas que NO están canceladas y tienen saldo (pendientes de facturar)
    api.get('/notas').then(({ data }) => {
      const pendientes = (data.data as NotaSelectable[]).filter(
        n => n.estadoPago !== 'CANCELADO'
      );
      setNotas(pendientes);
    }).catch(() => toast.error('No se pudieron cargar las notas'));
  }, []);

  const filtered = useMemo(() =>
    notas.filter(n =>
      n.folio.toLowerCase().includes(search.toLowerCase()) ||
      n.cliente?.nombreComercial.toLowerCase().includes(search.toLowerCase())
    ), [notas, search]);

  const toggle = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const totalSeleccionado = notas
    .filter(n => selectedIds.has(n.id))
    .reduce((s, n) => s + Number(n.total), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.size === 0) {
      toast.error('Selecciona al menos una nota de remisión');
      return;
    }
    if (!uuid.trim()) { toast.error('El UUID / Folio Fiscal es requerido'); return; }
    if (!serie.trim()) { toast.error('La serie es requerida'); return; }
    if (!folio.trim()) { toast.error('El folio es requerido'); return; }
    if (!fechaTimbrado) { toast.error('La fecha de timbrado es requerida'); return; }
    if (!total || parseFloat(total) <= 0) { toast.error('El total del CFDI es requerido'); return; }
    setSaving(true);
    try {
      await api.post('/facturas', {
        folioFiscal: uuid.trim() || undefined,
        serie: serie.trim() || undefined,
        folio: folio.trim() || undefined,
        fechaTimbrado: fechaTimbrado ? new Date(fechaTimbrado).toISOString() : undefined,
        subtotal: subtotal ? parseFloat(subtotal) : undefined,
        iva: iva ? parseFloat(iva) : undefined,
        total: total ? parseFloat(total) : undefined,
        estatus: 'VIGENTE',
        notasIds: Array.from(selectedIds),
      });
      toast.success('Factura registrada correctamente');
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al registrar factura');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col z-10">

        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="font-bold text-foreground">Registrar Factura (CFDI)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Ingresa el UUID y vincula las notas que cubre</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto p-6 space-y-5 flex-1">

            {/* UUID / Folio Fiscal */}
            <div>
              <label className={labelCls}>UUID / Folio Fiscal del CFDI <span className="text-destructive">*</span></label>
              <input
                value={uuid}
                onChange={e => setUuid(e.target.value)}
                className={cn(inputCls, 'font-mono text-xs')}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                required
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Encuéntralo en el XML timbrado o en tu portal del PAC.
              </p>
            </div>

            {/* Serie + Folio + Fecha */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Serie <span className="text-destructive">*</span></label>
                <input value={serie} onChange={e => setSerie(e.target.value.toUpperCase())} className={inputCls} placeholder="A" maxLength={5} required />
              </div>
              <div>
                <label className={labelCls}>Folio <span className="text-destructive">*</span></label>
                <input value={folio} onChange={e => setFolio(e.target.value)} className={inputCls} placeholder="0001" required />
              </div>
              <div>
                <label className={labelCls}>Fecha de timbrado <span className="text-destructive">*</span></label>
                <input type="datetime-local" value={fechaTimbrado} onChange={e => setFechaTimbrado(e.target.value)} className={inputCls} required />
              </div>
            </div>

            {/* Importes */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Subtotal</label>
                <input type="number" min="0" step="0.01" value={subtotal} onChange={e => setSubtotal(e.target.value)} className={inputCls} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>IVA</label>
                <input type="number" min="0" step="0.01" value={iva} onChange={e => setIva(e.target.value)} className={inputCls} placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>Total CFDI <span className="text-destructive">*</span></label>
                <input type="number" min="0.01" step="0.01" value={total} onChange={e => setTotal(e.target.value)} className={cn(inputCls, 'font-semibold')} placeholder="0.00" required />
              </div>
            </div>

            {/* Selector de notas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls}>Notas de remisión que cubre esta factura *</label>
                {selectedIds.size > 0 && (
                  <span className="text-[11px] font-semibold text-primary">
                    {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''} — {fmtMXN(totalSeleccionado)}
                  </span>
                )}
              </div>

              {/* Buscador */}
              <div className="relative mb-2">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={cn(inputCls, 'pl-8')}
                  placeholder="Buscar por folio o cliente..."
                />
              </div>

              <div className="border border-border rounded-xl divide-y divide-border/50 max-h-52 overflow-y-auto bg-background">
                {filtered.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">Sin notas disponibles</p>
                ) : filtered.map(n => {
                  const checked = selectedIds.has(n.id);
                  return (
                    <label
                      key={n.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                        checked ? 'bg-primary/5' : 'hover:bg-muted/40'
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggle(n.id)}
                      />
                      {checked
                        ? <CheckSquare size={16} className="text-primary shrink-0" />
                        : <Square size={16} className="text-muted-foreground/40 shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-bold text-foreground">{n.folio}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{n.cliente?.nombreComercial ?? '—'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-foreground">{fmtMXN(Number(n.total))}</p>
                        <StatusBadge status={n.estadoPago} />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0 bg-card">
            <Button type="button" variant="outline" className="flex-1 h-9 rounded-lg" onClick={onClose}>Cancelar</Button>
            <Button
              type="submit"
              disabled={saving || selectedIds.size === 0}
              className="flex-1 h-9 rounded-lg shadow-sm shadow-primary/20"
            >
              {saving ? 'Guardando...' : `Registrar factura${selectedIds.size > 0 ? ` (${selectedIds.size} notas)` : ''}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Vista Principal ──────────────────────────────────────────────────────────
export const FacturasView = () => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(CONFIRM_IDLE);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/facturas');
      setFacturas(data.data);
    } catch {
      toast.error('No se pudieron cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const closeConfirm = () => setConfirm(CONFIRM_IDLE);

  const openPagada = (f: Factura) => setConfirm({
    open: true,
    variant: 'success',
    title: 'Confirmar pago de factura',
    description: `¿Estas seguro de marcar todas las notas de la factura ${f.serie}-${f.folio} como PAGADAS? Esta acción actualizará el saldo de ${f.notas.length} nota${f.notas.length !== 1 ? 's' : ''} a \u{1F7E2} Pagado y no se puede deshacer fácilmente.`,
    confirmLabel: 'Sí, marcar como pagadas',
    onConfirm: async () => {
      setActionLoading(true);
      try {
        const { data } = await api.post(`/facturas/${f.id}/pagada`);
        toast.success(data.message);
        closeConfirm();
        load();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Error al procesar');
      } finally { setActionLoading(false); }
    },
  });

  const openCancel = (f: Factura) => setConfirm({
    open: true,
    variant: 'warning',
    title: 'Cancelar factura',
    description: `¿Cancelar la factura ${f.serie}-${f.folio}? Las ${f.notas.length} nota${f.notas.length !== 1 ? 's' : ''} vinculadas regresarán a estado Pendiente o Parcial según sus pagos registrados.`,
    confirmLabel: 'Sí, cancelar factura',
    onConfirm: async () => {
      setActionLoading(true);
      try {
        await api.post(`/facturas/${f.id}/cancelar`);
        toast.success('Factura cancelada');
        closeConfirm();
        load();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Error al cancelar');
      } finally { setActionLoading(false); }
    },
  });

  const openDelete = (f: Factura) => setConfirm({
    open: true,
    variant: 'danger',
    title: 'Eliminar factura',
    description: `¿Eliminar permanentemente la factura ${f.serie}-${f.folio}? Esta acción no se puede deshacer. Las notas vinculadas quedarán desvinculadas y regresarán a su estado anterior.`,
    confirmLabel: 'Eliminar permanentemente',
    onConfirm: async () => {
      setActionLoading(true);
      try {
        await api.delete(`/facturas/${f.id}`);
        toast.success('Factura eliminada');
        closeConfirm();
        load();
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Error al eliminar');
      } finally { setActionLoading(false); }
    },
  });

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Facturas (CFDI)"
        actions={
          <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5 rounded-lg shadow-sm shadow-primary/20">
            <Plus size={14} /> Registrar factura
          </Button>
        }
      />

      <div className="p-4 md:p-6 space-y-4 flex-1 overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Total facturas', value: facturas.length, color: 'text-foreground' },
            { label: 'Vigentes', value: facturas.filter(f => f.estatus === 'VIGENTE').length, color: 'text-emerald-600' },
            { label: 'Canceladas', value: facturas.filter(f => f.estatus === 'CANCELADA').length, color: 'text-destructive' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card rounded-xl border border-border p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className={cn('text-xl font-bold mt-1', color)}>{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
              <span className="size-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" /> Cargando...
            </div>
          ) : facturas.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
              <FileText size={32} className="opacity-20" />
              <p className="text-sm">No hay facturas registradas</p>
              <Button variant="outline" size="sm" onClick={() => setModalOpen(true)}>Registrar primera factura</Button>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {facturas.map(f => (
                <div key={f.id} className="px-5 py-4 group">
                  <div className="flex items-start justify-between gap-4">
                    {/* Info CFDI */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-[13px] text-foreground">
                          {f.serie && f.folio ? `${f.serie}-${f.folio}` : '(Sin serie/folio)'}
                        </span>
                        <StatusBadge status={f.estatus} dot />
                      </div>

                      {f.folioFiscal && (
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                          UUID: {f.folioFiscal}
                        </p>
                      )}

                      {f.fechaTimbrado && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Timbrado: {fmtDate(f.fechaTimbrado)}
                        </p>
                      )}

                      {/* Notas vinculadas */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {f.notas.map(({ nota }) => (
                          <span
                            key={nota.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md text-[11px] font-mono text-muted-foreground"
                          >
                            {nota.folio}
                            <span className="text-muted-foreground/50">·</span>
                            {nota.cliente?.nombreComercial ?? ''}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Importes + acciones */}
                    <div className="text-right shrink-0 space-y-1">
                      {f.total != null && (
                        <p className="font-bold text-foreground">{fmtMXN(Number(f.total))}</p>
                      )}
                      {f.iva != null && (
                        <p className="text-[11px] text-muted-foreground">IVA: {fmtMXN(Number(f.iva))}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/50">
                        {f.notas.length} nota{f.notas.length !== 1 ? 's' : ''}
                      </p>
                      {f.folioFiscal && (
                        <a
                          href={`https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${f.folioFiscal}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                        >
                          Verificar en SAT <ExternalLink size={9} />
                        </a>
                      )}

                      {/* Acciones */}
                      {f.estatus === 'VIGENTE' && (
                        <div className="flex justify-end gap-1 pt-1">
                          <button
                            onClick={() => openPagada(f)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            title="Marcar notas como pagadas"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => openCancel(f)}
                            className="p-1.5 rounded-lg text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                            title="Cancelar factura"
                          >
                            <XCircle size={14} />
                          </button>
                          <button
                            onClick={() => openDelete(f)}
                            className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                            title="Eliminar factura"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      {f.estatus === 'CANCELADA' && (
                        <button
                          onClick={() => openDelete(f)}
                          className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors mt-1"
                          title="Eliminar factura"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <NuevaFacturaModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setModalOpen(false); load(); }}
        />
      )}

      <ConfirmModal
        state={confirm}
        onClose={closeConfirm}
        loading={actionLoading}
      />
    </div>
  );
};
