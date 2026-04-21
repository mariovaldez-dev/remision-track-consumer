import { useEffect, useState } from 'react';
import { Plus, FileText, Eye, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';

interface Nota {
  id: string; folio: string; estadoPago: string;
  fechaEmision: string; fechaVencimiento?: string;
  total: number; totalPagado: number; saldoPendiente: number;
  cliente?: { nombreComercial: string };
  condicionesPago?: string;
}

const fmtMXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
const fmtDate = (s: string) => new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

export const NotasView = () => {
  const navigate = useNavigate();
  const [notas, setNotas] = useState<Nota[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const { data } = await api.get('/notas'); setNotas(data.data); }
    catch { toast.error('No se pudieron cargar las notas'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCancel = (n: Nota) => {
    toast(`¿Cancelar nota ${n.folio}?`, {
      description: 'Esta acción no se puede deshacer.',
      action: { label: 'Cancelar nota', onClick: async () => {
        try { await api.post(`/notas/${n.id}/cancelar`); toast.success(`Nota ${n.folio} cancelada`); load(); }
        catch { toast.error('Error al cancelar'); }
      }},
      cancel: { label: 'No', onClick: () => {} },
    });
  };

  const pendientes = notas.filter(n => n.estadoPago === 'PENDIENTE' || n.estadoPago === 'PARCIAL' || n.estadoPago === 'VENCIDO').length;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Notas de Remisión" actions={
        <Button size="sm" onClick={() => navigate('/notas/nueva')} className="gap-1.5 rounded-lg shadow-sm shadow-primary/20">
          <Plus size={14} /> Nueva nota
        </Button>
      } />

      <div className="p-4 md:p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total notas', value: notas.length, color: 'text-foreground' },
            { label: 'Pendientes', value: pendientes, color: 'text-yellow-600' },
            { label: 'Total vendido', value: fmtMXN(notas.reduce((s, n) => s + Number(n.total), 0)), color: 'text-primary' },
            { label: 'Por cobrar', value: fmtMXN(notas.reduce((s, n) => s + Number(n.saldoPendiente), 0)), color: 'text-orange-600' },
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
          ) : notas.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
              <FileText size={32} className="opacity-20" />
              <p className="text-sm">No hay notas de remisión</p>
              <Button variant="outline" size="sm" onClick={() => navigate('/notas/nueva')}>Crear la primera</Button>
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="divide-y divide-border/60 md:hidden">
                {notas.map(n => (
                  <div key={n.id} className="px-4 py-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[13px] text-foreground font-mono">{n.folio}</span>
                      <StatusBadge status={n.estadoPago} dot />
                    </div>
                    <p className="text-[12px] text-muted-foreground">{n.cliente?.nombreComercial ?? '—'}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Total: <span className="font-semibold text-foreground">{fmtMXN(Number(n.total))}</span></p>
                        {Number(n.saldoPendiente) > 0 && <p className="text-[11px] text-orange-600">Pendiente: {fmtMXN(Number(n.saldoPendiente))}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => navigate(`/notas/${n.id}`)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Ver detalle">
                          <Eye size={15} />
                        </button>
                        {n.estadoPago !== 'CANCELADO' && (
                          <button onClick={() => handleCancel(n)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop */}
              <table className="w-full text-sm hidden md:table">
                <thead><tr className="border-b border-border">
                  {['Folio', 'Cliente', 'Emisión', 'Vencimiento', 'Total', 'Saldo', 'Estado', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide last:text-right">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {notas.map((n, i) => (
                    <tr key={n.id} className={cn('group hover:bg-muted/30 transition-colors', i < notas.length - 1 && 'border-b border-border/60')}>
                      <td className="px-5 py-3.5 font-mono font-bold text-[13px] text-foreground">{n.folio}</td>
                      <td className="px-5 py-3.5 text-[13px] text-foreground">{n.cliente?.nombreComercial ?? '—'}</td>
                      <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{fmtDate(n.fechaEmision)}</td>
                      <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{n.fechaVencimiento ? fmtDate(n.fechaVencimiento) : '—'}</td>
                      <td className="px-5 py-3.5 font-semibold text-[13px] text-foreground">{fmtMXN(Number(n.total))}</td>
                      <td className="px-5 py-3.5 text-[13px]">
                        {Number(n.saldoPendiente) > 0
                          ? <span className="text-orange-600 font-semibold">{fmtMXN(Number(n.saldoPendiente))}</span>
                          : <span className="text-emerald-600 font-semibold">—</span>}
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={n.estadoPago} dot /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigate(`/notas/${n.id}`)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Ver detalle"><Eye size={13} /></button>
                          {n.estadoPago !== 'CANCELADO' && (
                            <button onClick={() => handleCancel(n)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Cancelar"><XCircle size={13} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
