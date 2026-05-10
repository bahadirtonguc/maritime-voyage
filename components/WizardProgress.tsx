import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  label: string;
  description: string;
}

interface Props {
  steps: Step[];
  currentStep: number;
}

export function WizardProgress({ steps, currentStep }: Props) {
  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, i) => {
        const isDone = i < currentStep;
        const isActive = i === currentStep;
        return (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold border-2 transition-all',
                  isDone && 'bg-green-500 border-green-500 text-white',
                  isActive && 'bg-primary border-primary text-white',
                  !isDone && !isActive && 'bg-transparent border-border text-muted-foreground'
                )}
              >
                {isDone ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div className="mt-1 text-center hidden sm:block">
                <p className={cn('text-xs font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('flex-1 h-0.5 mx-2 transition-all', i < currentStep ? 'bg-green-500' : 'bg-border')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
