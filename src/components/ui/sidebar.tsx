
import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { Button } from './button';

type SidebarContextType = {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ 
  children,
  defaultExpanded = true
}: { 
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  const toggleExpanded = () => setExpanded(prev => !prev);
  
  return (
    <SidebarContext.Provider value={{ expanded, setExpanded, toggleExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
};

export function Sidebar({ 
  className, 
  children 
}: { 
  className?: string;
  children: React.ReactNode;
}) {
  const { expanded } = useSidebar();
  
  return (
    <aside className={cn(
      "z-20 h-screen sticky top-0 transition-all duration-300 ease-in-out overflow-hidden border-r dark:border-gray-800 flex flex-col justify-between",
      expanded ? "w-64" : "w-[70px]",
      className
    )}>
      <div className="flex flex-col flex-grow overflow-y-auto">
        {children}
      </div>
      <SidebarFooter />
    </aside>
  );
}

export function SidebarHeader({ 
  className, 
  children 
}: { 
  className?: string;
  children?: React.ReactNode;
}) {
  const { expanded, toggleExpanded } = useSidebar();
  
  return (
    <div className={cn(
      "h-16 flex items-center px-4 sticky top-0 border-b bg-background dark:border-gray-800 z-20",
      className
    )}>
      <div className="flex items-center justify-between w-full">
        {children}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleExpanded} 
          className="h-8 w-8"
        >
          {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </Button>
      </div>
    </div>
  );
}

export function SidebarContent({ 
  className, 
  children 
}: { 
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto py-2", className)}>
      {children}
    </div>
  );
}

export function SidebarFooter({ 
  className, 
  children 
}: { 
  className?: string;
  children?: React.ReactNode;
}) {
  const { expanded } = useSidebar();
  
  return (
    <div className={cn("p-4 border-t dark:border-gray-800 mt-auto", className)}>
      {children || (
        <Button 
          variant="destructive" 
          className="w-full flex items-center justify-center gap-2" 
          size={expanded ? "default" : "icon"}
        >
          <LogOut size={16} />
          {expanded && "Logout"}
        </Button>
      )}
    </div>
  );
}

export function SidebarItem({ 
  className, 
  children,
  icon,
  title,
  active,
  href = "#",
  onClick
}: { 
  className?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  title?: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const { expanded } = useSidebar();
  
  return (
    <a 
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center py-2 px-4 text-sm transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800",
        active && "bg-gray-100 dark:bg-gray-800 font-medium",
        className
      )}
      title={!expanded ? title : undefined}
    >
      {icon && (
        <span className={cn("mr-3", !expanded && "mr-0")}>{icon}</span>
      )}
      {(expanded || !icon) && children}
    </a>
  );
}

export function SidebarTrigger({
  className
}: {
  className?: string;
}) {
  const { toggleExpanded } = useSidebar();
  
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleExpanded}
      className={cn("h-8 w-8", className)}
    >
      <ChevronRight size={18} />
    </Button>
  );
}

export function SidebarGroup({
  className,
  title,
  children
}: {
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  const { expanded } = useSidebar();
  
  return (
    <div className={cn("py-2", className)}>
      {title && expanded && (
        <h3 className="px-4 mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}
