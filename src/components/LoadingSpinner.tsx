import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner = ({ size = 'md', className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={cn("relative", className)}>
      <div 
        className={cn(
          "animate-spin rounded-full border-2 border-primary/20 border-t-primary",
          sizeClasses[size]
        )}
      />
      <div 
        className={cn(
          "absolute inset-0 animate-pulse rounded-full bg-primary/10",
          sizeClasses[size]
        )}
      />
    </div>
  );
};

export default LoadingSpinner;
export { LoadingSpinner };