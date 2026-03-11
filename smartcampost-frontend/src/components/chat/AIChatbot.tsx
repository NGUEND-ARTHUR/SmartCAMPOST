/**
 * AI Chatbot Component - Enhanced with Role-Based Features
 * Interactive chatbot for customer support with role-specific responses
 * and full platform integration capability
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Loader2,
  Minimize2,
  Package,
  CreditCard,
  MapPin,
  Clock,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Users,
  Truck,
  TrendingUp,
  AlertCircle,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useAIChat } from "@/hooks/ai/useAI";
import { useAuthStore } from "@/store/authStore"; // Use auth store for user role
import axiosInstance from "@/lib/axiosClient";
import { aiService } from "@/services/ai/ai.api";
import { findResponse } from "./knowledgeBase";

/** Minimal markdown → JSX for chatbot messages */
function renderMarkdown(text: string): React.ReactNode {
  // Split by double newline into paragraphs, then process inline formatting
  return text.split("\n").map((line, i) => {
    // Process inline: **bold**, `code`, *italic*
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let key = 0;
    const inlineRe = /(\*\*(.+?)\*\*|`(.+?)`|\*(.+?)\*)/;
    while (remaining) {
      const match = inlineRe.exec(remaining);
      if (!match) {
        parts.push(remaining);
        break;
      }
      if (match.index > 0) {
        parts.push(remaining.slice(0, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={key++}>{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(
          <code
            key={key++}
            className="px-1 py-0.5 bg-black/10 rounded text-[0.85em]"
          >
            {match[3]}
          </code>,
        );
      } else if (match[4]) {
        parts.push(<em key={key++}>{match[4]}</em>);
      }
      remaining = remaining.slice(match.index + match[0].length);
    }
    return (
      <React.Fragment key={i}>
        {parts}
        {i < text.split("\n").length - 1 && <br />}
      </React.Fragment>
    );
  });
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  feedback?: "positive" | "negative" | null;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  query: string;
}

interface AIChatbotProps {
  isOpen?: boolean;
  onClose?: () => void;
  userPhone?: string;
}

export default function AIChatbot({
  isOpen: initialOpen = false,
  onClose,
  userPhone,
}: AIChatbotProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const aiMutation = useAIChat();
  const { user, token } = useAuthStore(); // Get authenticated user and role
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const roleUpper = (user?.role ?? "CLIENT").toUpperCase();
  const language: "en" | "fr" =
    (i18n.resolvedLanguage || i18n.language || "en").toLowerCase() === "fr"
      ? "fr"
      : "en";

  const roleBasePath = useCallback((): string | null => {
    switch (roleUpper) {
      case "CLIENT":
        return "/client";
      case "COURIER":
        return "/courier";
      case "AGENT":
        return "/agent";
      case "STAFF":
        return "/staff";
      case "ADMIN":
        return "/admin";
      case "FINANCE":
        return "/finance";
      case "RISK":
        return "/risk";
      default:
        return null;
    }
  }, [roleUpper]);

  type ActionType =
    | "NAVIGATE"
    | "TRACK"
    | "CONTACT"
    | "CREATE_TICKET"
    | "CREATE_PARCEL"
    | "VIEW_ANALYTICS"
    | "MANAGE_TARIFFS"
    | "VIEW_INVOICES"
    | "MANAGE_USERS"
    | "VIEW_DELIVERIES"
    | "VIEW_RISK"
    | "VIEW_REPORTS"
    | "SYSTEM_STATUS"
    | "OPTIMIZE_ROUTE"
    | "SCAN_QR"
    | "SCHEDULE_PICKUP"
    | "VIEW_ADDRESSES"
    | "MANAGE_AGENCIES"
    | "VIEW_COMPLIANCE"
    | "MANAGE_INCIDENTS"
    | "EXPORT_REPORT"
    | "VIEW_NOTIFICATIONS"
    | "VIEW_PICKUPS"
    | "VIEW_SUPPORT";

  const allowedActionTypes = useCallback((): ActionType[] => {
    if (!user) return ["TRACK", "CONTACT"];
    if (roleUpper === "CLIENT")
      return [
        "NAVIGATE",
        "TRACK",
        "CREATE_TICKET",
        "CREATE_PARCEL",
        "VIEW_INVOICES",
        "SCHEDULE_PICKUP",
        "VIEW_ADDRESSES",
        "CONTACT",
        "VIEW_NOTIFICATIONS",
        "VIEW_SUPPORT",
      ];
    if (roleUpper === "COURIER")
      return [
        "NAVIGATE",
        "TRACK",
        "CONTACT",
        "VIEW_DELIVERIES",
        "OPTIMIZE_ROUTE",
        "SCAN_QR",
        "VIEW_ANALYTICS",
        "VIEW_NOTIFICATIONS",
        "VIEW_PICKUPS",
      ];
    if (roleUpper === "AGENT" || roleUpper === "AGENCY_ADMIN")
      return [
        "NAVIGATE",
        "TRACK",
        "CONTACT",
        "CREATE_TICKET",
        "VIEW_ANALYTICS",
        "VIEW_DELIVERIES",
        "VIEW_REPORTS",
        "MANAGE_USERS",
        "SCAN_QR",
        "VIEW_PICKUPS",
        "VIEW_NOTIFICATIONS",
        "EXPORT_REPORT",
      ];
    if (roleUpper === "STAFF")
      return [
        "NAVIGATE",
        "TRACK",
        "CONTACT",
        "CREATE_TICKET",
        "VIEW_ANALYTICS",
        "VIEW_DELIVERIES",
        "VIEW_REPORTS",
        "VIEW_INVOICES",
        "SCAN_QR",
        "VIEW_PICKUPS",
        "VIEW_NOTIFICATIONS",
        "VIEW_SUPPORT",
        "EXPORT_REPORT",
      ];
    if (roleUpper === "ADMIN")
      return [
        "NAVIGATE",
        "TRACK",
        "CONTACT",
        "CREATE_TICKET",
        "VIEW_ANALYTICS",
        "MANAGE_TARIFFS",
        "VIEW_INVOICES",
        "MANAGE_USERS",
        "VIEW_REPORTS",
        "SYSTEM_STATUS",
        "MANAGE_AGENCIES",
        "VIEW_COMPLIANCE",
        "MANAGE_INCIDENTS",
        "EXPORT_REPORT",
        "VIEW_NOTIFICATIONS",
        "VIEW_SUPPORT",
      ];
    if (roleUpper === "FINANCE")
      return [
        "NAVIGATE",
        "TRACK",
        "CONTACT",
        "VIEW_ANALYTICS",
        "MANAGE_TARIFFS",
        "VIEW_INVOICES",
        "VIEW_REPORTS",
        "EXPORT_REPORT",
        "VIEW_NOTIFICATIONS",
      ];
    if (roleUpper === "RISK")
      return [
        "NAVIGATE",
        "TRACK",
        "CONTACT",
        "VIEW_ANALYTICS",
        "VIEW_RISK",
        "VIEW_REPORTS",
        "SYSTEM_STATUS",
        "VIEW_COMPLIANCE",
        "MANAGE_INCIDENTS",
        "EXPORT_REPORT",
        "VIEW_NOTIFICATIONS",
      ];
    return ["TRACK", "CONTACT"];
  }, [roleUpper, user]);

  const buildAiContext = useCallback(
    (query: string, recentMessages: Message[]): string => {
      const base = roleBasePath();
      const allowed = allowedActionTypes();

      const history = recentMessages
        .slice(-8)
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n");

      // Role-specific system knowledge — expanded for deeper context
      const roleKnowledge: Record<string, string> = {
        CLIENT: [
          "You help clients with: parcel creation, tracking, pricing/quotes, invoice downloads, scheduled pickups, address management, insurance options, and support tickets.",
          "Pricing is dynamic — based on weight (per kg), distance (origin/destination city), service type (STANDARD 3-5 days or EXPRESS 1-2 days), and optional insurance.",
          "Navigation shortcuts: /client/parcels/create to create a parcel, /client/parcels for tracking, /client/payments for invoices, /client/addresses for saved addresses, /client/support for tickets.",
          "Payment methods supported: Orange Money, MTN Mobile Money, bank transfer, and cash at agencies. Invoices are auto-generated as downloadable PDFs.",
          "If asked about delays, suggest checking live tracking and filing a support ticket if overdue by 2+ days.",
          "Return/reroute policy: free cancellation before pickup; rerouting possible in transit for a fee.",
        ].join(" "),
        COURIER: [
          "You help couriers with: delivery assignments, AI route optimization, QR code scanning for status updates, cash/COD collection, navigation, and performance analytics.",
          "Couriers scan QR codes at each step: pickup → transit → delivery. Each scan updates parcel status in real-time for the customer.",
          "Route optimization uses nearest-neighbor algorithm with priority considerations, traffic awareness, and multiple-stop efficiency.",
          "COD (Cash on Delivery): collect payment, confirm in app immediately. Never keep cash overnight — deposit at the nearest agency.",
          "Navigation: /courier/deliveries for current assignments, /courier/analytics for performance data, /courier/route for AI route suggestions.",
          "Tips: review all assignments before starting, use Optimize Route, scan at every stop, report issues through the app immediately.",
        ].join(" "),
        AGENT: [
          "You help agents manage agency operations: parcel intake/dispatch, staff coordination, inventory tracking, courier assignments, and daily reports.",
          "Key workflows: receive parcels (scan, weigh, label), assign to couriers, dispatch, track agency inventory, handle customer walk-ins.",
          "Navigation: /agent/parcels for parcel management, /agent/analytics for performance data, /agent/staff for staff roster.",
          "Agents can view congestion metrics and redistribute parcels to balance workload across couriers. AI provides congestion alerts and redistribution suggestions.",
        ].join(" "),
        AGENCY_ADMIN: [
          "You oversee all agency operations: staff management (hire, assign roles, review performance), courier fleet management, parcel inventory, performance analytics, and alert management.",
          "You can view agency-wide KPIs including throughput, delivery rates, customer satisfaction, and revenue per agency.",
          "Navigation: /agent/analytics for reports, /agent/staff for staff management, /agent/parcels for inventory.",
          "AI recommendations include congestion alerts, courier workload balancing suggestions, and performance optimization tips.",
        ].join(" "),
        STAFF: [
          "You help staff with day-to-day operations: parcel processing (intake, sorting, dispatch), customer support ticket management, delivery coordination, invoice oversight, and performance analytics.",
          "Staff can create support tickets on behalf of customers, update parcel statuses manually, and coordinate with couriers for special deliveries.",
          "Navigation: /staff/parcels for parcel management, /staff/analytics for reports, /staff/invoices for payment tracking, /staff/support for tickets.",
          "Performance metrics include parcels processed per day, customer satisfaction ratings, and ticket resolution times.",
        ].join(" "),
        ADMIN: [
          "You have FULL system access: user account management (all roles), agency creation/management, tariff configuration, system-wide analytics, compliance reports, system health monitoring, and security settings.",
          "You can create/modify tariffs that affect pricing for all customers. Tariff rules include weight ranges, distance zones, service type multipliers, and seasonal adjustments.",
          "User management includes creating accounts, assigning roles (CLIENT, COURIER, AGENT, STAFF, ADMIN, FINANCE, RISK), deactivating accounts, and viewing audit logs.",
          "Navigation: /admin/tariffs for pricing config, /admin/users for accounts, /admin/agencies for agency management, /admin/analytics for system KPIs, /admin/system for health checks.",
          "System health monitoring: API response times, database status, background job status, error rates, and resource utilization.",
        ].join(" "),
        FINANCE: [
          "You handle all financial operations: revenue analysis (daily/weekly/monthly trends), tariff management, invoice oversight, payment reconciliation, refund processing, and financial reporting.",
          "You can view revenue breakdowns by agency, service type, payment method, and time period. Export reports as PDF or CSV.",
          "Tariff management: create/edit pricing rules with conditions (weight ranges, distance zones, service types). Preview impact before applying.",
          "Navigation: /finance/tariffs for pricing config, /finance/reports for financial reports, /finance/analytics for revenue dashboards, /finance/invoices for invoice oversight.",
          "Key metrics: total revenue, pending payments, refund rates, payment method distribution, agency revenue comparisons.",
        ].join(" "),
        RISK: [
          "You monitor security and risk: fraud detection (AI-powered anomaly detection), risk scoring per transaction, compliance auditing, flagged account review, incident management, and security assessments.",
          "Risk scoring monitors: unusual transaction patterns, multiple failed payments, suspicious address changes, high-value shipments from new accounts, geographic anomalies, and velocity checks.",
          "Alerts are categorized by severity: Critical (immediate action), High (review within 1 hour), Medium (review within 24 hours), Low (informational).",
          "Navigation: /risk/dashboard for risk overview, /risk/alerts for active alerts, /risk/compliance for audit reports, /risk/incidents for incident tracking.",
          "You can escalate incidents, flag user accounts for review, generate compliance reports, and recommend security policy changes.",
        ].join(" "),
      };

      const roleInstructions = roleKnowledge[roleUpper] || "";

      return [
        "You are SmartBot, the expert AI assistant for SmartCAMPOST — a digital logistics and parcel management platform for Cameroon Postal Services (CAMPOST).",
        `Always respond in ${language === "fr" ? "French" : "English"}. Be concise but thorough.`,
        `User role: ${roleUpper}.`,
        base ? `User base path: ${base}.` : "User is not authenticated.",
        `Allowed actions: ${allowed.join(", ")}.`,
        "When proposing actions, ONLY propose allowed actions. Format action suggestions clearly.",
        "If you need specific information (tracking code, parcel reference, etc.), ask for it clearly.",
        roleInstructions,
        "",
        "=== GENERAL KNOWLEDGE CAPABILITY ===",
        "You are a versatile AI assistant. While your primary expertise is SmartCAMPOST and logistics, you CAN and SHOULD answer general knowledge questions too.",
        "If the user asks about anything — technology, geography, math, science, culture, business, etc. — answer helpfully.",
        "Always try to relate general answers back to how they might apply to SmartCAMPOST or logistics when relevant, but don't force it.",
        "For system-specific questions, provide detailed step-by-step guidance with navigation paths.",
        "",
        "=== ROLE-SPECIFIC CAPABILITIES ===",
        roleUpper === "CLIENT"
          ? [
              "As a CLIENT, proactively suggest: creating parcels, scheduling pickups, checking invoices, managing addresses, tracking deliveries, filing support tickets.",
              "Offer to navigate them directly: 'Would you like me to take you to the parcel creation page?'",
              "If they ask about pricing, offer to calculate a quote or navigate to the parcel creator.",
              "Suggest scheduling a pickup when they mention sending something.",
            ].join(" ")
          : "",
        roleUpper === "COURIER"
          ? [
              "As a COURIER, proactively suggest: viewing assignments, optimizing routes, scanning QR codes, checking analytics, updating delivery statuses.",
              "Offer to optimize their route: 'Want me to open the route optimizer for today's deliveries?'",
              "Remind them about scanning QR at every stop and depositing cash collections promptly.",
              "If they mention being lost or confused about an address, suggest the map view.",
            ].join(" ")
          : "",
        roleUpper === "AGENT" || roleUpper === "AGENCY_ADMIN"
          ? [
              "As an AGENCY manager, proactively suggest: checking parcel inventory, managing staff, viewing analytics, generating reports, monitoring alerts.",
              "Offer courier workload redistribution when they mention being busy.",
              "Suggest scanning parcels for intake/dispatch workflows.",
              "Provide agency performance tips based on common patterns.",
            ].join(" ")
          : "",
        roleUpper === "STAFF"
          ? [
              "As STAFF, proactively suggest: processing parcels, managing support tickets, coordinating deliveries, checking analytics, handling invoices.",
              "Offer to open the QR scanner for parcel intake workflows.",
              "When they mention customer issues, suggest creating a support ticket.",
              "Provide workflow tips for efficient parcel processing.",
            ].join(" ")
          : "",
        roleUpper === "ADMIN"
          ? [
              "As an ADMIN, you have FULL system access. Proactively suggest: system analytics, user management, agency management, tariff config, compliance reports, system health.",
              "When they mention issues, offer diagnostic paths: system health, error logs, user audit trails.",
              "Suggest compliance reports if they mention audits or regulations.",
              "Offer to navigate directly to any management page.",
            ].join(" ")
          : "",
        roleUpper === "FINANCE"
          ? [
              "As FINANCE, proactively suggest: revenue dashboards, tariff adjustments, invoice reconciliation, financial reports, payment tracking.",
              "Offer export options (PDF/CSV) when they mention reports.",
              "Suggest comparing revenue periods for trend analysis.",
              "When they mention pricing, offer to open tariff management.",
            ].join(" ")
          : "",
        roleUpper === "RISK"
          ? [
              "As RISK, proactively suggest: risk dashboard, fraud alerts, compliance audits, flagged accounts, incident management, security assessments.",
              "When they mention suspicious activity, offer to check the anomaly detection dashboard.",
              "Suggest compliance report generation for regulatory requirements.",
              "Offer to review flagged accounts or active incidents.",
            ].join(" ")
          : "",
        "",
        "=== PLATFORM KNOWLEDGE ===",
        "SmartCAMPOST features: parcel creation & tracking, real-time GPS map tracking (CARTO Voyager tiles), dynamic pricing (weight × distance × service type), AI route optimization for couriers, QR code scanning at every checkpoint, SMS/email notifications, PDF invoice generation, multi-role dashboards, support ticketing system, insurance options, agency management, and 9 autonomous AI agents.",
        "Service types: STANDARD (3-5 business days), EXPRESS (1-2 business days).",
        "Payment methods: Orange Money, MTN Mobile Money, bank transfer, cash at agencies.",
        "User roles: CLIENT, COURIER, AGENT, AGENCY_ADMIN, STAFF, ADMIN, FINANCE, RISK.",
        "Parcel statuses: CREATED → PICKED_UP → IN_TRANSIT → AT_AGENCY → OUT_FOR_DELIVERY → DELIVERED (also: RETURNED, LOST, DAMAGED).",
        "Insurance tiers: Basic (free, up to 50,000 XAF), Standard (2%, up to 500,000 XAF), Premium (3.5%, full declared value).",
        "Agency cities: Douala, Yaoundé, Bafoussam, Garoua, Bamenda, Kribi, Bertoua.",
        "Operating hours: Agencies Mon-Sat 8AM-6PM, Support Mon-Fri 8AM-8PM, Delivery Mon-Sat 7AM-7PM, Closed Sundays & holidays.",
        "Weight limit: max 30kg per parcel, max dimensions 120×80×80cm.",
        "Contact: Phone +237 222 23 15 05, Email support@smartcampost.cm, WhatsApp +237 653 72 00 00.",
        "",
        "=== CONVERSATION GUIDELINES ===",
        "Be helpful, accurate, and friendly. Use emojis sparingly for clarity.",
        "Never make up parcel statuses, tracking numbers, or prices — if you don't know, say so.",
        "If the user seems frustrated, acknowledge their concern and suggest concrete next steps.",
        "For complex issues, suggest filing a support ticket or contacting support directly.",
        "When suggesting navigation, provide the full path (e.g., 'Go to Dashboard > My Parcels').",
        "If the user asks something outside SmartCAMPOST scope (general knowledge, math, culture, tech, etc.), answer it normally — you are a general-purpose assistant too.",
        "Proactively suggest relevant actions after answering a question (e.g., after explaining tracking, offer to navigate to the tracking page).",
        "When the user asks 'what can you do', list ALL capabilities available for their specific role.",
        "",
        user?.name ? `User name: ${user.name}.` : undefined,
        userPhone ? `User phone: ${userPhone}.` : undefined,
        user?.phone ? `User identifier/phone: ${user.phone}.` : undefined,
        "Recent conversation:",
        history || "(none)",
        "User message:",
        query,
      ]
        .filter(Boolean)
        .join("\n");
    },
    [
      allowedActionTypes,
      language,
      roleBasePath,
      roleUpper,
      user?.phone,
      user?.name,
      userPhone,
    ],
  );

  const safeNavigate = useCallback(
    (path: string) => {
      if (!path || typeof path !== "string") return;
      if (!path.startsWith("/")) return;

      // Allow public tracking always
      if (path.startsWith("/tracking")) {
        navigate(path);
        return;
      }

      const base = roleBasePath();
      if (base && path.startsWith(base)) {
        navigate(path);
      }
    },
    [navigate, roleBasePath],
  );

  const executeAiAction = useCallback(
    (action?: { type: string; payload: string }) => {
      if (!action) return;
      const allowed = allowedActionTypes();
      if (!allowed.includes(action.type as ActionType)) {
        toast.error(
          language === "fr"
            ? "Action non autorisée pour votre rôle."
            : "That action is not allowed for your role.",
        );
        return;
      }

      const base = roleBasePath();

      switch (action.type) {
        case "NAVIGATE": {
          safeNavigate(action.payload);
          return;
        }
        case "TRACK": {
          const ref = action.payload?.trim();
          if (!ref) return;
          if (base)
            safeNavigate(`${base}/tracking?ref=${encodeURIComponent(ref)}`);
          else safeNavigate(`/tracking?ref=${encodeURIComponent(ref)}`);
          return;
        }
        case "CREATE_TICKET": {
          safeNavigate("/client/support");
          return;
        }
        case "CONTACT": {
          safeNavigate("/client/support");
          return;
        }
        case "CREATE_PARCEL": {
          safeNavigate("/client/parcels/create");
          return;
        }
        case "VIEW_ANALYTICS": {
          if (base) safeNavigate(`${base}/analytics`);
          return;
        }
        case "MANAGE_TARIFFS": {
          safeNavigate("/admin/tariffs");
          return;
        }
        case "VIEW_INVOICES": {
          safeNavigate("/client/payments");
          return;
        }
        case "MANAGE_USERS": {
          safeNavigate("/admin/users/clients");
          return;
        }
        case "VIEW_DELIVERIES": {
          if (roleUpper === "COURIER") safeNavigate("/courier/deliveries");
          else if (base) safeNavigate(`${base}/parcels`);
          return;
        }
        case "VIEW_RISK": {
          safeNavigate("/risk");
          return;
        }
        case "VIEW_REPORTS": {
          if (base) safeNavigate(`${base}/analytics`);
          return;
        }
        case "SYSTEM_STATUS": {
          safeNavigate("/admin/self-healing");
          return;
        }
        case "OPTIMIZE_ROUTE": {
          if (roleUpper === "COURIER") safeNavigate("/courier/map");
          return;
        }
        case "SCAN_QR": {
          if (base) safeNavigate(`${base}/scan`);
          return;
        }
        case "SCHEDULE_PICKUP": {
          if (roleUpper === "CLIENT") safeNavigate("/client/pickups");
          else if (base) safeNavigate(`${base}/pickups`);
          return;
        }
        case "VIEW_ADDRESSES": {
          safeNavigate("/client/parcels/create");
          return;
        }
        case "MANAGE_AGENCIES": {
          safeNavigate("/admin/users/agencies");
          return;
        }
        case "VIEW_COMPLIANCE": {
          if (roleUpper === "RISK") safeNavigate("/risk/compliance");
          else safeNavigate("/risk/compliance");
          return;
        }
        case "MANAGE_INCIDENTS": {
          if (roleUpper === "RISK") safeNavigate("/risk/alerts");
          else safeNavigate("/risk/alerts");
          return;
        }
        case "EXPORT_REPORT": {
          if (base) safeNavigate(`${base}/analytics`);
          return;
        }
        case "VIEW_NOTIFICATIONS": {
          if (base) safeNavigate(`${base}/notifications`);
          return;
        }
        case "VIEW_PICKUPS": {
          if (base) safeNavigate(`${base}/pickups`);
          return;
        }
        case "VIEW_SUPPORT": {
          safeNavigate("/client/support");
          return;
        }
        default:
          return;
      }
    },
    [allowedActionTypes, language, roleBasePath, roleUpper, safeNavigate],
  );

  // Generate role-specific welcome message and actions
  const getWelcomeContent = () => {
    const name = user?.name || "";
    const role = user?.role?.toUpperCase() || "CLIENT";

    if (!user) {
      return {
        message: t("chatbot.welcome.guest"),
        suggestions: [
          t("chatbot.suggestions.trackParcel"),
          t("chatbot.suggestions.pricing"),
          t("chatbot.suggestions.findAgency"),
        ],
      };
    }

    const roleKeyMap: Record<string, string> = {
      CLIENT: "client",
      COURIER: "courier",
      AGENCY_ADMIN: "agencyAdmin",
      AGENT: "agencyAdmin",
      ADMIN: "admin",
      STAFF: "staff",
      FINANCE: "finance",
      RISK: "risk",
    };

    const welcomeKey = roleKeyMap[role] || "default";
    const message = t(`chatbot.welcome.${welcomeKey}`, { name });

    const roleSuggestions: Record<string, string[]> = {
      CLIENT: [
        "trackParcel",
        "createShipment",
        "checkRates",
        "schedulePickup",
        "manageAddresses",
      ],
      COURIER: [
        "showAssignments",
        "optimizeRoute",
        "updateStatus",
        "scanQR",
        "courierAnalytics",
      ],
      AGENCY_ADMIN: [
        "parcelStats",
        "staffMgmt",
        "generateReports",
        "agencyAlerts",
        "agencyDeliveries",
      ],
      AGENT: ["parcelStats", "staffMgmt", "generateReports", "agencyAlerts"],
      ADMIN: [
        "systemAnalytics",
        "manageUsers",
        "configureTariffs",
        "viewAgencies",
        "systemHealth",
        "complianceReport",
      ],
      STAFF: [
        "viewParcels",
        "checkAnalytics",
        "createTicket",
        "scanParcel",
        "viewDeliveries",
      ],
      FINANCE: [
        "revenueReports",
        "manageTariffs",
        "viewInvoices",
        "exportReport",
        "pendingPayments",
      ],
      RISK: [
        "riskDashboard",
        "viewAlerts",
        "complianceReport",
        "flaggedAccounts",
        "manageIncidents",
      ],
    };

    const sugKeys = roleSuggestions[role] || ["trackParcel", "contactSupport"];
    return {
      message,
      suggestions: sugKeys.map((k) => t(`chatbot.suggestions.${k}`)),
    };
  };

  const welcome = getWelcomeContent();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: welcome.message,
      timestamp: new Date(),
      suggestions: welcome.suggestions,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Abort in-flight stream on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleSend = useCallback(
    async (text?: string) => {
      const query = text || inputValue.trim();
      if (!query) return;

      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: query,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsTyping(true);

      const recentForContext = [...messages, userMessage];
      const aiContext = buildAiContext(query, recentForContext);

      // Try streaming endpoint first (progressive renderer)
      const payload = {
        message: query,
        sessionId,
        language,
        context: aiContext,
      };
      try {
        setIsTyping(true);
        const apiBase = String(
          axiosInstance.defaults.baseURL || "http://localhost:8080/api",
        ).replace(/\/+$/, "");
        const streamUrl = `${apiBase}/ai/chat/stream`;

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) headers.Authorization = `Bearer ${token}`;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch(streamUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Stream failed");

        const reader = res.body?.getReader();
        if (reader) {
          let assistantId = `assistant-${Date.now()}`;
          // create empty assistant message and append progressively
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: "assistant",
              content: "",
              timestamp: new Date(),
              suggestions: [],
              feedback: null,
            },
          ]);

          const decoder = new TextDecoder();
          let done = false;
          while (!done) {
            const { value, done: rdone } = await reader.read();
            done = rdone;
            if (value) {
              const chunk = decoder.decode(value);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + chunk }
                    : m,
                ),
              );
            }
          }
          // Extract sessionId from response header if available
          const streamSessionId = res.headers.get("X-Session-Id");
          if (streamSessionId) setSessionId(streamSessionId);
          setIsTyping(false);
          return;
        }
      } catch (err) {
        // Fall through to mutation-based call
        console.warn("Streaming failed, falling back", err);
      }

      try {
        // small delay for UX
        await new Promise((resolve) => setTimeout(resolve, 250));

        // Use backend AI mutation with user context
        if (!aiMutation) {
          throw new Error("AI service unavailable");
        }

        const aiResp = await aiMutation.mutateAsync({
          message: query,
          sessionId,
          language,
          context: aiContext,
        });

        if (aiResp?.sessionId) setSessionId(aiResp.sessionId);

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            aiResp.message || "Sorry, I couldn't process that right now.",
          timestamp: new Date(),
          suggestions: aiResp.suggestions || [],
          feedback: null,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Execute action only if allowed for current role
        if (aiResp?.action) {
          executeAiAction(aiResp.action as any);
        }
      } catch (err) {
        // Backend unavailable — use local knowledge base as intelligent fallback
        const localResult = findResponse(query);
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: localResult.response,
          timestamp: new Date(),
          suggestions: localResult.suggestions,
          feedback: null,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [
      aiMutation,
      buildAiContext,
      executeAiAction,
      inputValue,
      language,
      messages,
      sessionId,
      token,
    ],
  );

  const handleFeedback = (
    messageId: string,
    feedback: "positive" | "negative",
  ) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, feedback } : msg)),
    );
    // Persist feedback to backend (fire-and-forget)
    const msg = messages.find((m) => m.id === messageId);
    if (msg) {
      aiService
        .submitFeedback({
          sessionId: sessionId ?? "",
          messageContent: msg.content,
          feedback,
        })
        .catch(() => {});
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // Generate role-based quick actions
  const getQuickActions = (): QuickAction[] => {
    const role = user?.role?.toUpperCase() || "";

    const qa = (
      icon: React.ReactNode,
      labelKey: string,
      query: string,
    ): QuickAction => ({
      icon,
      label: t(`chatbot.quickActions.${labelKey}`),
      query,
    });

    if (!user) {
      return [
        qa(
          <Package className="w-4 h-4" />,
          "trackParcel",
          "How do I track my parcel?",
        ),
        qa(
          <CreditCard className="w-4 h-4" />,
          "pricing",
          "What are your prices?",
        ),
        qa(
          <MapPin className="w-4 h-4" />,
          "agencies",
          "Where are your agencies?",
        ),
        qa(
          <Clock className="w-4 h-4" />,
          "deliveryTime",
          "How long does delivery take?",
        ),
      ];
    }

    switch (role) {
      case "CLIENT":
        return [
          qa(
            <Package className="w-4 h-4" />,
            "trackParcel",
            "How do I track my parcel?",
          ),
          qa(
            <Package className="w-4 h-4" />,
            "createShipment",
            "How do I create a new shipment?",
          ),
          qa(
            <CreditCard className="w-4 h-4" />,
            "getQuote",
            "Can you give me a shipping quote?",
          ),
          qa(
            <Clock className="w-4 h-4" />,
            "deliveryTime",
            "How long does delivery take?",
          ),
          qa(
            <MapPin className="w-4 h-4" />,
            "schedulePickup",
            "Schedule a pickup for my parcel",
          ),
          qa(
            <Share2 className="w-4 h-4" />,
            "myAddresses",
            "Manage my saved addresses",
          ),
        ];
      case "COURIER":
        return [
          qa(
            <Truck className="w-4 h-4" />,
            "myAssignments",
            "Show me my delivery assignments",
          ),
          qa(
            <TrendingUp className="w-4 h-4" />,
            "optimizeRoute",
            "Can you optimize my delivery route?",
          ),
          qa(
            <Package className="w-4 h-4" />,
            "updateStatus",
            "How do I update delivery status?",
          ),
          qa(
            <CreditCard className="w-4 h-4" />,
            "paymentTips",
            "Tips for collecting payments safely",
          ),
          qa(<MapPin className="w-4 h-4" />, "scanQR", "Open QR code scanner"),
          qa(
            <BarChart3 className="w-4 h-4" />,
            "courierAnalytics",
            "Show my performance analytics",
          ),
        ];
      case "AGENCY_ADMIN":
        return [
          qa(
            <BarChart3 className="w-4 h-4" />,
            "parcelStats",
            "Show me parcel inventory statistics",
          ),
          qa(
            <Users className="w-4 h-4" />,
            "staffMgmt",
            "How do I manage agency staff?",
          ),
          qa(
            <TrendingUp className="w-4 h-4" />,
            "reports",
            "Generate agency performance report",
          ),
          qa(
            <AlertCircle className="w-4 h-4" />,
            "alerts",
            "Show me active parcel alerts",
          ),
          qa(
            <Package className="w-4 h-4" />,
            "scanQR",
            "Open QR scanner for parcel intake",
          ),
          qa(
            <Truck className="w-4 h-4" />,
            "agencyDeliveries",
            "View agency delivery status",
          ),
        ];
      case "ADMIN":
        return [
          qa(
            <BarChart3 className="w-4 h-4" />,
            "systemAnalytics",
            "Show system-wide analytics and KPIs",
          ),
          qa(
            <Users className="w-4 h-4" />,
            "userMgmt",
            "Show user accounts dashboard",
          ),
          qa(
            <CreditCard className="w-4 h-4" />,
            "tariffs",
            "Open tariff management to configure pricing",
          ),
          qa(
            <TrendingUp className="w-4 h-4" />,
            "reports",
            "Generate compliance report",
          ),
          qa(
            <MapPin className="w-4 h-4" />,
            "manageAgencies",
            "Manage agency locations and staff",
          ),
          qa(
            <AlertCircle className="w-4 h-4" />,
            "systemHealth",
            "Check system health and status",
          ),
        ];
      case "STAFF":
        return [
          qa(
            <Package className="w-4 h-4" />,
            "parcels",
            "Show me all parcels to process",
          ),
          qa(
            <BarChart3 className="w-4 h-4" />,
            "analytics",
            "Show my performance analytics",
          ),
          qa(
            <Truck className="w-4 h-4" />,
            "deliveries",
            "Show current delivery status",
          ),
          qa(
            <AlertCircle className="w-4 h-4" />,
            "support",
            "Show open support tickets",
          ),
          qa(
            <Package className="w-4 h-4" />,
            "scanQR",
            "Open QR scanner for parcel processing",
          ),
          qa(
            <CreditCard className="w-4 h-4" />,
            "staffInvoices",
            "View and manage invoices",
          ),
        ];
      case "FINANCE":
        return [
          qa(
            <TrendingUp className="w-4 h-4" />,
            "revenue",
            "Show revenue analytics and trends",
          ),
          qa(
            <CreditCard className="w-4 h-4" />,
            "tariffs",
            "Open tariff management to adjust pricing",
          ),
          qa(
            <Package className="w-4 h-4" />,
            "invoices",
            "Show recent invoices and payment status",
          ),
          qa(
            <BarChart3 className="w-4 h-4" />,
            "reports",
            "Generate financial report",
          ),
          qa(
            <TrendingUp className="w-4 h-4" />,
            "exportReport",
            "Export financial data as PDF/CSV",
          ),
          qa(
            <AlertCircle className="w-4 h-4" />,
            "pendingPayments",
            "Show pending payment reconciliation",
          ),
        ];
      case "RISK":
        return [
          qa(
            <AlertCircle className="w-4 h-4" />,
            "riskDashboard",
            "Show risk dashboard with current alerts",
          ),
          qa(
            <BarChart3 className="w-4 h-4" />,
            "anomalies",
            "Show detected anomalies and fraud alerts",
          ),
          qa(
            <TrendingUp className="w-4 h-4" />,
            "compliance",
            "Generate compliance audit report",
          ),
          qa(
            <Users className="w-4 h-4" />,
            "flaggedUsers",
            "Show flagged user accounts for review",
          ),
          qa(
            <AlertCircle className="w-4 h-4" />,
            "incidents",
            "View and manage security incidents",
          ),
          qa(
            <BarChart3 className="w-4 h-4" />,
            "riskExport",
            "Export risk assessment report",
          ),
        ];
      default:
        return [];
    }
  };

  const quickActions = getQuickActions();
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 bg-blue-600 hover:bg-blue-700"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer z-50 flex items-center gap-2"
        onClick={() => setIsMinimized(false)}
      >
        <Bot className="w-5 h-5" />
        <span>{t("chatbot.title")}</span>
        <Badge variant="secondary" className="bg-white/20">
          {messages.length}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-95 max-h-150 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <CardHeader className="p-3 bg-blue-600 text-white rounded-t-lg flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-base text-white">
              {t("chatbot.title")}
            </CardTitle>
            <p className="text-xs text-white/80">{t("chatbot.subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 max-h-100">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl"
                    : "bg-muted text-foreground rounded-tl-2xl rounded-tr-2xl rounded-br-2xl"
                } p-3`}
              >
                <div className="flex items-start gap-2">
                  {message.role === "assistant" && (
                    <Bot className="w-4 h-4 mt-1 text-blue-600 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm">
                      {renderMarkdown(message.content)}
                    </div>

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            className="px-2 py-1 text-xs border rounded-full hover:bg-blue-100 transition-colors"
                            onClick={() => handleSend(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Feedback buttons for assistant messages */}
                    {message.role === "assistant" &&
                      message.id !== "welcome" && (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            className={`p-1 rounded ${
                              message.feedback === "positive"
                                ? "bg-green-100 text-green-600"
                                : "text-muted-foreground hover:text-green-600"
                            }`}
                            onClick={() =>
                              handleFeedback(message.id, "positive")
                            }
                            title="Helpful response"
                            aria-label="Mark as helpful"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            className={`p-1 rounded ${
                              message.feedback === "negative"
                                ? "bg-red-100 text-red-600"
                                : "text-muted-foreground hover:text-red-600"
                            }`}
                            onClick={() =>
                              handleFeedback(message.id, "negative")
                            }
                            title="Not helpful response"
                            aria-label="Mark as not helpful"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                  </div>
                  {message.role === "user" && (
                    <User className="w-4 h-4 mt-1 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] opacity-60 mt-1 text-right">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl p-3 flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce animation-delay-150" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce animation-delay-300" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="px-3 py-2 border-t flex gap-2 overflow-x-auto">
        {quickActions.map((action, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            className="shrink-0 text-xs"
            onClick={() => handleSend(action.query)}
          >
            {action.icon}
            <span className="ml-1">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Input */}
      <CardContent className="p-3 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t("chatbot.inputPlaceholder")}
            className="flex-1"
            disabled={isTyping}
          />
          <Button type="submit" disabled={!inputValue.trim() || isTyping}>
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          {t("chatbot.disclaimer")}
        </p>
      </CardContent>
    </Card>
  );
}
