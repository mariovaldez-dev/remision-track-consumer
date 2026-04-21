import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export const DashboardView = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await api.get('/dashboard/metrics');
        setMetrics(data.data);
      } catch (error) {
        console.error('Error fetching metrics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <div>Cargando dashboard...</div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Ventas del Mes</p>
            <p className="text-2xl font-bold text-gray-800">${metrics?.kpis.totalVentasMes}</p>
          </div>
          <ArrowUpRight className="text-green-500" size={32} />
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Cobranza del Mes</p>
            <p className="text-2xl font-bold text-gray-800">${metrics?.kpis.cobranzaMes}</p>
          </div>
          <CheckCircle className="text-blue-500" size={32} />
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Cartera Vencida</p>
            <p className="text-2xl font-bold text-red-600">{metrics?.kpis.notasVencidas} Notas</p>
          </div>
          <AlertTriangle className="text-red-500" size={32} />
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Saldo Pendiente Global</p>
            <p className="text-2xl font-bold text-orange-500">${metrics?.kpis.saldoPendienteTotal}</p>
          </div>
          <Clock className="text-orange-400" size={32} />
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Productos Vendidos (Unidades)</h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={metrics?.topProductos || []}>
            <XAxis dataKey="nombre" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
