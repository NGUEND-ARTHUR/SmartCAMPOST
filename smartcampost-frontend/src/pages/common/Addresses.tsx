import { useState } from "react";
import { MapPin, Plus, Edit, Trash2, Home, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { Address } from "@/types";
import { toast } from "sonner";

const mockAddresses: Address[] = [
  {
    id: "1",
    label: "Home",
    street: "123 Main Street, Akwa",
    city: "Douala",
    region: "Littoral",
    country: "Cameroon",
    latitude: 4.0511,
    longitude: 9.7679,
  },
  {
    id: "2",
    label: "Office",
    street: "456 Avenue de l'Indépendance, Bastos",
    city: "Yaoundé",
    region: "Centre",
    country: "Cameroon",
    latitude: 3.8667,
    longitude: 11.5167,
  },
  {
    id: "3",
    label: "Warehouse",
    street: "789 Industrial Zone, Bonaberi",
    city: "Douala",
    region: "Littoral",
    country: "Cameroon",
  },
];

const labelIcons: Record<string, any> = {
  Home: Home,
  Office: Briefcase,
  Warehouse: MapPin,
};

export default function Addresses() {
  const [addresses, setAddresses] = useState<Address[]>(mockAddresses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    street: "",
    city: "",
    region: "",
    country: "Cameroon",
  });

  const handleOpenDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        label: address.label || "",
        street: address.street || "",
        city: address.city || "",
        region: address.region || "",
        country: address.country || "Cameroon",
      });
    } else {
      setEditingAddress(null);
      setFormData({
        label: "",
        street: "",
        city: "",
        region: "",
        country: "Cameroon",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (
      !formData.label ||
      !formData.street ||
      !formData.city ||
      !formData.region
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingAddress) {
      setAddresses(
        addresses.map((addr) =>
          addr.id === editingAddress.id ? { ...addr, ...formData } : addr,
        ),
      );
      toast.success("Address updated successfully");
    } else {
      const newAddress: Address = {
        id: String(addresses.length + 1),
        ...formData,
      } as Address;
      setAddresses([...addresses, newAddress]);
      toast.success("Address added successfully");
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAddresses(addresses.filter((addr) => addr.id !== id));
    toast.success("Address deleted successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Saved Addresses</h1>
          <p className="text-muted-foreground">
            Manage your delivery and pickup addresses
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "Edit Address" : "Add New Address"}
              </DialogTitle>
              <DialogDescription>
                {editingAddress
                  ? "Update the address details below"
                  : "Enter the address details below"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  placeholder="e.g., Home, Office, Warehouse"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  placeholder="Street address, building, apartment"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region *</Label>
                  <Input
                    id="region"
                    placeholder="Region"
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({ ...formData, region: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  disabled
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingAddress ? "Update" : "Add"} Address
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add addresses to make creating parcels faster"
          actionLabel="Add Address"
          onAction={() => handleOpenDialog()}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => {
            const Icon = (address.label && labelIcons[address.label]) || MapPin;
            return (
              <Card key={address.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {address.label}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {address.latitude && address.longitude
                            ? "Location verified"
                            : "Location not verified"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(address)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{address.street}</p>
                    <p>
                      {address.city}, {address.region}
                    </p>
                    <p>{address.country}</p>
                    {address.latitude && address.longitude && (
                      <p className="text-xs pt-2 border-t mt-2">
                        Coordinates: {address.latitude.toFixed(4)},{" "}
                        {address.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
