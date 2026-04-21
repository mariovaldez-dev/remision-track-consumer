import { cn } from '@/lib/utils';

const map: Record<string, string> = {
  PENDIENTE:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  PARCIAL:      'bg-blue-50 text-blue-700 border-blue-200',
  PAGADO:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELADO:    'bg-red-50 text-red-600 border-red-200',
  VENCIDO:      'bg-orange-50 text-orange-700 border-orange-200',
  FACTURADO:    'bg-violet-50 text-violet-700 border-violet-200',
  VIGENTE:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  ABIERTO:      'bg-blue-50 text-blue-700 border-blue-200',
  CERRADO:      'bg-slate-50 text-slate-600 border-slate-200',
  ACTIVO:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVO:     'bg-red-50 text-red-600 border-red-200',
};

const labels: Record<string, string> = {
  PENDIENTE: 'Pendiente', PARCIAL: 'Parcial', PAGADO: 'Pagado',
  CANCELADO: 'Cancelado', VENCIDO: 'Vencido', FACTURADO: 'Facturado',
  VIGENTE: 'Vigente', ABIERTO: 'Abierto', CERRADO: 'Cerrado',
  ACTIVO: 'Activo', INACTIVO: 'Inactivo',
};

export const StatusBadge = ({ status, dot }: { status: string; dot?: boolean }) => (
  <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border', map[status] ?? 'bg-muted text-muted-foreground border-border')}>
    {dot && <span className={cn('w-1.5 h-1.5 rounded-full', status === 'PAGADO' || status === 'VIGENTE' ? 'bg-emerald-500' : status === 'VENCIDO' || status === 'CANCELADO' || status === 'INACTIVO' ? 'bg-red-400' : status === 'FACTURADO' ? 'bg-violet-500' : 'bg-yellow-500')} />}
    {labels[status] ?? status}
  </span>
);
