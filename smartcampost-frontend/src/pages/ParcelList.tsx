import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { ParcelStatus, Parcel } from '@/types';

const mockParcels: Parcel[] = [
  {
    id: '1',
    trackingRef: 'SCP2026001',
    clientId: '1',
    senderAddressId: '1',
    recipientAddressId: '2',
    weight: 2.5,
    isFragile: false,
    serviceType: 'EXPRESS',
    deliveryOption: 'HOME',
    paymentOption: 'PREPAID',
    status: 'IN_TRANSIT',
    createdAt: '2026-01-08T10:00:00Z',
    updatedAt: '2026-01-08T10:00:00Z',
  },
  {
    id: '2',
    trackingRef: 'SCP2026002',
    clientId: '1',
    senderAddressId: '1',
    recipientAddressId: '3',
    weight: 1.0,
    isFragile: true,
    serviceType: 'STANDARD',
    deliveryOption: 'AGENCY',
    paymentOption: 'COD',
    status: 'DELIVERED',
    createdAt: '2026-01-05T14:30:00Z',
    updatedAt: '2026-01-07T16:45:00Z',
  },
  {
    id: '3',
    trackingRef: 'SCP2026003',
    clientId: '1',
    senderAddressId: '2',
    recipientAddressId: '4',
    weight: 5.0,
    isFragile: false,
    serviceType: 'EXPRESS',
    deliveryOption: 'HOME',
    paymentOption: 'PREPAID',
    status: 'OUT_FOR_DELIVERY',
    createdAt: '2026-01-09T09:15:00Z',
    updatedAt: '2026-01-09T11:20:00Z',
  },
];

export function ParcelList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredParcels = mockParcels.filter(parcel => {
    const matchesSearch = parcel.trackingRef.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || parcel.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Parcels</h1>
          <p className="text-muted-foreground">Track and manage your shipments</p>
        </div>
        <Button onClick={() => navigate('/client/parcels/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Parcel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex-1 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tracking number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="CREATED">Created</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">Out for Delivery</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredParcels.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No parcels found"
              description={searchQuery || statusFilter !== 'ALL' 
                ? "Try adjusting your search or filters"
                : "Create your first parcel to get started"}
              actionLabel={!searchQuery && statusFilter === 'ALL' ? "Create Parcel" : undefined}
              onAction={() => navigate('/client/parcels/create')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking #</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParcels.map((parcel) => (
                  <TableRow key={parcel.id}>
                    <TableCell className="font-medium">{parcel.trackingRef}</TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{parcel.serviceType.toLowerCase()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{parcel.deliveryOption.toLowerCase()}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={parcel.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(parcel.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/client/parcels/${parcel.id}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
