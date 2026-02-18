import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Plus, Edit, Trash2, Home, Briefcase } from "lucide-react";
import type { ComponentType } from "react";
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
import { addressService } from "@/services/addressService";

const labelIcons: Record<string, ComponentType<any>> = {
  Home: Home,
  Office: Briefcase,
  Warehouse: MapPin,
};

export default function Addresses() {
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    street: "",
    city: "",
    region: "",
    country: "Cameroon",
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await addressService.getMyAddresses();
      setAddresses(data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load addresses";
      setError(errorMsg);
      console.error("Address error:", err);
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

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
      toast.error(t("addresses.toasts.requiredFields"));
      return;
    }

    try {
      setIsSaving(true);
      if (editingAddress) {
        const updated = await addressService.updateAddress(editingAddress.id, {
          label: formData.label,
          street: formData.street,
          city: formData.city,
          region: formData.region,
          country: formData.country,
        });
        setAddresses(
          addresses.map((addr) =>
            addr.id === editingAddress.id ? updated : addr,
          ),
        );
        toast.success(t("addresses.toasts.updated"));
      } else {
        const created = await addressService.createAddress({
          label: formData.label,
          street: formData.street,
          city: formData.city,
          region: formData.region,
          country: formData.country,
        });
        setAddresses([...addresses, created]);
        toast.success(t("addresses.toasts.added"));
      }
      setIsDialogOpen(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to save address";
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await addressService.deleteAddress(id);
      setAddresses(addresses.filter((addr) => addr.id !== id));
      toast.success(t("addresses.toasts.deleted"));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete address";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("addresses.page.title")}</h1>
          <p className="text-muted-foreground">
            {t("addresses.page.subtitle")}
          </p>
        </div>
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} disabled={isLoading}>
              <Plus className="w-4 h-4 mr-2" />
              {t("addresses.page.addAddress")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAddress
                  ? t("addresses.dialog.editTitle")
                  : t("addresses.dialog.addTitle")}
              </DialogTitle>
              <DialogDescription>
                {editingAddress
                  ? t("addresses.dialog.editDescription")
                  : t("addresses.dialog.addDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">{t("addresses.form.label")}</Label>
                <Input
                  id="label"
                  placeholder={t("addresses.form.labelPlaceholder")}
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">{t("addresses.form.street")}</Label>
                <Input
                  id="street"
                  placeholder={t("addresses.form.streetPlaceholder")}
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t("addresses.form.city")}</Label>
                  <Input
                    id="city"
                    placeholder={t("addresses.form.cityPlaceholder")}
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">{t("addresses.form.region")}</Label>
                  <Input
                    id="region"
                    placeholder={t("addresses.form.regionPlaceholder")}
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({ ...formData, region: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">{t("addresses.form.country")}</Label>
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? (
                  <>
                    {editingAddress ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  <>
                    {editingAddress
                      ? t("addresses.dialog.updateAction")
                      : t("addresses.dialog.addAction")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={t("addresses.empty.title")}
          description={t("addresses.empty.description")}
          actionLabel={t("addresses.empty.action")}
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
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {address.label}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {address.latitude && address.longitude
                            ? t("addresses.card.locationVerified")
                            : t("addresses.card.locationNotVerified")}
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
                        {t("addresses.card.coordinates")}:{" "}
                        {address.latitude.toFixed(4)},{" "}
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
