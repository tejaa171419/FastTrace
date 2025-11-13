import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Send, CreditCard, Scan, Calculator, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onAddExpense?: () => void;
  onSendMoney?: () => void;
  onScanQR?: () => void;
  onCalculate?: () => void;
}

const FloatingActionButton = ({ 
  onAddExpense, 
  onSendMoney, 
  onScanQR, 
  onCalculate 
}: FloatingActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: CreditCard,
      label: "Add Expense",
      onClick: onAddExpense,
      color: "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
      iconColor: "text-white"
    },
    {
      icon: Send,
      label: "Send Money",
      onClick: onSendMoney,
      color: "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600",
      iconColor: "text-white"
    },
    {
      icon: Scan,
      label: "Scan QR",
      onClick: onScanQR,
      color: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
      iconColor: "text-white"
    },
    {
      icon: Calculator,
      label: "Calculate",
      onClick: onCalculate,
      color: "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600",
      iconColor: "text-white"
    }
  ];

  return (
    <>
      {/* Backdrop overlay when menu is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Button Container - Responsive positioning */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-[110] pb-safe pr-safe">
        {/* Action Buttons */}
        {isOpen && (
          <div className="absolute bottom-[72px] sm:bottom-20 right-0 space-y-2 sm:space-y-3">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div 
                  key={action.label}
                  className="flex items-center justify-end gap-2 sm:gap-3 animate-in slide-in-from-right duration-300"
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  {/* Label - Hidden on very small screens */}
                  <span className="hidden xs:inline-block glass-card backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-foreground border border-white/20 shadow-lg whitespace-nowrap">
                    {action.label}
                  </span>
                  {/* Action Button - Responsive sizing */}
                  <Button
                    size="icon"
                    className={cn(
                      "w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl transition-all duration-300",
                      "hover:scale-110 active:scale-95 border-2 border-white/20",
                      "touch-manipulation", // Better touch response
                      action.color
                    )}
                    onClick={() => {
                      action.onClick?.();
                      setIsOpen(false);
                    }}
                  >
                    <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", action.iconColor)} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Main FAB - Responsive sizing */}
        <Button
          size="icon"
          className={cn(
            "w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl transition-all duration-300",
            "bg-gradient-to-br from-primary via-accent to-primary",
            "hover:scale-110 active:scale-95",
            "border-2 border-white/30",
            "touch-manipulation", // Better touch response
            isOpen ? "rotate-45" : "rotate-0"
          )}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open quick actions menu"}
        >
          {isOpen ? (
            <X className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform duration-300" />
          ) : (
            <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white transition-transform duration-300" />
          )}
        </Button>
      </div>
    </>
  );
};

export default FloatingActionButton;