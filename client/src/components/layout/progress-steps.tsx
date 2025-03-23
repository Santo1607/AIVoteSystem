import React from 'react';

interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
  completedSteps?: number;
}

const ProgressSteps = ({ 
  currentStep, 
  totalSteps, 
  completedSteps = 0 
}: ProgressStepsProps) => {
  return (
    <div className="flex justify-between px-6 pt-6">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber <= completedSteps;
        
        const stepClasses = isCompleted
          ? "bg-green-600 text-white"
          : isActive
          ? "bg-primary text-white"
          : "bg-neutral-200 text-neutral-600";
        
        const lineClasses = isCompleted
          ? "bg-green-600"
          : index < currentStep - 1
          ? "bg-green-600"
          : "bg-neutral-200";
        
        return (
          <div 
            key={stepNumber} 
            className={`flex items-center ${index < totalSteps - 1 ? "flex-1" : ""}`}
          >
            <div 
              className={`
                progress-step w-8 h-8 rounded-full flex items-center 
                justify-center transition-colors ${stepClasses}
              `}
            >
              {isCompleted ? "✓" : stepNumber}
            </div>
            
            {index < totalSteps - 1 && (
              <div 
                className={`h-1 flex-1 mx-2 transition-colors ${lineClasses}`}
              ></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressSteps;
