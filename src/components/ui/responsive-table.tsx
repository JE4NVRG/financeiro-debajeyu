import React from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { cn } from '../../lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './table';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface ResponsiveTableCellProps {
  children: React.ReactNode;
  className?: string;
  header?: string;
  priority?: 'high' | 'medium' | 'low';
  hideOnMobile?: boolean;
}

interface ResponsiveTableHeadProps {
  children: React.ReactNode;
  className?: string;
  priority?: 'high' | 'medium' | 'low';
  hideOnMobile?: boolean;
}

// Main ResponsiveTable component
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  const { isMobile } = useResponsive();

  return (
    <div className={cn(
      "relative w-full",
      isMobile ? "overflow-x-auto" : "overflow-auto",
      className
    )}>
      <Table className={cn(
        isMobile && "min-w-full"
      )}>
        {children}
      </Table>
    </div>
  );
}

// ResponsiveTableHeader component
export function ResponsiveTableHeader({ children, className }: ResponsiveTableHeaderProps) {
  return (
    <TableHeader className={className}>
      {children}
    </TableHeader>
  );
}

// ResponsiveTableBody component
export function ResponsiveTableBody({ children, className }: ResponsiveTableBodyProps) {
  return (
    <TableBody className={className}>
      {children}
    </TableBody>
  );
}

// ResponsiveTableRow component
export function ResponsiveTableRow({ children, className, onClick }: ResponsiveTableRowProps) {
  const { isMobile } = useResponsive();

  return (
    <TableRow 
      className={cn(
        onClick && "cursor-pointer",
        isMobile && "hover:bg-bg-secondary",
        className
      )}
      onClick={onClick}
    >
      {children}
    </TableRow>
  );
}

// ResponsiveTableHead component
export function ResponsiveTableHead({ 
  children, 
  className, 
  priority = 'medium',
  hideOnMobile = false 
}: ResponsiveTableHeadProps) {
  const { isMobile } = useResponsive();

  // Hide low priority columns on mobile
  if (isMobile && (hideOnMobile || priority === 'low')) {
    return null;
  }

  return (
    <TableHead className={cn(
      // Responsive padding
      isMobile ? "px-2 py-3" : "px-4 py-3",
      // Priority-based styling
      priority === 'high' && "font-semibold",
      priority === 'low' && "text-xs",
      className
    )}>
      {children}
    </TableHead>
  );
}

// ResponsiveTableCell component
export function ResponsiveTableCell({ 
  children, 
  className, 
  header,
  priority = 'medium',
  hideOnMobile = false 
}: ResponsiveTableCellProps) {
  const { isMobile } = useResponsive();

  // Hide low priority columns on mobile
  if (isMobile && (hideOnMobile || priority === 'low')) {
    return null;
  }

  return (
    <TableCell className={cn(
      // Responsive padding
      isMobile ? "px-2 py-3" : "px-4 py-4",
      // Mobile-specific styling
      isMobile && "text-sm",
      className
    )}>
      {/* Show header label on mobile for better context */}
      {isMobile && header && (
        <div className="block sm:hidden">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            {header}
          </span>
        </div>
      )}
      <div className={cn(
        isMobile && header && "mt-1"
      )}>
        {children}
      </div>
    </TableCell>
  );
}

// Mobile Card Layout Alternative
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileCard({ children, className, onClick }: MobileCardProps) {
  const { isMobile } = useResponsive();

  if (!isMobile) {
    return null;
  }

  return (
    <div 
      className={cn(
        "bg-bg-primary border border-border-color rounded-lg p-4 mb-3",
        "shadow-sm hover:shadow-md transition-shadow duration-200",
        onClick && "cursor-pointer hover:bg-bg-secondary",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Mobile Card Field
interface MobileCardFieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function MobileCardField({ label, value, className }: MobileCardFieldProps) {
  return (
    <div className={cn("flex justify-between items-center py-1", className)}>
      <span className="text-sm font-medium text-text-secondary">{label}:</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}

// Utility hook for table responsiveness
export function useTableResponsive() {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getColumnVisibility = (priority: 'high' | 'medium' | 'low') => {
    if (isMobile) {
      return priority === 'high';
    }
    if (isTablet) {
      return priority !== 'low';
    }
    return true; // Desktop shows all columns
  };

  const getTableClasses = () => ({
    container: cn(
      "relative w-full",
      isMobile ? "overflow-x-auto" : "overflow-auto"
    ),
    table: cn(
      isMobile && "min-w-full text-sm"
    ),
    cell: cn(
      isMobile ? "px-2 py-2" : isTablet ? "px-3 py-3" : "px-4 py-4"
    ),
    header: cn(
      isMobile ? "px-2 py-2 text-xs" : isTablet ? "px-3 py-3 text-sm" : "px-4 py-3"
    )
  });

  return {
    isMobile,
    isTablet,
    isDesktop,
    getColumnVisibility,
    getTableClasses
  };
}