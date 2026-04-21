import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';

type UnidadMedida = 'KG' | 'TONELADA' | 'PIEZA' | 'CAJA' | 'COSTAL' | 'LITRO';

interface Producto {
  id: string; nombre: string; descripcion?: string;
  unidadMedida: UnidadMedida; precioUnitario: number; activo: boolean;
}

const UNIDADES: UnidadMedida[] = ['KG', 'TONELADA', 'PIEZA', 'CAJA', 'COSTAL', 'LITRO'];
const empty = { nombre: '', descripcion: '', unidadMedida: 'PIEZA' as UnidadMedida, precioBase: '' };
const inp = 'w-full h-9 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
const fmtMXN = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

export const ProductosView = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Producto | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const load = async () => {
    try { const { data } = await api.get('/productos'); setProductos(data.data); }
    catch { toast.error('No se pudieron cargar los productos'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEdit(null); setForm(empty); setOpen(true); };
  const openEdit = (p: Producto) => {
    setEdit(p);
    setForm({ nombre: p.nombre, descripcion: p.descripcion ?? '', unidadMedida: p.unidadMedida, precioBase: String(p.precioUnitario) });
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload: any = { nombre: form.nombre, unidadMedida: form.unidadMedida };
      if (form.descripcion) payload.descripcion = form.descripcion;
      if (form.precioBase) payload.precioBase = Number(form.precioBase);
      if (edit) { await api.patch(`/productos/${edit.id}`, payload); toast.success('Producto actualizado'); }
      else { await api.post('/productos', payload); toast.success('Producto creado'); }
      setOpen(false); load();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = (p: Producto) => {
    toast(`¿Desactivar "${p.nombre}"?`, {
      action: { label: 'Desactivar', onClick: async () => { try { await api.delete(`/productos/${p.id}`); toast.success('Producto desactivado'); load(); } catch { toast.error('Error al desactivar'); } } },
      cancel: { label: 'Cancelar', onClick: () => {} },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Productos" actions={
        <Button size="sm" onClick={openCreate} className="gap-1.5 rounded-lg shadow-sm shadow-primary/20">
          <Plus size={14} /> Nuevo producto
        </Button>
      } />

      <div className="p-4 md:p-6">
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
              <span className="size-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" /> Cargando...
            </div>
          ) : productos.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
              <Package size={32} className="opacity-20" />
              <p className="text-sm">No hay productos registrados</p>
              <Button variant="outline" size="sm" onClick={openCreate}>Agregar el primero</Button>
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="divide-y divide-border/60 md:hidden">
                {productos.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center shrink-0">
                      <Package size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] text-foreground truncate">{p.nombre}</p>
                      <p className="text-[11px] text-muted-foreground">{p.unidadMedida} · {fmtMXN(p.precioUnitario)}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(p)} className="p-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop */}
              <table className="w-full text-sm hidden md:table">
                <thead><tr className="border-b border-border">
                  {['Producto', 'Descripción', 'Unidad', 'Precio base', 'Estado', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide last:text-right">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {productos.map((p, i) => (
                    <tr key={p.id} className={cn('group hover:bg-muted/30 transition-colors', i < productos.length - 1 && 'border-b border-border/60')}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                            <Package size={13} className="text-primary" />
                          </div>
                          <span className="font-semibold text-[13px] text-foreground">{p.nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-muted-foreground max-w-[200px] truncate">{p.descripcion ?? '—'}</td>
                      <td className="px-5 py-3.5"><span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">{p.unidadMedida}</span></td>
                      <td className="px-5 py-3.5 font-semibold text-[13px] text-foreground">{fmtMXN(p.precioUnitario)}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border', p.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200')}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', p.activo ? 'bg-emerald-500' : 'bg-red-400')} />{p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(p)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 size={13} /></button>
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

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? 'Editar producto' : 'Nuevo producto'}>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Nombre *</label>
            <input value={form.nombre} onChange={e => s('nombre', e.target.value)} required className={inp} placeholder="Nombre del producto" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => s('descripcion', e.target.value)} rows={2} className={cn(inp, 'h-auto py-2 resize-none')} placeholder="Descripción opcional..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Unidad de medida *</label>
              <select value={form.unidadMedida} onChange={e => s('unidadMedida', e.target.value)} className={cn(inp, 'cursor-pointer')}>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Precio base</label>
              <input type="number" min="0" step="0.01" value={form.precioBase} onChange={e => s('precioBase', e.target.value)} className={inp} placeholder="0.00" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1 rounded-lg h-9" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 rounded-lg h-9 shadow-sm shadow-primary/20" disabled={saving}>
              {saving ? 'Guardando...' : edit ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
