import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  backTo?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader = ({ title, backTo, actions, className }: PageHeaderProps) => {
  const navigate = useNavigate();
  return (
    <div className={cn('h-[57px] flex items-center gap-3 px-6 bg-card border-b border-border sticky top-0 z-10', className)}>
      {backTo && (
        <button
          onClick={() => navigate(backTo)}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
      )}
      <h1 className="text-[15px] font-bold text-foreground tracking-tight flex-1">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};
