import { useEffect, useState } from 'react';
import { Plus, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

interface Corte {
  id: string; mes: number; anio: number; estado: string;
  totalVendido?: number; totalCobrado?: number; totalPendiente?: number;
  notasCanceladas?: number; createdAt: string;
}

const fmtMXN = (n?: number) => n != null ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n)) : '—';
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const inp = 'w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';

export const CortesView = () => {
  const { user } = useAuthStore();
  const canGenerate = user?.rol === 'SUPER_ADMIN' || user?.rol === 'ADMIN' || user?.rol === 'CONTADOR';
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const now = new Date();
  const [mes, setMes] = useState(String(now.getMonth() + 1));
  const [anio, setAnio] = useState(String(now.getFullYear()));

  const load = async () => {
    try { const { data } = await api.get('/cortes'); setCortes(data.data); }
    catch { toast.error('No se pudieron cargar los cortes'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/cortes', { mes: Number(mes), anio: Number(anio) });
      toast.success(`Corte de ${MESES[Number(mes) - 1]} ${anio} generado`);
      setOpen(false); load();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al generar el corte');
    } finally { setSaving(false); }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Cortes Mensuales" actions={
        canGenerate && (
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5 rounded-lg shadow-sm shadow-primary/20">
            <Plus size={14} /> Generar corte
          </Button>
        )
      } />

      <div className="p-4 md:p-6 space-y-4">
        {/* Stats */}
        {cortes.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Último corte', value: `${MESES[cortes[0].mes - 1]} ${cortes[0].anio}` },
              { label: 'Vendido (último)', value: fmtMXN(cortes[0].totalVendido) },
              { label: 'Cobrado (último)', value: fmtMXN(cortes[0].totalCobrado) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card rounded-xl border border-border p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="text-xl font-bold mt-1 text-foreground">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
              <span className="size-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" /> Cargando...
            </div>
          ) : cortes.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
              <Scissors size={32} className="opacity-20" />
              <p className="text-sm">No hay cortes generados</p>
              {canGenerate && <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Generar el primero</Button>}
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="divide-y divide-border/60 md:hidden">
                {cortes.map(c => (
                  <div key={c.id} className="px-4 py-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[14px] text-foreground">{MESES[c.mes - 1]} {c.anio}</span>
                      <StatusBadge status={c.estado} dot />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2">
                      <p className="text-[11px] text-muted-foreground">Vendido: <span className="font-semibold text-foreground">{fmtMXN(c.totalVendido)}</span></p>
                      <p className="text-[11px] text-muted-foreground">Cobrado: <span className="font-semibold text-emerald-600">{fmtMXN(c.totalCobrado)}</span></p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop */}
              <table className="w-full text-sm hidden md:table">
                <thead><tr className="border-b border-border">
                  {['Periodo', 'Total Vendido', 'Total Cobrado', 'Pendiente', 'Notas Canceladas', 'Estado'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {cortes.map((c, i) => (
                    <tr key={c.id} className={cn('hover:bg-muted/30 transition-colors', i < cortes.length - 1 && 'border-b border-border/60')}>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-[14px] text-foreground">{MESES[c.mes - 1]}</p>
                        <p className="text-[11px] text-muted-foreground">{c.anio}</p>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[13px] text-foreground">{fmtMXN(c.totalVendido)}</td>
                      <td className="px-5 py-3.5 font-semibold text-[13px] text-emerald-600">{fmtMXN(c.totalCobrado)}</td>
                      <td className="px-5 py-3.5 font-semibold text-[13px] text-orange-600">{fmtMXN(c.totalPendiente)}</td>
                      <td className="px-5 py-3.5 text-[13px] text-muted-foreground text-center">{c.notasCanceladas ?? 0}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={c.estado} dot /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Generar corte mensual" subtitle="Consolida las ventas y cobranza del período seleccionado">
        <form onSubmit={handleGenerate} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Mes</label>
              <select value={mes} onChange={e => setMes(e.target.value)} className={cn(inp, 'cursor-pointer')}>
                {MESES.map((m, idx) => <option key={m} value={idx + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Año</label>
              <select value={anio} onChange={e => setAnio(e.target.value)} className={cn(inp, 'cursor-pointer')}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            Se consolidarán todas las notas de remisión del período <strong>{MESES[Number(mes) - 1]} {anio}</strong>. Este proceso no se puede deshacer.
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1 rounded-lg h-9" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 rounded-lg h-9 shadow-sm shadow-primary/20" disabled={saving}>
              {saving ? 'Generando...' : 'Generar corte'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
