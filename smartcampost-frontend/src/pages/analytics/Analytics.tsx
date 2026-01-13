import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          ETA and anomaly panels (UI scaffold)
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ETA (per parcel)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Placeholder for GET /api/analytics/parcels/{"{parcelId}"}/eta
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anomaly (per payment)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Placeholder for GET /api/analytics/payments/{"{paymentId}"}/anomaly
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
