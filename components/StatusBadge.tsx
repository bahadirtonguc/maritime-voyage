import { cn, statusColor } from '@/lib/utils';
import type { VoyageStatus } from '@/types';

interface Props {
  status: VoyageStatus;
  className?: string;
}

const LABELS: Record<VoyageStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  completed: 'Completed',
  closed: 'Closed',
};

export function StatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        statusColor(status),
        className
      )}
    >
      {LABELS[status]}
    </span>
  );
}
