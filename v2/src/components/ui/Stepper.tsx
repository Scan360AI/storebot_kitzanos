import { Check } from 'lucide-react';
import { clsx } from 'clsx';

export interface Step {
  id: string;
  label: string;
  completed: boolean;
}

export interface StepperProps {
  steps: Step[];
  currentStep: string;
}

export const Stepper = ({ steps, currentStep }: StepperProps) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.completed;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex-1 flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    'border-2 transition-all duration-200',
                    isCompleted
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : isCurrent
                      ? 'border-primary-500 bg-white text-primary-500'
                      : 'border-gray-300 bg-white text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                <div className="mt-2 text-center">
                  <p
                    className={clsx(
                      'text-sm font-medium',
                      isCurrent ? 'text-primary-600' : 'text-gray-600'
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 mb-8">
                  <div
                    className={clsx(
                      'h-full transition-all duration-300',
                      isCompleted ? 'bg-primary-500' : 'bg-gray-300'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
