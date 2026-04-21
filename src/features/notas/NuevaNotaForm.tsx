import { useState, useCallback } from 'react';
import { api } from '../../lib/api';
import { NotaDocument } from './NotaPDF';
import { PDFDownloadLink } from '@react-pdf/renderer';

// ─── Types ──────────────────────────────────────────────────────────────────
interface ItemForm {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPct: number;
}

interface NotaGuardada {
  folio: string;
  cliente: { nombreComercial: string };
  fechaEmision: string;
  total: number;
  subtotal: number;
  descuento: number;
  items: ItemForm[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const calcSubtotal = (item: ItemForm) => {
  const base = item.cantidad * item.precioUnitario;
  return base - base * (item.descuentoPct / 100);
};

const EMPTY_ITEM: ItemForm = { descripcion: '', cantidad: 1, precioUnitario: 0, descuentoPct: 0 };

// ─── Componente Principal ─────────────────────────────────────────────────────
export const NuevaNotaForm = () => {
  const [step, setStep] = useState<'form' | 'preview'>('form');
  const [clienteId, setClienteId] = useState('');
  const [folioMode, setFolioMode] = useState<'auto' | 'manual'>('auto');
  const [folioManual, setFolioManual] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<ItemForm[]>([{ ...EMPTY_ITEM }]);
  const [loading, setLoading] = useState(false);
  const [notaGuardada, setNotaGuardada] = useState<NotaGuardada | null>(null);

  // ── Computed ──
  const subtotalTotal = items.reduce((acc, i) => acc + calcSubtotal(i), 0);
  const descuentoTotal = items.reduce((acc, i) => {
    const base = i.cantidad * i.precioUnitario;
    return acc + base * (i.descuentoPct / 100);
  }, 0);
  const total = subtotalTotal;

  // ── Item handlers ──
  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = useCallback((idx: number, field: keyof ItemForm, value: string | number) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }, []);

  // ── Form validation ──
  const isValid = clienteId.trim() && items.every(i => i.descripcion && i.cantidad > 0 && i.precioUnitario >= 0);

  // ── Guardar ──
  const handleGuardar = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        clienteId,
        fechaEmision,
        fechaVencimiento: fechaVencimiento || undefined,
        observaciones: observaciones || undefined,
        items: items.map(i => ({
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          descuentoPct: i.descuentoPct,
        })),
      };
      if (folioMode === 'manual' && folioManual.trim()) {
        payload.folioManual = folioManual.trim();
      }

