import type { Voyage } from '@/types';

interface Props {
  voyages: Voyage[];
}

export function TransitFlagsWidget({ voyages }: Props) {
  const counts = { bosphorus: 0, suez: 0, dardanelles: 0 };

  voyages.forEach((v) => {
    v.portRotation.forEach((p) => {
      if (p.isBosphorus) counts.bosphorus++;
      if (p.isSuez) counts.suez++;
      if (p.isDardanelles) counts.dardanelles++;
    });
  });

  const maxCount = Math.max(counts.bosphorus, counts.suez, counts.dardanelles, 1);

  const items = [
    { label: 'Bosphorus Transits', count: counts.bosphorus, color: 'bg-blue-500', text: 'text-blue-400' },
    { label: 'Suez Canal Transits', count: counts.suez, color: 'bg-amber-500', text: 'text-amber-400' },
    { label: 'Dardanelles Transits', count: counts.dardanelles, color: 'bg-purple-500', text: 'text-purple-400' },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Strait Transits</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className={`text-xs font-semibold ${item.text}`}>{item.count}</span>
            </div>
            <div className="h-1.5 bg-background rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
