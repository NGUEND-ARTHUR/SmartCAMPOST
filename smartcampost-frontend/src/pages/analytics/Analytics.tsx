import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Clock, AlertTriangle, Search, Loader2, Package, CreditCard, TrendingUp, MapPin } from "lucide-react";
import { toast } from "sonner";

interface ETAResult {
  parcelId: string;
  estimatedDelivery: string;
  currentLocation: string;
  status: string;
  confidence: number;
}

interface AnomalyResult {
  paymentId: string;
  riskScore: number;
  anomalyType: string;
  details: string;
  recommendation: string;
}

export default function Analytics() {
  const [parcelId, setParcelId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [etaLoading, setEtaLoading] = useState(false);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [etaResult, setEtaResult] = useState<ETAResult | null>(null);
  const [anomalyResult, setAnomalyResult] = useState<AnomalyResult | null>(null);

  const handleEtaSearch = async () => {
    if (!parcelId.trim()) {
      toast.error("Please enter a parcel ID");
      return;
    }
    setEtaLoading(true);
    setEtaResult(null);
    
    // Simulate API call - replace with actual API when available
    setTimeout(() => {
      setEtaResult({
        parcelId: parcelId,
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        currentLocation: "Douala Hub",
        status: "IN_TRANSIT",
        confidence: 85,
      });
      setEtaLoading(false);
      toast.success("ETA retrieved successfully");
    }, 1000);
  };

  const handleAnomalyCheck = async () => {
    if (!paymentId.trim()) {
      toast.error("Please enter a payment ID");
      return;
    }
    setAnomalyLoading(true);
    setAnomalyResult(null);
    
    // Simulate API call - replace with actual API when available
    setTimeout(() => {
      const riskScore = Math.random() * 100;
      setAnomalyResult({
        paymentId: paymentId,
        riskScore: Math.round(riskScore),
        anomalyType: riskScore > 70 ? "HIGH_VALUE" : riskScore > 40 ? "UNUSUAL_PATTERN" : "NORMAL",
        details: riskScore > 70 
          ? "This payment exceeds typical transaction amounts for this user"
          : riskScore > 40 
          ? "Minor deviation from normal payment patterns detected"
          : "No anomalies detected in this payment",
        recommendation: riskScore > 70 
          ? "Manual review recommended before processing"
          : riskScore > 40 
          ? "Continue with standard verification"
          : "Payment appears normal, proceed as usual",
      });
      setAnomalyLoading(false);
      toast.success("Anomaly check completed");
    }, 1000);
  };

  const getRiskBadge = (score: number) => {
    if (score > 70) return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
    if (score > 40) return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
    return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          AI-powered ETA predictions and payment anomaly detection
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ETA Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <CardTitle>ETA Prediction</CardTitle>
            </div>
            <CardDescription>
              Get estimated delivery time for a parcel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="parcelId" className="sr-only">Parcel ID</Label>
                <Input
                  id="parcelId"
                  placeholder="Enter Parcel ID (e.g., PKG-12345)"
                  value={parcelId}
                  onChange={(e) => setParcelId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEtaSearch()}
                />
              </div>
              <Button onClick={handleEtaSearch} disabled={etaLoading}>
                {etaLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {etaResult && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{etaResult.parcelId}</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">{etaResult.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Estimated Delivery</p>
                    <p className="font-medium">{etaResult.estimatedDelivery}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-2 bg-blue-600 rounded-full w-[${etaResult.confidence}%]`}
                        />
                      </div>
                      <span className="font-medium">{etaResult.confidence}%</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Current Location:</span>
                  <span className="font-medium">{etaResult.currentLocation}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anomaly Detection Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle>Anomaly Detection</CardTitle>
            </div>
            <CardDescription>
              Check payment for suspicious activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="paymentId" className="sr-only">Payment ID</Label>
                <Input
                  id="paymentId"
                  placeholder="Enter Payment ID (e.g., PAY-67890)"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnomalyCheck()}
                />
              </div>
              <Button onClick={handleAnomalyCheck} disabled={anomalyLoading}>
                {anomalyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {anomalyResult && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{anomalyResult.paymentId}</span>
                  </div>
                  {getRiskBadge(anomalyResult.riskScore)}
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-muted-foreground text-sm">Risk Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-2 rounded-full w-[${anomalyResult.riskScore}%] ${
                            anomalyResult.riskScore > 70 ? 'bg-red-500' :
                            anomalyResult.riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        />
                      </div>
                      <span className="font-medium">{anomalyResult.riskScore}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Analysis</p>
                    <p className="text-sm">{anomalyResult.details}</p>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-background">
                    <TrendingUp className="h-4 w-4 mt-0.5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Recommendation</p>
                      <p className="text-sm text-muted-foreground">{anomalyResult.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. ETA Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-green-600">+2.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              False Positive Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-green-600">-0.8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Predictions Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">ETA requests</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
