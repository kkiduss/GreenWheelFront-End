
import { BikeStatus } from '@/types';
import { cn } from '@/lib/utils';

interface BikeStatusBadgeProps {
  status: BikeStatus;
  className?: string;
  onClick?: () => void;
  pulseOnUpdate?: boolean;
}

const BikeStatusBadge = ({
  status,
  className,
  onClick,
  pulseOnUpdate = false,
}: BikeStatusBadgeProps) => {
  const badgeClasses = cn(
    'status-badge',
    {
      'status-available': status === 'available',
      'status-in-use': status === 'in-use',
      'status-maintenance': status === 'maintenance',
      'pulse-on-update': pulseOnUpdate,
      'cursor-pointer': !!onClick,
    },
    className
  );

  const statusText = {
    'available': 'Available',
    'in-use': 'In Use',
    'maintenance': 'Maintenance'
  };

  return (
    <span className={badgeClasses} onClick={onClick}>
      <span className={`inline-block w-2 h-2 rounded-full bg-current`}></span>
      <span>{statusText[status]}</span>
    </span>
  );
};

export default BikeStatusBadge;
