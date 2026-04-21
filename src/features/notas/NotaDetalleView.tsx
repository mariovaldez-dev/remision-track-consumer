import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Check, X, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

interface ItemNota {
  id: string; descripcion?: string; cantidad: number;
  unidadMedida?: string; precioUnitario: number; descuentoPct: number; subtotal: number;
}
interface Nota {
  id: string; folio: string; estadoPago: string;
  fechaEmision: string; fechaVencimiento?: string;
  subtotal: number; descuento: number; total: number;
  saldoPendiente: number; totalPagado: number;
  condicionesPago?: string; observaciones?: string;
  cliente?: { nombreComercial: string; rfc?: string; email?: string };
  creador?: { nombre: string; apellido: string };
  items: ItemNota[];
  pagos: { id: string; monto: number; fechaPago: string; formaPago: string; referencia?: string }[];
}

const fmtMXN = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
const labelCls = 'block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1';

export const NotaDetalleView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdminOrAbove = user?.rol === 'SUPER_ADMIN' || user?.rol === 'ADMIN';

  const [nota, setNota] = useState<Nota | null>(null);
  const [loading, setLoading] = useState(true);

  // Folio edit state
  const [editingFolio, setEditingFolio] = useState(false);
  const [folioInput, setFolioInput] = useState('');
  const [savingFolio, setSavingFolio] = useState(false);

  // Pago rapido
  const [pagoOpen, setPagoOpen] = useState(false);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoForma, setPagoForma] = useState('EFECTIVO');
  const [pagoRef, setPagoRef] = useState('');
  const [savingPago, setSavingPago] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/notas/${id}`);
      setNota(data.data);
      setFolioInput(data.data.folio);
    } catch {
      toast.error('No se pudo cargar la nota');
      navigate('/notas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleSaveFolio = async () => {
    if (!folioInput.trim()) return;
    setSavingFolio(true);
    try {
      await api.patch(`/notas/${id}/folio`, { folio: folioInput.trim() });
      toast.success(`Folio actualizado a "${folioInput.trim().toUpperCase()}"`);
      setEditingFolio(false);
      load();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al actualizar folio');
    } finally {
      setSavingFolio(false);
    }
  };

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nota) return;
    setSavingPago(true);
    try {
      await api.post('/pagos', {
        notaId: nota.id,
        monto: parseFloat(pagoMonto),
        fechaPago: new Date().toISOString().split('T')[0],
        formaPago: pagoForma,
        referencia: pagoRef || undefined,
      });
      toast.success('Pago registrado');
      setPagoOpen(false);
      setPagoMonto('');
      setPagoRef('');
      load();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al registrar pago');
    } finally {
      setSavingPago(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-sm">
      <span className="size-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" /> Cargando...
    </div>
  );

  if (!nota) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 flex items-center gap-3 px-4 md:px-6 border-b border-border bg-card shrink-0">
        <button onClick={() => navigate('/notas')} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
          <ArrowLeft size={16} />
        </button>

        {/* Folio editable */}
        {editingFolio ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              value={folioInput}
              onChange={(e) => setFolioInput(e.target.value.toUpperCase())}
              className="h-8 px-3 rounded-lg border border-primary bg-background font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 w-52"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFolio(); if (e.key === 'Escape') setEditingFolio(false); }}
            />
            <button onClick={handleSaveFolio} disabled={savingFolio} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
              <Check size={15} />
            </button>
            <button onClick={() => { setEditingFolio(false); setFolioInput(nota.folio); }} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className="font-bold text-foreground font-mono text-[15px]">{nota.folio}</span>
            {isAdminOrAbove && nota.estadoPago !== 'CANCELADO' && (
              <button
                onClick={() => { setFolioInput(nota.folio); setEditingFolio(true); }}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Editar folio"
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <StatusBadge status={nota.estadoPago} dot />
          {nota.estadoPago !== 'CANCELADO' && nota.estadoPago !== 'PAGADO' && (
            <Button size="sm" onClick={() => setPagoOpen(true)} className="gap-1.5 rounded-lg text-xs h-8 shadow-sm shadow-primary/20">
              <Plus size={12} /> Registrar pago
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Info general */}
          <div className="md:col-span-2 bg-card rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-[13px] font-bold text-foreground">Información General</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><p className={labelCls}>Cliente</p><p className="font-semibold text-foreground">{nota.cliente?.nombreComercial ?? '—'}</p>{nota.cliente?.rfc && <p className="text-xs text-muted-foreground">RFC: {nota.cliente.rfc}</p>}</div>
              <div><p className={labelCls}>Emisión</p><p className="text-foreground">{fmtDate(nota.fechaEmision)}</p></div>
              <div><p className={labelCls}>Vencimiento</p><p className="text-foreground">{nota.fechaVencimiento ? fmtDate(nota.fechaVencimiento) : '—'}</p></div>
              {nota.condicionesPago && <div><p className={labelCls}>Condiciones</p><p className="text-foreground">{nota.condicionesPago}</p></div>}
              {nota.creador && <div><p className={labelCls}>Creado por</p><p className="text-foreground">{nota.creador.nombre} {nota.creador.apellido}</p></div>}
              {nota.observaciones && <div className="col-span-2 sm:col-span-3"><p className={labelCls}>Observaciones</p><p className="text-muted-foreground text-xs">{nota.observaciones}</p></div>}
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="bg-card rounded-xl border border-border p-5 space-y-3">
            <h2 className="text-[13px] font-bold text-foreground">Resumen</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmtMXN(Number(nota.subtotal))}</span></div>
              {Number(nota.descuento) > 0 && <div className="flex justify-between text-muted-foreground"><span>Descuento</span><span>- {fmtMXN(Number(nota.descuento))}</span></div>}
              <div className="flex justify-between font-bold text-foreground border-t border-border pt-2"><span>Total</span><span className="text-primary">{fmtMXN(Number(nota.total))}</span></div>
              {Number(nota.totalPagado) > 0 && <div className="flex justify-between text-emerald-600"><span>Pagado</span><span>{fmtMXN(Number(nota.totalPagado))}</span></div>}
              {Number(nota.saldoPendiente) > 0 && <div className="flex justify-between font-semibold text-orange-600"><span>Pendiente</span><span>{fmtMXN(Number(nota.saldoPendiente))}</span></div>}
            </div>
          </div>
        </div>

        {/* Conceptos */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h2 className="text-[13px] font-bold text-foreground flex items-center gap-2"><FileText size={14} /> Conceptos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/60 bg-muted/20">
                {['Descripción', 'Cant.', 'U.M.', 'P. Unitario', 'Desc.%', 'Subtotal'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide last:text-right">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {nota.items.map((it, i) => (
                  <tr key={it.id} className={cn('text-sm', i < nota.items.length - 1 && 'border-b border-border/40')}>
                    <td className="px-4 py-3 text-foreground">{it.descripcion ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{it.cantidad}</td>
                    <td className="px-4 py-3 text-muted-foreground">{it.unidadMedida ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtMXN(Number(it.precioUnitario))}</td>
                    <td className="px-4 py-3 text-muted-foreground">{it.descuentoPct ?? 0}%</td>
                    <td className="px-4 py-3 font-semibold text-foreground text-right">{fmtMXN(Number(it.subtotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagos */}
        {nota.pagos.length > 0 && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h2 className="text-[13px] font-bold text-foreground">Pagos registrados</h2>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/60 bg-muted/20">
                {['Fecha', 'Forma', 'Referencia', 'Monto'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide last:text-right">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {nota.pagos.map((p, i) => (
                  <tr key={p.id} className={cn('text-sm', i < nota.pagos.length - 1 && 'border-b border-border/40')}>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(p.fechaPago)}</td>
                    <td className="px-4 py-3 text-foreground font-medium">{p.formaPago}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.referencia ?? '—'}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 text-right">{fmtMXN(Number(p.monto))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal pago rápido */}
      {pagoOpen && nota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPagoOpen(false)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 z-10">
            <h3 className="font-bold text-foreground mb-1">Registrar pago</h3>
            <p className="text-xs text-muted-foreground mb-4">Saldo pendiente: <strong className="text-orange-600">{fmtMXN(Number(nota.saldoPendiente))}</strong></p>
            <form onSubmit={handlePago} className="space-y-3">
              <div>
                <label className={labelCls}>Monto *</label>
                <input type="number" min="0.01" step="0.01" max={Number(nota.saldoPendiente)} required value={pagoMonto} onChange={e => setPagoMonto(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="0.00" />
              </div>
              <div>
                <label className={labelCls}>Forma de pago</label>
                <select value={pagoForma} onChange={e => setPagoForma(e.target.value)} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                  {['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA', 'OTRO'].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Referencia</label>
                <input value={pagoRef} onChange={e => setPagoRef(e.target.value)} className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Núm. transferencia, cheque, etc." />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1 h-9 rounded-lg" onClick={() => setPagoOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={savingPago} className="flex-1 h-9 rounded-lg shadow-sm shadow-primary/20">{savingPago ? 'Guardando...' : 'Confirmar pago'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
