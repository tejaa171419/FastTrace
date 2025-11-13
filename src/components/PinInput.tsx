import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
  showToggle?: boolean;
  label?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
}

/**
 * PIN Input Component with enhanced UX
 * Features:
 * - Individual digit boxes for better visual feedback
 * - Show/hide toggle
 * - Error states
 * - Auto-focus management
 * - Keyboard navigation
 * - Mobile-optimized
 */
export const PinInput: React.FC<PinInputProps> = ({
  value,
  onChange,
  length = 6,
  placeholder,
  className,
  disabled = false,
  error,
  showToggle = true,
  label,
  autoFocus = false,
  onEnter
}) => {
  const [showPin, setShowPin] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Handle input change
  const handleChange = (newValue: string) => {
    // Only allow digits and limit to max length
    const filteredValue = newValue.replace(/\D/g, '').slice(0, length);
    onChange(filteredValue);
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter();
    }
    // Note: We intentionally do NOT mutate value on keydown for digits or backspace.
    // The input's onChange handler already receives the correct value from the browser,
    // and double-handling here would duplicate digits (e.g., 1 -> 11).
  };

  // Focus management
  useEffect(() => {
    if (autoFocus && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }, [autoFocus]);

  // Update focus when value changes
  useEffect(() => {
    setFocusedIndex(value.length < length ? value.length : -1);
  }, [value, length]);

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm font-medium text-white">
          {label}
        </label>
      )}
      
      <div className="relative">
        {/* Hidden input for mobile keyboards */}
        <input
          ref={hiddenInputRef}
          type={showPin ? 'text' : 'password'}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className="absolute inset-0 w-full h-full opacity-0 cursor-default"
          style={{ fontSize: '16px' }} // Prevent zoom on iOS
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
        />
        
        {/* Visual PIN boxes */}
        <div className="flex gap-2 justify-center">
          {Array.from({ length }, (_, index) => {
            const hasValue = index < value.length;
            const isFocused = index === focusedIndex;
            const digit = hasValue ? value[index] : '';
            
            return (
              <div
                key={index}
                className={cn(
                  'w-12 h-12 rounded-lg border-2 flex items-center justify-center text-lg font-mono transition-all duration-200',
                  {
                    'border-primary bg-primary/20': isFocused,
                    'border-blue-500 bg-blue-500/10': hasValue && !error,
                    'border-red-500 bg-red-500/10': error,
                    'border-gray-600 bg-gray-800/30': !hasValue && !isFocused && !error,
                    'animate-pulse': isFocused,
                    'opacity-50 cursor-not-allowed': disabled
                  }
                )}
                onClick={() => {
                  if (!disabled && hiddenInputRef.current) {
                    hiddenInputRef.current.focus();
                  }
                }}
              >
                {hasValue && (
                  <span className={cn(
                    'text-white',
                    showPin ? 'visible' : 'hidden'
                  )}>
                    {showPin ? digit : '•'}
                  </span>
                )}
                
                {/* Cursor indicator */}
                {isFocused && !hasValue && (
                  <div className="w-0.5 h-6 bg-primary animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Show/Hide toggle */}
        {showToggle && value.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            disabled={disabled}
            className={cn(
              'absolute right-0 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors',
              {
                'opacity-50 cursor-not-allowed': disabled
              }
            )}
          >
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Helper text */}
      {!error && placeholder && value.length === 0 && (
        <p className="text-sm text-gray-400 text-center">
          {placeholder}
        </p>
      )}
    </div>
  );
};

export default PinInput;