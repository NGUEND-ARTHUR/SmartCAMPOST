import { useState } from "react";
import {
  Building2,
  Plus,
  Edit,
  Loader2,
  Search,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { useAgencies, useCreateAgency, useUpdateAgency } from "@/hooks";
import { toast } from "sonner";

export default function AgencyManagement() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    region: "",
    country: "Cameroon",
    phone: "",
    email: "",
  });

  const { data, isLoading, error } = useAgencies(page, 20);
  const createAgency = useCreateAgency();
  const updateAgency = useUpdateAgency();

  const agencies = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const filteredAgencies = agencies.filter((a) => {
    const search = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(search) ||
      (a.city?.toLowerCase().includes(search) ?? false)
    );
  });

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      address: "",
      city: "",
      region: "",
      country: "Cameroon",
      phone: "",
      email: "",
    });
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast.error("Agency name is required");
      return;
    }
    // Map to backend field names
    const payload = {
      agencyName: formData.name,
      agencyCode: formData.code || undefined,
      city: formData.city || undefined,
      region: formData.region || undefined,
    };
    createAgency.mutate(payload, {
      onSuccess: () => {
        toast.success("Agency created successfully");
        setIsCreateOpen(false);
        resetForm();
      },
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to create agency",
        ),
    });
  };

  const handleEdit = (agency: (typeof agencies)[0]) => {
    setSelectedAgency(agency.id);
    setFormData({
      name: agency.name,
      code: agency.code || "",
      address: agency.address || "",
      city: agency.city || "",
      region: agency.region || "",
      country: agency.country || "Cameroon",
      phone: agency.phone || "",
      email: agency.email || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedAgency || !formData.name) {
      toast.error("Agency name is required");
      return;
    }
    // Map to backend field names
    const payload = {
      agencyName: formData.name,
      agencyCode: formData.code || undefined,
      city: formData.city || undefined,
      region: formData.region || undefined,
    };
    updateAgency.mutate(
      { id: selectedAgency, data: payload },
      {
        onSuccess: () => {
          toast.success("Agency updated successfully");
          setIsEditOpen(false);
          resetForm();
          setSelectedAgency(null);
        },
        onError: (err) =>
          toast.error(
            err instanceof Error ? err.message : "Failed to update agency",
          ),
      },
    );
  };

  // Form fields JSX - used inline to avoid re-render issues
  const formFields = (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Agency Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Main Branch"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code (auto-generated if empty)</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            placeholder="AG001"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="123 Main Street"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Douala"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Input
            id="region"
            value={formData.region}
            onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
            placeholder="Littoral"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            placeholder="Cameroon"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+237 6XX XXX XXX"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="agency@campost.cm"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agency Management</h1>
          <p className="text-muted-foreground">
            Manage CAMPOST agencies and branches
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Agency
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Agency</DialogTitle>
              <DialogDescription>
                Add a new CAMPOST agency or branch
              </DialogDescription>
            </DialogHeader>
            {formFields}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createAgency.isPending}>
                {createAgency.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Agencies</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <EmptyState
              icon={Building2}
              title="Error loading agencies"
              description={
                error instanceof Error ? error.message : "An error occurred"
              }
            />
          ) : filteredAgencies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No agencies found"
              description={
                searchQuery
                  ? "Try adjusting your search"
                  : "Add your first agency to get started"
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agency</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgencies.map((agency) => (
                    <TableRow key={agency.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{agency.name}</div>
                          {agency.code && (
                            <div className="text-xs text-muted-foreground">
                              {agency.code}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3" />
                          {agency.city || "N/A"}
                          {agency.region ? `, ${agency.region}` : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {agency.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {agency.phone}
                            </div>
                          )}
                          {agency.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {agency.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            agency.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {agency.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(agency)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Agency</DialogTitle>
            <DialogDescription>Update agency information</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); setSelectedAgency(null); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateAgency.isPending}>
              {updateAgency.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
