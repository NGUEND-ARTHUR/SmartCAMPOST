import * as React from 'react'

export const StatusBadge = ({ status }: { status: string }) => {
  const mapping: Record<string, { label: string; className: string }> = {
    CREATED: { label: 'Created', className: 'bg-gray-100 text-gray-800' },
    IN_TRANSIT: { label: 'In Transit', className: 'bg-blue-100 text-blue-800' },
    OUT_FOR_DELIVERY: { label: 'Out for delivery', className: 'bg-yellow-100 text-yellow-800' },
    DELIVERED: { label: 'Delivered', className: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  }

  const meta = mapping[status] || { label: status, className: 'bg-gray-100 text-gray-800' }

  return <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${meta.className}`}>{meta.label}</span>
}

export default StatusBadge
