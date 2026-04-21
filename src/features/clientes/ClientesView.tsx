import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { cn } from '@/lib/utils';

interface Cliente {
  id: string; nombreComercial: string; razonSocial?: string; rfc?: string;
  email?: string; telefono?: string; contactoNombre?: string;
  diasCredito?: number; limiteCredito?: number; activo: boolean;
  direccionCalle?: string; direccionCiudad?: string; notas?: string;
}

const empty = { nombreComercial: '', razonSocial: '', rfc: '', email: '', telefono: '', contactoNombre: '', diasCredito: '', limiteCredito: '', direccionCalle: '', direccionCiudad: '', notas: '' };

const F = ({ label, children, col2 }: { label: string; children: React.ReactNode; col2?: boolean }) => (
  <div className={col2 ? 'col-span-2' : ''}>
    <label className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</label>
    {children}
  </div>
);
const inp = 'w-full h-9 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';

export const ClientesView = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Cliente | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const s = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const load = async () => {
    try { const { data } = await api.get('/clientes'); setClientes(data.data); }
    catch { toast.error('No se pudieron cargar los clientes'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEdit(null); setForm(empty); setOpen(true); };
  const openEdit = (c: Cliente) => {
    setEdit(c);
    setForm({ nombreComercial: c.nombreComercial, razonSocial: c.razonSocial ?? '', rfc: c.rfc ?? '', email: c.email ?? '', telefono: c.telefono ?? '', contactoNombre: c.contactoNombre ?? '', diasCredito: String(c.diasCredito ?? ''), limiteCredito: String(c.limiteCredito ?? ''), direccionCalle: c.direccionCalle ?? '', direccionCiudad: c.direccionCiudad ?? '', notas: c.notas ?? '' });
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, diasCredito: form.diasCredito ? Number(form.diasCredito) : undefined, limiteCredito: form.limiteCredito ? Number(form.limiteCredito) : undefined };
      Object.keys(payload).forEach(k => { if ((payload as any)[k] === '') delete (payload as any)[k]; });
      if (edit) { await api.patch(`/clientes/${edit.id}`, payload); toast.success('Cliente actualizado'); }
      else { await api.post('/clientes', payload); toast.success('Cliente creado'); }
      setOpen(false); load();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleDelete = (c: Cliente) => {
    toast(`¿Desactivar a ${c.nombreComercial}?`, {
      action: { label: 'Desactivar', onClick: async () => { try { await api.delete(`/clientes/${c.id}`); toast.success('Cliente desactivado'); load(); } catch { toast.error('Error al desactivar'); } } },
      cancel: { label: 'Cancelar', onClick: () => {} },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Clientes" actions={
        <Button size="sm" onClick={openCreate} className="gap-1.5 rounded-lg shadow-sm shadow-primary/20">
          <Plus size={14} /> Nuevo cliente
        </Button>
      } />

      <div className="p-4 md:p-6 space-y-4">
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
              <span className="size-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" /> Cargando...
            </div>
          ) : clientes.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
              <Users size={32} className="opacity-20" />
              <p className="text-sm">No hay clientes registrados</p>
              <Button variant="outline" size="sm" onClick={openCreate}>Agregar el primero</Button>
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="divide-y divide-border/60 md:hidden">
                {clientes.map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-full bg-primary/8 border border-primary/12 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-primary">{c.nombreComercial[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13px] text-foreground truncate">{c.nombreComercial}</p>
                      <p className="text-[11px] text-muted-foreground">{c.rfc ?? c.email ?? 'Sin RFC'}</p>
                      <span className={cn('text-[10px] font-semibold', c.activo ? 'text-emerald-600' : 'text-red-500')}>{c.activo ? '● Activo' : '● Inactivo'}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(c)} className="p-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop */}
              <table className="w-full text-sm hidden md:table">
                <thead><tr className="border-b border-border">
                  {['Cliente', 'RFC', 'Contacto', 'Teléfono', 'Estado', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide last:text-right">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {clientes.map((c, i) => (
                    <tr key={c.id} className={cn('group hover:bg-muted/30 transition-colors', i < clientes.length - 1 && 'border-b border-border/60')}>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-[13px] text-foreground">{c.nombreComercial}</p>
                        {c.razonSocial && <p className="text-[11px] text-muted-foreground">{c.razonSocial}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-muted-foreground font-mono">{c.rfc ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <div className="space-y-0.5">
                          {c.contactoNombre && <p className="text-[12px] text-foreground">{c.contactoNombre}</p>}
                          {c.email && <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Mail size={10} />{c.email}</p>}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-muted-foreground">{c.telefono ? <span className="flex items-center gap-1"><Phone size={11} />{c.telefono}</span> : '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border', c.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200')}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', c.activo ? 'bg-emerald-500' : 'bg-red-400')} />{c.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 size={13} /></button>
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

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? 'Editar cliente' : 'Nuevo cliente'} subtitle={edit ? 'Actualiza los datos del cliente' : 'Completa los datos del cliente'} maxWidth="max-w-[560px]">
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <F label="Nombre Comercial *" col2><input value={form.nombreComercial} onChange={e => s('nombreComercial', e.target.value)} required className={inp} placeholder="Empresa S.A. de C.V." /></F>
            <F label="Razón Social"><input value={form.razonSocial} onChange={e => s('razonSocial', e.target.value)} className={inp} placeholder="Razón social completa" /></F>
            <F label="RFC"><input value={form.rfc} onChange={e => s('rfc', e.target.value)} className={inp} placeholder="ABC123456XYZ" maxLength={13} /></F>
            <F label="Email"><input type="email" value={form.email} onChange={e => s('email', e.target.value)} className={inp} placeholder="contacto@empresa.com" /></F>
            <F label="Teléfono"><input value={form.telefono} onChange={e => s('telefono', e.target.value)} className={inp} placeholder="555-0000" /></F>
            <F label="Contacto"><input value={form.contactoNombre} onChange={e => s('contactoNombre', e.target.value)} className={inp} placeholder="Nombre del contacto" /></F>
            <F label="Días de crédito"><input type="number" min="0" value={form.diasCredito} onChange={e => s('diasCredito', e.target.value)} className={inp} placeholder="30" /></F>
            <F label="Límite de crédito"><input type="number" min="0" value={form.limiteCredito} onChange={e => s('limiteCredito', e.target.value)} className={inp} placeholder="50000" /></F>
            <F label="Dirección"><input value={form.direccionCalle} onChange={e => s('direccionCalle', e.target.value)} className={inp} placeholder="Calle y número" /></F>
            <F label="Ciudad"><input value={form.direccionCiudad} onChange={e => s('direccionCiudad', e.target.value)} className={inp} placeholder="Ciudad" /></F>
            <F label="Notas internas" col2><textarea value={form.notas} onChange={e => s('notas', e.target.value)} rows={2} className={cn(inp, 'h-auto py-2 resize-none')} placeholder="Observaciones del cliente..." /></F>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1 rounded-lg h-9" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 rounded-lg h-9 shadow-sm shadow-primary/20" disabled={saving}>
              {saving ? 'Guardando...' : edit ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
