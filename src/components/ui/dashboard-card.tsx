
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  trend?: string;
  color?: string;
  className?: string;
  loading?: boolean;
}

const DashboardCard = ({
  title,
  value,
  icon,
  trend,
  color = 'var(--primary)',
  className,
  loading = false,
}: DashboardCardProps) => {
  return (
    <div
      className={cn(
        "dashboard-card animate-scale",
        loading && "animate-pulse",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold" style={{ color }}>
              {loading ? '-' : value}
            </p>
          </div>
          {trend && (
            <p className="mt-1 text-sm text-gray-500">{trend}</p>
          )}
        </div>
        {icon && (
          <div
            className="p-2 rounded-md"
            style={{ backgroundColor: `${color}15` }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;
