import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface HamburgerSidebarToggleProps {
  className?: string;
}

export function HamburgerSidebarToggle({ className = "" }: HamburgerSidebarToggleProps) {
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
        ${isHovered ? 'shadow-lg shadow-primary/20 scale-105' : ''}
        ${className}
      `}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Pulsing ring effect */}
      <div className={`
        absolute inset-0 rounded-xl border-2 border-blue-500/50
        transition-all duration-300 ease-out
        ${isHovered ? 'scale-110 opacity-0' : 'scale-100 opacity-0'}
      `} />

      {/* Hamburger icon with morphing animation */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full gap-[4px]">
        {/* Top line */}
        <div 
          className={`
            h-[2.5px] bg-white/90 rounded-full
            transition-all duration-300 ease-out
            ${collapsed ? 'w-5' : 'w-4 rotate-45 translate-y-[6.5px]'}
            ${isHovered && collapsed ? 'w-6 bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' : ''}
            ${isHovered && !collapsed ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : ''}
          `}
        />
        
        {/* Middle line */}
        <div 
          className={`
            h-[2.5px] bg-white/90 rounded-full
            transition-all duration-300 ease-out
            ${collapsed ? 'w-5 opacity-100' : 'w-0 opacity-0'}
            ${isHovered && collapsed ? 'w-6 bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' : ''}
          `}
        />
        
        {/* Bottom line */}
        <div 
          className={`
            h-[2.5px] bg-white/90 rounded-full
            transition-all duration-300 ease-out
            ${collapsed ? 'w-5' : 'w-4 -rotate-45 -translate-y-[6.5px]'}
            ${isHovered && collapsed ? 'w-6 bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' : ''}
            ${isHovered && !collapsed ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]' : ''}
          `}
        />
      </div>

      {/* Click ripple effect */}
      <span className="absolute inset-0 overflow-hidden rounded-xl">
        <span className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 opacity-0 group-active:opacity-100 group-active:animate-ping transition-opacity" />
      </span>

      {/* Tooltip */}
      <div className={`
        absolute -bottom-10 left-1/2 -translate-x-1/2
        px-3 py-1.5 rounded-lg
        bg-black/95 backdrop-blur-xl border border-white/10
        text-xs font-medium text-white whitespace-nowrap
        opacity-0 group-hover:opacity-100
        transition-all duration-300 ease-out
        pointer-events-none z-50
        ${isHovered ? 'translate-y-0' : 'translate-y-2'}
      `}>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${collapsed ? 'bg-blue-400' : 'bg-purple-400'} animate-pulse`} />
          {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        </div>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/95 border-l border-t border-white/10 rotate-45" />
      </div>
    </Button>
  );
}

export default HamburgerSidebarToggle;