      const { data } = await api.post('/notas', payload);
      setNotaGuardada(data.data);
      setStep('preview');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al crear la nota');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset ──
  const handleNueva = () => {
    setStep('form');
    setClienteId('');
    setFolioManual('');
    setFolioMode('auto');
    setItems([{ ...EMPTY_ITEM }]);
    setNotaGuardada(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: FORMULARIO
  // ─────────────────────────────────────────────────────────────────────────
  if (step === 'form') {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">📄</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Nueva Nota de Remisión</h1>
              <p className="text-sm text-muted-foreground">Complete los campos para generar la nota</p>
            </div>
          </div>

          {/* Card: Info General */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Información General</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cliente */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">ID del Cliente *</label>
                <input
                  id="nota-cliente-id"
                  type="text"
                  className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={clienteId}
                  onChange={e => setClienteId(e.target.value)}
                  placeholder="UUID del cliente..."
                />
              </div>

              {/* Folio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Folio</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFolioMode('auto')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      folioMode === 'auto'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Autogenerar (NR-{new Date().getFullYear()}-####)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFolioMode('manual')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      folioMode === 'manual'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Definir manualmente
                  </button>
                </div>
                {folioMode === 'manual' && (
                  <input
                    id="nota-folio-manual"
                    type="text"
                    className="mt-2 w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={folioManual}
                    onChange={e => setFolioManual(e.target.value.toUpperCase())}
                    placeholder="Ej. NR-2026-ESPECIAL-01"
                  />
                )}
              </div>

              {/* Fechas */}
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de Emisión *</label>
                <input
                  id="nota-fecha-emision"
                  type="date"
                  className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={fechaEmision}
                  onChange={e => setFechaEmision(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de Vencimiento</label>
                <input
                  id="nota-fecha-vencimiento"
                  type="date"
                  className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={fechaVencimiento}
                  onChange={e => setFechaVencimiento(e.target.value)}
                />
              </div>

              {/* Observaciones */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Observaciones</label>
                <textarea
                  id="nota-observaciones"
                  rows={2}
                  className="w-full border border-input bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  placeholder="Instrucciones especiales, condiciones, etc."
                />
              </div>
            </div>
          </div>

          {/* Card: Productos */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Productos / Servicios</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors"
              >
                + Agregar línea
              </button>
            </div>

            {/* Table header – hidden on mobile */}
            <div className="hidden md:grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
              <span className="col-span-4">Descripción</span>
              <span className="col-span-2 text-right">Cantidad</span>
              <span className="col-span-2 text-right">Precio Unit.</span>
              <span className="col-span-2 text-right">Desc. %</span>
              <span className="col-span-1 text-right">Importe</span>
              <span className="col-span-1" />
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-2 md:grid-cols-12 gap-2 items-center bg-muted/30 rounded-lg p-3">
                  {/* Descripción */}
                  <div className="col-span-2 md:col-span-4">
                    <label className="md:hidden text-xs text-muted-foreground mb-0.5 block">Descripción</label>
                    <input
                      type="text"
                      className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-sm"
                      placeholder="Producto o servicio"
                      value={item.descripcion}
                      onChange={e => updateItem(idx, 'descripcion', e.target.value)}
                    />
                  </div>
                  {/* Cantidad */}
                  <div className="md:col-span-2">
                    <label className="md:hidden text-xs text-muted-foreground mb-0.5 block">Cantidad</label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-sm text-right"
                      value={item.cantidad}
                      onChange={e => updateItem(idx, 'cantidad', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  {/* Precio */}
                  <div className="md:col-span-2">
                    <label className="md:hidden text-xs text-muted-foreground mb-0.5 block">Precio Unit.</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-sm text-right"
                      value={item.precioUnitario}
                      onChange={e => updateItem(idx, 'precioUnitario', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  {/* Descuento */}
                  <div className="md:col-span-2">
                    <label className="md:hidden text-xs text-muted-foreground mb-0.5 block">Desc. %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-sm text-right"
                      value={item.descuentoPct}
                      onChange={e => updateItem(idx, 'descuentoPct', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  {/* Importe */}
                  <div className="md:col-span-1 text-right">
                    <label className="md:hidden text-xs text-muted-foreground mb-0.5 block">Importe</label>
                    <span className="text-sm font-semibold">${calcSubtotal(item).toFixed(2)}</span>
                  </div>
                  {/* Eliminar */}
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="text-destructive hover:text-destructive/80 disabled:opacity-30 text-lg font-bold transition-opacity"
                      title="Eliminar línea"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales + CTA */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Totales */}
            <div className="space-y-1 text-sm">
              <div className="flex gap-6 text-muted-foreground">
                <span>Subtotal bruto: <span className="text-foreground font-medium">${(subtotalTotal + descuentoTotal).toFixed(2)}</span></span>
                <span>Descuento: <span className="text-destructive font-medium">-${descuentoTotal.toFixed(2)}</span></span>
              </div>
              <div className="text-lg font-bold text-foreground">
                Total: <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Botón */}
            <button
              id="nota-btn-guardar"
              type="button"
              onClick={handleGuardar}
              disabled={!isValid || loading}
              className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-xl font-semibold text-sm transition-colors shadow-md"
            >
              {loading ? 'Guardando...' : 'Guardar y Ver Vista Previa'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: CONFIRMACIÓN + PDF
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Éxito */}
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">Nota creada correctamente</p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Folio: <strong>{notaGuardada?.folio}</strong> — Total: <strong>${Number(notaGuardada?.total).toFixed(2)}</strong>
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-3">
          <button
            id="nota-btn-nueva"
            type="button"
            onClick={handleNueva}
            className="px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-medium transition-colors"
          >
            ← Crear otra nota
          </button>
          {notaGuardada && (
            <PDFDownloadLink
              document={<NotaDocument nota={notaGuardada} />}
              fileName={`${notaGuardada.folio}.pdf`}
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              {({ loading: pdfLoading }) => pdfLoading ? 'Preparando PDF...' : '⬇ Descargar PDF'}
            </PDFDownloadLink>
          )}
        </div>

        {/* Resumen de la nota */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">Resumen de la Nota</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2">Descripción</th>
                  <th className="text-right py-2">Cant.</th>
                  <th className="text-right py-2">P. Unit</th>
                  <th className="text-right py-2">Desc.</th>
                  <th className="text-right py-2">Importe</th>
                </tr>
              </thead>
              <tbody>
                {(notaGuardada?.items ?? items).map((item, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2">{item.descripcion}</td>
                    <td className="py-2 text-right">{item.cantidad}</td>
                    <td className="py-2 text-right">${item.precioUnitario}</td>
                    <td className="py-2 text-right">{item.descuentoPct}%</td>
                    <td className="py-2 text-right font-medium">${calcSubtotal(item).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="text-right space-y-1 text-sm">
              <p>Subtotal: <span className="font-medium">${Number(notaGuardada?.subtotal).toFixed(2)}</span></p>
              <p>Descuento: <span className="text-destructive">-${Number(notaGuardada?.descuento).toFixed(2)}</span></p>
              <p className="text-base font-bold">Total: <span className="text-primary">${Number(notaGuardada?.total).toFixed(2)}</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
