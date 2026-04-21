import { useState } from 'react';
import { api } from '../../lib/api';

export const RegistroPagoForm = ({ notaId, saldoPendiente, onPagoSuccess }: { notaId: string, saldoPendiente: number, onPagoSuccess: () => void }) => {
  const [monto, setMonto] = useState<number>(0);
  const [formaPago, setFormaPago] = useState<string>('TRANSFERENCIA');
  const [referencia, setReferencia] = useState<string>('');

  const handleRegistrar = async () => {
    if (monto <= 0 || monto > saldoPendiente) {
      alert('Monto inválido');
      return;
    }

    try {
      await api.post('/pagos', {
        notaId,
        monto,
        fechaPago: new Date().toISOString(),
        formaPago,
        referencia
      });
      alert('Pago registrado correctamente');
      onPagoSuccess();
    } catch (error) {
      alert('Error al registrar pago');
      console.error(error);
    }
  };

  return (
    <div className="p-4 border rounded shadow-sm">
      <h3 className="text-lg font-bold mb-2">Registrar Pago</h3>
      <p className="text-sm text-gray-600 mb-4">Saldo Pendiente: ${saldoPendiente}</p>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm">Monto</label>
          <input 
            type="number" 
            className="border p-2 w-full rounded" 
            value={monto} 
            onChange={e => setMonto(Number(e.target.value))} 
            max={saldoPendiente}
          />
        </div>
        <div>
          <label className="block text-sm">Forma de Pago</label>
          <select className="border p-2 w-full rounded" value={formaPago} onChange={e => setFormaPago(e.target.value)}>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="CHEQUE">Cheque</option>
            <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
            <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Referencia (Opcional)</label>
          <input 
            type="text" 
            className="border p-2 w-full rounded" 
            value={referencia} 
            onChange={e => setReferencia(e.target.value)} 
          />
        </div>
        <button className="bg-blue-600 text-white w-full py-2 rounded mt-2" onClick={handleRegistrar}>
          Aplicar Pago
        </button>
      </div>
    </div>
  );
};
