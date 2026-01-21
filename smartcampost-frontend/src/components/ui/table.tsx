/* eslint-disable react/prop-types */
import * as React from "react";
import { cn } from "@/lib/utils";

export const Table = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("w-full overflow-auto", className)}>
    <table className="w-full table-auto">{children}</table>
  </div>
);

export const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-gray-50">{children}</thead>
);
export const TableBody = ({ children }: { children: React.ReactNode }) => (
  <tbody>{children}</tbody>
);
export const TableRow = ({
  children,
  className,
}: React.HTMLAttributes<HTMLTableRowElement> & {
  children: React.ReactNode;
}) => <tr className={cn("border-b", className)}>{children}</tr>;
export const TableHead = ({
  children,
  className,
}: React.ThHTMLAttributes<HTMLTableCellElement> & {
  children: React.ReactNode;
}) => (
  <th className={cn("px-4 py-2 text-left text-sm font-semibold", className)}>
    {children}
  </th>
);
export const TableCell = ({
  children,
  className,
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  children: React.ReactNode;
}) => <td className={cn("px-4 py-2 text-sm", className)}>{children}</td>;

// All components exported individually above; no aggregate export needed.
