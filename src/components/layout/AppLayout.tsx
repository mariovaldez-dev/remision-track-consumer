import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Receipt,
  Scissors, LogOut, Settings, ChevronDown, Home, Menu, X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface NavItem { to: string; label: string; exact?: boolean }
interface NavGroup {
  icon: React.ElementType;
  label: string;
  items: NavItem[];
  adminOnly?: boolean;
}

const groups: NavGroup[] = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    items: [{ to: '/', label: 'Inicio', exact: true }],
  },
  {
    icon: Receipt,
    label: 'Facturación',
    items: [
      { to: '/notas', label: 'Notas de Remisión' },
      { to: '/facturas', label: 'Facturas' },
      { to: '/clientes', label: 'Clientes' },
      { to: '/productos', label: 'Productos' },
    ],
  },
  {
    icon: Scissors,
    label: 'Reportes',
    items: [{ to: '/cortes', label: 'Cortes Mensuales' }],
  },
  {
    icon: Settings,
    label: 'Administración',
    adminOnly: true,
    items: [{ to: '/usuarios', label: 'Usuarios' }],
  },
];

const SidebarGroup = ({ group, onNav }: { group: NavGroup; onNav?: () => void }) => {
  const [open, setOpen] = useState(true);
  const Icon = group.icon;
  const single = group.items.length === 1;

  if (single) {
    return (
      <NavLink
        to={group.items[0].to}
        end={group.items[0].exact}
        onClick={onNav}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all',
            isActive
              ? 'text-primary bg-accent font-semibold'
              : 'text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-muted/60'
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon size={16} className={cn('shrink-0', isActive ? 'text-primary' : 'text-sidebar-foreground/40')} />
            {group.label}
          </>
        )}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-muted/60 transition-all"
      >
        <Icon size={16} className="shrink-0 text-sidebar-foreground/40" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown size={13} className={cn('text-sidebar-foreground/30 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="ml-7 mt-0.5 border-l-2 border-border/60 pl-3 space-y-0.5">
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onNav}
              className={({ isActive }) =>
                cn(
                  'block px-2.5 py-2 rounded-lg text-[13px] transition-all',
                  isActive
                    ? 'text-primary font-semibold bg-accent/60'
                    : 'text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-muted/40 font-medium'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

const SidebarContent = ({ onNav }: { onNav?: () => void }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.rol === 'SUPER_ADMIN' || user?.rol === 'ADMIN';
  const initials = `${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const visibleGroups = groups.filter((g) => !g.adminOnly || isAdmin);

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md shadow-primary/30 shrink-0">
          <FileText size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-sidebar-foreground tracking-tight leading-none">Facturación</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{user?.email}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label} group={group} onNav={onNav} />
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-2.5 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-primary">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-sidebar-foreground truncate leading-tight">
              {user?.nombre} {user?.apellido}
            </p>
            <p className="text-[10px] text-muted-foreground">{user?.rol}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-[220px] shrink-0 flex-col bg-sidebar border-r border-sidebar-border shadow-sm">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[270px] bg-sidebar border-r border-sidebar-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out md:hidden',
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="absolute right-3 top-3.5">
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <SidebarContent onNav={() => setDrawerOpen(false)} />
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="md:hidden h-14 flex items-center gap-3 px-4 bg-card border-b border-border shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <FileText size={11} className="text-white" />
            </div>
            <span className="text-[14px] font-bold text-foreground">Facturación</span>
          </div>
          {/* Quick nav links for mobile */}
          <NavLink to="/" end className={({ isActive }) => cn('p-2 rounded-xl transition-colors', isActive ? 'text-primary bg-accent' : 'text-muted-foreground hover:bg-muted')}>
            <Home size={18} />
          </NavLink>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
