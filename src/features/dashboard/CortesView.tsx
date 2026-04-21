import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

export const CortesView = () => {
  const [cortes, setCortes] = useState<any[]>([]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());

  const fetchCortes = async () => {
    try {
      const { data } = await api.get('/cortes');
      setCortes(data.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCortes();
  }, []);

  const handleGenerate = async () => {
    try {
      await api.post('/cortes', { mes, anio });
      alert('Corte generado exitosamente');
      fetchCortes();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al generar el corte');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Cortes Mensuales</h1>
      
      <div className="bg-white p-4 rounded shadow-sm flex items-end gap-4 mb-8">
        <div>
          <label className="block text-sm">Mes</label>
          <input type="number" className="border p-2 rounded w-20" value={mes} onChange={e => setMes(Number(e.target.value))} min={1} max={12} />
        </div>
        <div>
          <label className="block text-sm">Año</label>
          <input type="number" className="border p-2 rounded w-24" value={anio} onChange={e => setAnio(Number(e.target.value))} />
        </div>
        <button onClick={handleGenerate} className="bg-green-600 text-white px-4 py-2 rounded font-semibold">
          Generar Corte
        </button>
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-medium text-gray-600">Periodo</th>
              <th className="p-4 font-medium text-gray-600">Ventas Totales</th>
              <th className="p-4 font-medium text-gray-600">Cobrado</th>
              <th className="p-4 font-medium text-gray-600">Pendiente</th>
              <th className="p-4 font-medium text-gray-600">Notas Canceladas</th>
            </tr>
          </thead>
          <tbody>
            {cortes.map(c => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-semibold">{c.mes}/{c.anio}</td>
                <td className="p-4 text-green-600">${c.totalVentas}</td>
                <td className="p-4 text-blue-600">${c.totalCobrado}</td>
                <td className="p-4 text-red-500">${c.totalPendiente}</td>
                <td className="p-4">{c.notasCanceladas}</td>
              </tr>
            ))}
            {cortes.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">No hay cortes generados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
