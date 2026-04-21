import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginView } from '@/features/auth/LoginView';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { ClientesView } from '@/features/clientes/ClientesView';
import { ProductosView } from '@/features/productos/ProductosView';
import { NotasView } from '@/features/notas/NotasView';
import { NuevaNotaView } from '@/features/notas/NuevaNotaView';
import { NotaDetalleView } from '@/features/notas/NotaDetalleView';
import { FacturasView } from '@/features/facturas/FacturasView';
import { CortesView } from '@/features/cortes/CortesView';
import { UsersView } from '@/features/users/UsersView';

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.rol)) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
};

export const router = createBrowserRouter([
  { path: '/login', element: <LoginView /> },
  { path: '/', element: <ProtectedRoute><DashboardView /></ProtectedRoute> },
  { path: '/clientes', element: <ProtectedRoute><ClientesView /></ProtectedRoute> },
  { path: '/productos', element: <ProtectedRoute><ProductosView /></ProtectedRoute> },
  { path: '/notas', element: <ProtectedRoute><NotasView /></ProtectedRoute> },
  { path: '/notas/nueva', element: <ProtectedRoute roles={['SUPER_ADMIN','ADMIN','OPERADOR']}><NuevaNotaView /></ProtectedRoute> },
  { path: '/notas/:id', element: <ProtectedRoute><NotaDetalleView /></ProtectedRoute> },
  { path: '/facturas', element: <ProtectedRoute><FacturasView /></ProtectedRoute> },
  { path: '/cortes', element: <ProtectedRoute roles={['SUPER_ADMIN','ADMIN','CONTADOR']}><CortesView /></ProtectedRoute> },
  { path: '/usuarios', element: <ProtectedRoute roles={['SUPER_ADMIN','ADMIN']}><UsersView /></ProtectedRoute> },
]);
