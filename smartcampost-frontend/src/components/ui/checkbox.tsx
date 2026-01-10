import * as React from 'react'
import { cn } from '@/lib/utils'

export const Checkbox = ({ checked, onCheckedChange, id, className }: any) => (
  <input
    id={id}
    type="checkbox"
    checked={checked}
    onChange={(e) => onCheckedChange?.(e.target.checked)}
    className={cn('h-4 w-4 rounded border', className)}
  />
)

export default Checkbox
