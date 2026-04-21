import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, ShieldCheck, Users, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Rol = 'SUPER_ADMIN' | 'ADMIN' | 'OPERADOR' | 'CONTADOR' | 'VISUALIZADOR' | 'CHOFER';

interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  activo: boolean;
  telefono?: string;
}

const ROLES: Rol[] = ['SUPER_ADMIN', 'ADMIN', 'OPERADOR', 'CONTADOR', 'VISUALIZADOR', 'CHOFER'];

const rolConfig: Record<Rol, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  ADMIN:       { label: 'Admin',       color: 'bg-blue-50 text-blue-700 border-blue-200' },
  OPERADOR:    { label: 'Operador',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CONTADOR:    { label: 'Contador',    color: 'bg-amber-50 text-amber-700 border-amber-200' },
  VISUALIZADOR:{ label: 'Visualizador',color: 'bg-slate-50 text-slate-600 border-slate-200' },
  CHOFER:      { label: 'Chofer',      color: 'bg-orange-50 text-orange-700 border-orange-200' },
};

const emptyForm = {
  nombre: '', apellido: '', email: '', password: '', rol: 'OPERADOR' as Rol, telefono: '',
};

const Field = ({
  label, optional, children,
}: { label: string; optional?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-foreground flex items-center gap-1">
      {label}
      {optional && <span className="text-muted-foreground font-normal">(opcional)</span>}
    </label>
    {children}
  </div>
);

const inputCls = 'w-full h-9 rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';

export const UsersView = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pwUser, setPwUser] = useState<User | null>(null);
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const set = (key: keyof typeof emptyForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data);
    } catch {
      toast.error('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ nombre: u.nombre, apellido: u.apellido, email: u.email, password: '', rol: u.rol, telefono: u.telefono ?? '' });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editUser) {
        await api.patch(`/users/${editUser.id}`, {
          nombre: form.nombre, apellido: form.apellido,
          email: form.email, rol: form.rol,
          ...(form.telefono ? { telefono: form.telefono } : {}),
        });
        toast.success('Usuario actualizado correctamente');
      } else {
        await api.post('/users', {
          ...form,
          ...(form.telefono ? {} : { telefono: undefined }),
        });
        toast.success('Usuario creado correctamente');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al guardar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await api.patch(`/users/${u.id}`, { activo: !u.activo });
      toast.success(u.activo ? `${u.nombre} fue desactivado` : `${u.nombre} fue activado`);
      fetchUsers();
    } catch {
      toast.error('No se pudo actualizar el estado');
    }
  };

  const openPwModal = (u: User) => { setPwUser(u); setNewPw(''); };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwUser) return;
    setSavingPw(true);
    try {
      await api.patch(`/users/${pwUser.id}/password`, { newPassword: newPw });
      toast.success(`Contraseña de ${pwUser.nombre} actualizada`);
      setPwUser(null);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Error al cambiar la contraseña');
    } finally {
      setSavingPw(false);
    }
  };

  const handleDelete = async (u: User) => {
    toast(`¿Desactivar a ${u.nombre} ${u.apellido}?`, {
      description: 'El usuario no podrá iniciar sesión.',
      action: {
        label: 'Desactivar',
        onClick: async () => {
          try {
            await api.delete(`/users/${u.id}`);
            toast.success('Usuario desactivado');
            fetchUsers();
          } catch {
            toast.error('No se pudo desactivar el usuario');
          }
        },
      },
      cancel: { label: 'Cancelar', onClick: () => {} },
    });
  };

  const activeCount = users.filter((u) => u.activo).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} usuarios · {activeCount} activos
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5 rounded-lg shadow-sm shadow-primary/20">
          <Plus size={14} />
          Nuevo usuario
        </Button>
      </div>

      {/* Table card — desktop / card list on mobile */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground text-sm">
            <span className="size-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            Cargando usuarios...
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Users size={20} className="opacity-40" />
            </div>
            <p className="text-sm">No hay usuarios registrados</p>
            <Button variant="outline" size="sm" onClick={openCreate}>Crear el primero</Button>
          </div>
        ) : (
          <>
            {/* ── Mobile card list ── */}
            <div className="divide-y divide-border/60 md:hidden">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-primary/8 border border-primary/12 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-primary">{u.nombre[0]}{u.apellido[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-[13px] truncate">{u.nombre} {u.apellido}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border', rolConfig[u.rol].color)}>
                        {rolConfig[u.rol].label}
                      </span>
                      <button onClick={() => handleToggleActive(u)} className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all', u.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200')}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', u.activo ? 'bg-emerald-500' : 'bg-red-400')} />
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(u)} className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => openPwModal(u)} className="p-2 rounded-xl text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-colors">
                      <KeyRound size={14} />
                    </button>
                    <button onClick={() => handleDelete(u)} className="p-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Desktop table ── */}
            <table className="w-full text-sm hidden md:table">
              <thead>
                <tr className="border-b border-border">
                  {['Usuario', 'Correo', 'Rol', 'Estado', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className={cn('group transition-colors hover:bg-muted/30', i !== users.length - 1 && 'border-b border-border/60')}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/8 border border-primary/12 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-bold text-primary">{u.nombre[0]}{u.apellido[0]}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-[13px] leading-tight">{u.nombre} {u.apellido}</p>
                          {u.telefono && <p className="text-[11px] text-muted-foreground">{u.telefono}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-[13px]">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border', rolConfig[u.rol].color)}>
                        <ShieldCheck size={10} />{rolConfig[u.rol].label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => handleToggleActive(u)} className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border', u.activo ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' : 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200')}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', u.activo ? 'bg-emerald-500' : 'bg-red-400')} />
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"><Pencil size={13} /></button>
                        <button onClick={() => openPwModal(u)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-colors"><KeyRound size={13} /></button>
                        <button onClick={() => handleDelete(u)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Modal cambiar contraseña */}
      {pwUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setPwUser(null)} />
          <div className="relative bg-card border border-border rounded-2xl w-full max-w-[360px] shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-[15px] text-foreground">Cambiar contraseña</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{pwUser.nombre} {pwUser.apellido}</p>
              </div>
              <button onClick={() => setPwUser(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              <Field label="Nueva contraseña">
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  minLength={6}
                  className={inputCls}
                  placeholder="Mínimo 6 caracteres"
                  autoFocus
                />
              </Field>
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1 rounded-lg h-9" onClick={() => setPwUser(null)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 rounded-lg h-9 shadow-sm shadow-primary/20" disabled={savingPw}>
                  {savingPw ? (
                    <span className="flex items-center gap-1.5">
                      <span className="size-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Guardando...
                    </span>
                  ) : 'Cambiar contraseña'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-card border border-border rounded-2xl w-full max-w-[440px] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-[15px] text-foreground">
                  {editUser ? 'Editar usuario' : 'Nuevo usuario'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editUser ? 'Actualiza los datos del usuario' : 'Completa los datos del nuevo miembro'}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre">
                  <input value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required className={inputCls} placeholder="Carlos" />
                </Field>
                <Field label="Apellido">
                  <input value={form.apellido} onChange={(e) => set('apellido', e.target.value)} required className={inputCls} placeholder="García" />
                </Field>
              </div>

              <Field label="Correo electrónico">
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required className={inputCls} placeholder="carlos@empresa.com" />
              </Field>

              {!editUser && (
                <Field label="Contraseña">
                  <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6} className={inputCls} placeholder="Mínimo 6 caracteres" />
                </Field>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Rol">
                  <select value={form.rol} onChange={(e) => set('rol', e.target.value)} className={cn(inputCls, 'cursor-pointer')}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{rolConfig[r].label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Teléfono" optional>
                  <input value={form.telefono} onChange={(e) => set('telefono', e.target.value)} className={inputCls} placeholder="555-0000" />
                </Field>
              </div>

              {/* Role description */}
              <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
                <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border mr-1.5', rolConfig[form.rol as Rol].color)}>
                  {rolConfig[form.rol as Rol].label}
                </span>
                {form.rol === 'SUPER_ADMIN' && 'Acceso total al sistema. Puede gestionar usuarios y configuración.'}
                {form.rol === 'ADMIN' && 'Acceso completo excepto configuración del sistema.'}
                {form.rol === 'OPERADOR' && 'Puede crear clientes, notas y registrar pagos.'}
                {form.rol === 'CONTADOR' && 'Acceso a reportes, cortes y facturas. Solo lectura en clientes.'}
                {form.rol === 'VISUALIZADOR' && 'Solo puede consultar información. Sin permisos de escritura.'}
                {form.rol === 'CHOFER' && 'Acceso limitado para visualizar entregas asignadas.'}
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1 rounded-lg h-9" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 rounded-lg h-9 shadow-sm shadow-primary/20" disabled={saving}>
                  {saving ? (
                    <span className="flex items-center gap-1.5">
                      <span className="size-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Guardando...
                    </span>
                  ) : editUser ? 'Guardar cambios' : 'Crear usuario'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
