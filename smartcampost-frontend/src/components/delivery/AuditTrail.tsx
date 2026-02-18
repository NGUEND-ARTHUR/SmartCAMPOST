import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  MapPin,
  User,
  Clock,
  Building2,
  Camera,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  auditService,
  type ParcelAuditResponse,
} from "../../services/common/audit.api";
import type { AuditRecord } from "../../types";

interface AuditTrailProps {
  parcelId: string;
  showFull?: boolean;
}

export function AuditTrail({ parcelId, showFull = false }: AuditTrailProps) {
  const { t } = useTranslation();
  const [auditData, setAuditData] = useState<ParcelAuditResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(showFull);

  useEffect(() => {
    const fetchAudit = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await auditService.getParcelAuditTrail(parcelId);
        setAuditData(data);
      } catch (err) {
        setError("Failed to load audit trail");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [parcelId]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "DELIVERED":
      case "PICKED_UP_AT_AGENCY":
        return "bg-green-100 text-green-800";
      case "OUT_FOR_DELIVERY":
        return "bg-blue-100 text-blue-800";
      case "RETURNED":
      case "RETURNED_TO_SENDER":
        return "bg-red-100 text-red-800";
      case "IN_TRANSIT":
      case "ARRIVED_HUB":
      case "ARRIVED_DEST_AGENCY":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!auditData) return null;

  const displayedRecords = expanded
    ? auditData.auditTrail
    : auditData.auditTrail.slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("audit.title", "Audit Trail")}</span>
          <Badge variant="outline">{auditData.totalEvents} events</Badge>
        </CardTitle>
        <CardDescription>
          {t(
            "audit.description",
            "Complete traceability: who, when, where, what",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {displayedRecords.map((record: AuditRecord, index: number) => (
              <div key={record.recordId} className="relative pl-10">
                {/* Timeline dot */}
                <div
                  className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-background ${
                    index === 0 ? "bg-primary" : "bg-muted-foreground"
                  }`}
                />

                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getEventColor(record.eventType)}>
                      {record.eventType}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(record.timestamp)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {/* Who */}
                    {(record.actorName || record.actorRole) && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>
                          {record.actorName || record.actorRole}
                          {record.actorRole && ` (${record.actorRole})`}
                        </span>
                      </div>
                    )}

                    {/* Where - Agency */}
                    {record.agencyName && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span>{record.agencyName}</span>
                      </div>
                    )}

                    {/* Where - GPS */}
                    {record.latitude && record.longitude && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {record.latitude.toFixed(4)},{" "}
                          {record.longitude.toFixed(4)}
                        </span>
                      </div>
                    )}

                    {/* Location Note */}
                    {record.locationNote && (
                      <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                        <MapPin className="h-3 w-3" />
                        <span>{record.locationNote}</span>
                      </div>
                    )}
                  </div>

                  {/* Proof & Comment */}
                  {(record.proofUrl || record.comment) && (
                    <div className="pt-2 border-t space-y-1">
                      {record.proofUrl && (
                        <a
                          href={record.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Camera className="h-3 w-3" />
                          View Proof
                        </a>
                      )}
                      {record.comment && (
                        <p className="flex items-start gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3 mt-0.5" />
                          {record.comment}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {auditData.auditTrail.length > 3 && (
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                {t("common.showLess", "Show Less")}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                {t("common.showMore", "Show All")} (
                {auditData.auditTrail.length - 3} more)
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default AuditTrail;
