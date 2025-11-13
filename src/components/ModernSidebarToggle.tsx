import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";

interface ModernSidebarToggleProps {
  className?: string;
}

export function ModernSidebarToggle({ className = "" }: ModernSidebarToggleProps) {
  const { toggleSidebar, state } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);
  const collapsed = state === "collapsed";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleSidebar}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative h-10 w-10 p-0 rounded-xl
        bg-gradient-to-br from-white/10 to-white/5
        hover:from-white/15 hover:to-white/10
        border border-white/10 hover:border-white/20
        transition-all duration-300 ease-out
        group overflow-hidden
        ${isHovered ? 'shadow-lg shadow-primary/20' : ''}
        ${className}
      `}
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 animate-pulse" />
      </div>

      {/* Icon container with rotation animation */}
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <div className={`
          transition-all duration-300 ease-out
          ${isHovered ? 'scale-110 rotate-12' : 'scale-100 rotate-0'}
        `}>
          {collapsed ? (
            <PanelLeftOpen 
              className={`
                w-5 h-5 transition-all duration-300
                ${isHovered 
                  ? 'text-white drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]' 
                  : 'text-white/80'
                }
              `}
              strokeWidth={2.5}
            />
          ) : (
            <PanelLeftClose 
              className={`
                w-5 h-5 transition-all duration-300
                ${isHovered 
                  ? 'text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' 
                  : 'text-white/80'
                }
              `}
              strokeWidth={2.5}
            />
          )}
        </div>
      </div>

      {/* Ripple effect on click */}
      <span className="absolute inset-0 overflow-hidden rounded-xl">
        <span className="absolute inset-0 bg-white/20 opacity-0 group-active:opacity-100 group-active:animate-ping transition-opacity" />
      </span>

      {/* Tooltip indicator */}
      <div className={`
        absolute -bottom-10 left-1/2 -translate-x-1/2
        px-3 py-1.5 rounded-lg
        bg-black/90 backdrop-blur-xl border border-white/10
        text-xs font-medium text-white whitespace-nowrap
        opacity-0 group-hover:opacity-100
        transition-all duration-300 ease-out
        pointer-events-none
        ${isHovered ? 'translate-y-0' : 'translate-y-2'}
      `}>
        {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 border-l border-t border-white/10 rotate-45" />
      </div>
    </Button>
  );
}

export default ModernSidebarToggle;
