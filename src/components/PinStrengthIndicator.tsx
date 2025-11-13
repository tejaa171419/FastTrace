import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, X, AlertTriangle, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PinStrengthResult } from '@/hooks/usePinSetup';

interface PinStrengthIndicatorProps {
  strength: PinStrengthResult;
  pin: string;
  className?: string;
  showDetails?: boolean;
}

/**
 * PIN Strength Indicator Component
 * Displays visual feedback about PIN security strength
 */
export const PinStrengthIndicator: React.FC<PinStrengthIndicatorProps> = ({
  strength,
  pin,
  className,
  showDetails = true
}) => {
  if (!pin) return null;

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return {
          badge: 'border-red-500 text-red-400 bg-red-500/10',
          progress: 'bg-red-500',
          icon: 'text-red-400'
        };
      case 'yellow':
        return {
          badge: 'border-yellow-500 text-yellow-400 bg-yellow-500/10',
          progress: 'bg-yellow-500',
          icon: 'text-yellow-400'
        };
      case 'blue':
        return {
          badge: 'border-blue-500 text-blue-400 bg-blue-500/10',
          progress: 'bg-blue-500',
          icon: 'text-blue-400'
        };
      case 'green':
        return {
          badge: 'border-green-500 text-green-400 bg-green-500/10',
          progress: 'bg-green-500',
          icon: 'text-green-400'
        };
      default:
        return {
          badge: 'border-gray-500 text-gray-400 bg-gray-500/10',
          progress: 'bg-gray-500',
          icon: 'text-gray-400'
        };
    }
  };

  const colorClasses = getColorClasses(strength.color);

  const getStrengthIcon = () => {
    switch (strength.color) {
      case 'green':
        return <Check className="w-4 h-4" />;
      case 'blue':
        return <Shield className="w-4 h-4" />;
      case 'yellow':
        return <AlertTriangle className="w-4 h-4" />;
      case 'red':
      default:
        return <X className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">PIN Strength</span>
          <div className={cn('flex items-center gap-1', colorClasses.icon)}>
            {getStrengthIcon()}
          </div>
        </div>
        <Badge variant="outline" className={colorClasses.badge}>
          {strength.label}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={cn('h-full transition-all duration-500 ease-out', colorClasses.progress)}
            style={{ width: `${strength.score}%` }}
          />
        </div>
        
        {/* Score display */}
        <div className="flex justify-between text-xs text-gray-400">
          <span>Weak</span>
          <span className={colorClasses.icon}>
            {strength.score}%
          </span>
          <span>Strong</span>
        </div>
      </div>

      {/* Detailed feedback */}
      {showDetails && strength.feedback && strength.feedback.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-medium">Recommendations:</p>
          <div className="space-y-1">
            {strength.feedback.map((feedback, index) => (
              <div key={index} className="flex items-start gap-2 text-xs text-red-400">
                <X className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{feedback}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security tips for weak PINs */}
      {strength.score < 60 && showDetails && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-blue-300">Security Tips:</p>
              <ul className="text-xs text-blue-200 space-y-0.5">
                <li>• Avoid birthdays or obvious patterns</li>
                <li>• Don't use repeated digits (1111, 2222)</li>
                <li>• Avoid sequential numbers (1234, 4321)</li>
                <li>• Use a mix of numbers that's meaningful to you</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success message for strong PINs */}
      {strength.score >= 80 && showDetails && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <p className="text-xs text-green-300 font-medium">
              Excellent! This PIN provides strong security for your transactions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PinStrengthIndicator;