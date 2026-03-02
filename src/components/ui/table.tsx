import React from "react";
import { cn } from "@/lib/utils/cn";

export const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement> & { className?: string }>(({ className, children, ...props }, ref) => (
  <div className="w-full overflow-auto">
    <table ref={ref} className={cn("w-full text-sm", className)} {...props}>{children}</table>
  </div>
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement> & { className?: string }>(({ className, children, ...props }, ref) => (
  <thead ref={ref} className={cn("bg-surface-muted", className)} {...props}>{children}</thead>
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(({ className, children, ...props }, ref) => (
  <tbody ref={ref} className={cn(className)} {...props}>{children}</tbody>
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement> & { className?: string }>(({ className, children, ...props }, ref) => (
  <tr ref={ref} className={cn("border-b border-border hover:bg-surface-muted/50 transition-colors", className)} {...props}>{children}</tr>
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement> & { className?: string }>(({ className, children, ...props }, ref) => (
  <th ref={ref} className={cn("px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider", className)} {...props}>{children}</th>
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement> & { className?: string }>(({ className, children, ...props }, ref) => (
  <td ref={ref} className={cn("px-4 py-3 text-text-primary", className)} {...props}>{children}</td>
));
TableCell.displayName = "TableCell";
