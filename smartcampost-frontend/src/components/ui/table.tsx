import * as React from 'react'
import { cn } from '@/lib/utils'

export const Table = ({ children, className }: any) => (
  <div className={cn('w-full overflow-auto', className)}>
    <table className="w-full table-auto">{children}</table>
  </div>
)

export const TableHeader = ({ children }: any) => (<thead className="bg-gray-50">{children}</thead>)
export const TableBody = ({ children }: any) => (<tbody>{children}</tbody>)
export const TableRow = ({ children, className }: any) => (<tr className={cn('border-b', className)}>{children}</tr>)
export const TableHead = ({ children, className }: any) => (<th className={cn('px-4 py-2 text-left text-sm font-semibold', className)}>{children}</th>)
export const TableCell = ({ children, className }: any) => (<td className={cn('px-4 py-2 text-sm', className)}>{children}</td>)

// All components exported individually above; no aggregate export needed.
