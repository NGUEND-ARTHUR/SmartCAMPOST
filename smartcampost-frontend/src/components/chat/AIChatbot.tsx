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

// --------------- Enhanced Knowledge Base ---------------
// Each entry uses an array of keywords for scoring-based matching.
interface KBEntry {
  keywords: string[];
  response: string;
  suggestions: string[];
}

const knowledgeEntries: KBEntry[] = [
  // ===== Tracking =====
  {
    keywords: ["track", "tracking", "where", "status", "locate", "find parcel", "my parcel"],
    response: `📦 **Tracking Your Parcel**

To track your parcel you can:
1. Go to **My Parcels** in your dashboard and click any parcel to see its live status
2. Use the **live map** to follow your parcel in real-time
3. Enter your tracking code on the **home page** for instant lookup

Each parcel goes through these statuses:
\`CREATED\` → \`PICKED_UP\` → \`IN_TRANSIT\` → \`AT_AGENCY\` → \`OUT_FOR_DELIVERY\` → \`DELIVERED\`

You will also receive SMS notifications at every major status change.`,
    suggestions: ["What if my parcel is delayed?", "Can I change the delivery address?", "Show me the tracking map"],
  },

  // ===== Pricing / Cost =====
  {
    keywords: ["price", "pricing", "cost", "rate", "tariff", "how much", "quote", "estimate", "fee", "charge"],
    response: `💰 **Pricing Information**

Our dynamic pricing is calculated from:
- **Weight** — charged per kilogram
- **Distance** — based on origin and destination cities
- **Service type** — Standard (3-5 days) or Express (1-2 days)
- **Insurance** — optional add-on based on declared value

To get an instant quote:
1. Start creating a new parcel in your dashboard
2. Enter the origin, destination, weight, and service type
3. The system shows the calculated price before you confirm

Volume discounts are available for businesses shipping 50+ parcels/month. Contact your account manager or our support team for custom pricing.`,
    suggestions: ["Do you offer bulk discounts?", "Is insurance included?", "What about fragile items?"],
  },

  // ===== Delivery Time =====
  {
    keywords: ["delivery", "deliver", "time", "long", "when", "arrive", "duration", "speed", "fast", "express", "standard"],
    response: `🚚 **Delivery Times**

Delivery times depend on the service you choose:
- **Standard**: 3-5 business days
- **Express**: 1-2 business days

Factors that can affect delivery:
- Distance between origin and destination
- Weather conditions and road accessibility
- Peak season (December, holidays)

You can track your parcel on our **real-time map** to see exactly where it is. Our AI predicts arrival times with high accuracy based on current conditions.`,
    suggestions: ["Can I schedule a delivery time?", "Do you deliver on weekends?", "What if I'm not home?"],
  },

  // ===== Payment =====
  {
    keywords: ["payment", "pay", "mobile money", "orange money", "mtn", "bank", "cash", "receipt", "invoice", "transaction"],
    response: `💳 **Payment Methods**

We accept multiple payment options:
- **Mobile Money**: Orange Money, MTN Mobile Money — instant confirmation
- **Bank Transfer**: All major Cameroonian banks
- **Cash**: Pay at any of our agency locations

Payment flow:
1. Create your parcel and review the quote
2. Choose your payment method
3. Complete payment — you'll receive an SMS receipt
4. A PDF invoice is generated automatically

Invoices are available in your **Payments** section. You can download or email them at any time.`,
    suggestions: ["Can I pay on delivery?", "How do I get a receipt?", "Where are my invoices?"],
  },

  // ===== Pickup / Collection =====
  {
    keywords: ["pickup", "pick up", "collect", "schedule", "come get", "courier pickup"],
    response: `📍 **Pickup Scheduling**

To schedule a pickup:
1. Create your parcel with the **origin address**
2. Choose a **pickup date and time slot**
3. Our courier will arrive to collect your package

What to prepare:
- Make sure the parcel is properly packaged and labeled
- Have your booking reference ready
- Someone must be present at the pickup address

You'll receive SMS notifications when the courier is on their way and when pickup is confirmed.`,
    suggestions: ["What if I miss the pickup?", "Can someone else hand over the parcel?", "How should I package my parcel?"],
  },

  // ===== Lost / Damaged =====
  {
    keywords: ["lost", "damage", "damaged", "missing", "broken", "complaint", "claim", "compensation"],
    response: `⚠️ **Lost or Damaged Parcels**

If your parcel is lost or damaged:
1. Go to **Support** in your dashboard
2. File a complaint with your **tracking number**
3. Attach any photos of damage if applicable
4. Our team will investigate within **24-48 hours**

Compensation policy:
- Parcels with insurance: up to **100% of declared value**
- Parcels without insurance: up to **50,000 XAF** standard coverage
- Claims must be filed within **7 days** of expected delivery

You'll receive status updates via SMS and email throughout the investigation.`,
    suggestions: ["How long does investigation take?", "How much compensation can I get?", "How do I add insurance?"],
  },

  // ===== Refund =====
  {
    keywords: ["refund", "money back", "return money", "cancel payment", "reimburse"],
    response: `💸 **Refund Policy**

For refund requests:
1. Contact support with your **payment receipt** or tracking number
2. Refunds are processed within **5-7 business days**
3. Amount is credited back to the **original payment method**

Eligibility:
- ✅ Unshipped parcels — full refund
- ✅ Service failures (lost, significantly delayed) — full or partial refund
- ❌ Successfully delivered parcels — not eligible
- ❌ Parcels already in transit — not eligible (rerouting possible instead)`,
    suggestions: ["How long for refund to arrive?", "Can I cancel a parcel in transit?", "Track my refund status"],
  },

  // ===== Agency Locations =====
  {
    keywords: ["agency", "agencies", "location", "branch", "office", "find agency", "nearest", "close to me"],
    response: `🏢 **Agency Locations**

Our agencies across Cameroon:
- **Douala**: Akwa, Bonaberi, Bonamoussadi
- **Yaoundé**: Mvog-Mbi, Bastos, Mvan
- **Bafoussam**: City Center
- **Garoua**: Main Avenue
- **Bamenda**: Commercial Avenue
- **Kribi**: Town Center
- **Bertoua**: Central Market Area

Services at agencies:
- Drop off and pick up parcels
- Cash payments
- Customer support
- Package weighing and labeling

Use our **interactive map** in the app to find the nearest agency with real-time availability.`,
    suggestions: ["What are the opening hours?", "Can I drop off parcels at any agency?", "Show me the map"],
  },

  // ===== Operating Hours =====
  {
    keywords: ["hours", "open", "close", "schedule", "working hours", "opening", "when open"],
    response: `🕐 **Operating Hours**

- **Agencies**: Monday–Saturday, 8:00 AM – 6:00 PM
- **Customer Support**: Monday–Friday, 8:00 AM – 8:00 PM
- **Pickup/Delivery**: Monday–Saturday, 7:00 AM – 7:00 PM
- **Online Services**: Available 24/7

We're closed on **Sundays and public holidays**.

During peak seasons (December, Easter), some agencies extend hours. Check the app for real-time agency status.`,
    suggestions: ["Are you open on holidays?", "Weekend delivery available?", "Find an agency near me"],
  },

  // ===== Contact / Support =====
  {
    keywords: ["contact", "support", "call", "phone", "email", "whatsapp", "reach", "talk to", "customer service", "ticket"],
    response: `📞 **Contact & Support**

Reach us through:
- **Phone**: +237 222 23 15 05
- **Email**: support@smartcampost.cm
- **WhatsApp**: +237 653 72 00 00
- **In-app**: File a support ticket from your dashboard

Response times:
- **Phone/WhatsApp**: Immediate during business hours
- **Email**: Within 2-4 hours
- **Support Tickets**: Within 24 hours (priority for urgent issues)

For urgent matters (lost parcels, payment issues), call or WhatsApp for fastest response.`,
    suggestions: ["File a support ticket", "Report a problem", "Check ticket status"],
  },

  // ===== Account Management =====
  {
    keywords: ["account", "profile", "password", "settings", "update", "edit profile", "notification", "preferences", "delete account"],
    response: `🔒 **Account Management**

Manage your account:
- **Profile**: Update name, phone, email in Settings > Profile
- **Password**: Change in Settings > Security
- **Notifications**: Customize SMS, email, and push preferences
- **Addresses**: Save frequently used addresses for faster booking
- **Language**: Switch between English and French

For account deletion, contact support — we'll process it within 48 hours and export your data if requested.`,
    suggestions: ["How to change my password?", "Update my phone number", "Manage my addresses"],
  },

  // ===== Insurance =====
  {
    keywords: ["insurance", "insure", "coverage", "protect", "declare value", "declared value"],
    response: `🛡️ **Parcel Insurance**

Protect your shipment with our insurance options:
- **Basic coverage** (included free): Up to 50,000 XAF
- **Standard insurance**: Coverage up to 500,000 XAF (2% of declared value)
- **Premium insurance**: Full declared value coverage (3.5% of declared value)

How to add insurance:
1. When creating a parcel, enter the **declared value**
2. Select your insurance tier
3. Insurance fee is added to the shipping cost

Claims are processed within 5-10 business days after investigation.`,
    suggestions: ["How to file an insurance claim?", "What items can't be insured?", "Insurance for fragile items"],
  },

  // ===== Packaging =====
  {
    keywords: ["package", "packaging", "pack", "wrap", "box", "fragile", "bubble wrap", "label"],
    response: `📦 **Packaging Guidelines**

For safe delivery, follow these packaging tips:
- Use a **sturdy box** appropriate for the item size
- Wrap fragile items with **bubble wrap** or newspaper
- Fill empty spaces with **packing material**
- Seal with **strong tape** on all seams
- Label clearly with **sender and recipient information**

For fragile items:
- Mark the box with "FRAGILE" on all sides
- Use double boxing for extra protection
- Declare the item as fragile when creating the parcel

Our agencies can provide packaging materials and help you pack at a small fee.`,
    suggestions: ["Where to buy packaging materials?", "Can the agency pack my parcel?", "Weight limits for parcels"],
  },

  // ===== Prohibited Items =====
  {
    keywords: ["prohibited", "forbidden", "restricted", "cannot ship", "not allowed", "illegal", "dangerous", "banned"],
    response: `🚫 **Prohibited Items**

The following items **cannot** be shipped:
- **Explosives**: Fireworks, ammunition, flammable materials
- **Drugs**: Illegal substances, controlled medications without prescription
- **Weapons**: Firearms, knives, pepper spray
- **Perishables**: Raw food, live animals (unless special arrangement)
- **Hazardous chemicals**: Acids, batteries (lithium), toxic substances
- **Valuables**: Cash, precious metals, jewelry above 1,000,000 XAF

Restricted items (require declaration):
- Electronics over 500,000 XAF
- Documents and legal papers
- Medications (with valid prescription)

Shipping prohibited items may result in parcel seizure and account suspension.`,
    suggestions: ["Can I ship electronics?", "What about medicine?", "Declare high-value items"],
  },

  // ===== Weight / Size Limits =====
  {
    keywords: ["weight", "size", "limit", "maximum", "heavy", "large", "dimension", "kg", "kilogram"],
    response: `⚖️ **Weight & Size Limits**

Standard shipment limits:
- **Maximum weight**: 30 kg per parcel
- **Maximum dimensions**: 120 × 80 × 80 cm (L × W × H)
- **Minimum weight**: 0.1 kg

For oversized or heavy items:
- Parcels over 30 kg require **special arrangement** — contact support
- Oversized items may incur additional handling fees
- Bulk shipments can be arranged for businesses

Each parcel is weighed at the **agency or during pickup** to verify the declared weight. A small variance (±0.5 kg) is tolerated.`,
    suggestions: ["How much does it cost per kg?", "Ship heavy items?", "Bulk shipment options"],
  },

  // ===== QR Code / Scanning =====
  {
    keywords: ["qr", "qr code", "scan", "scanner", "barcode", "label"],
    response: `📱 **QR Code & Scanning**

Every parcel gets a unique **QR code** containing:
- Tracking reference number
- Origin and destination
- Service type and weight

How QR scanning works:
1. **At pickup**: Courier scans to confirm collection
2. **At agency**: Staff scans for check-in/check-out
3. **During transit**: Sorting centers scan for routing
4. **At delivery**: Courier scans to confirm delivery

You can also scan QR codes from the app to quickly look up parcel details. Agents and couriers use the built-in scanner in their dashboard.`,
    suggestions: ["How to use the scanner?", "My QR code doesn't work", "Print a new label"],
  },

  // ===== Map / Real-time Tracking =====
  {
    keywords: ["map", "real-time", "realtime", "gps", "live tracking", "follow", "journey"],
    response: `🗺️ **Real-Time Map Tracking**

Our interactive map shows:
- **Live parcel location** updated in real-time
- **Agency locations** with status indicators
- **Delivery routes** for couriers
- **Estimated arrival times** powered by AI

How to use the map:
1. Open any parcel from your dashboard
2. Click **"Track on Map"** to see the live view
3. Zoom in/out and follow the delivery route

The map uses high-quality **CARTO Voyager** tiles for clear visualization. Couriers can see optimized routes with traffic considerations.`,
    suggestions: ["Show my parcel on map", "Find nearest agency on map", "How accurate is GPS tracking?"],
  },

  // ===== SMS Notifications =====
  {
    keywords: ["sms", "notification", "notify", "alert", "message", "text message", "updates"],
    response: `📲 **SMS Notifications**

You receive automatic SMS updates for:
- ✅ Parcel creation confirmation
- ✅ Pickup scheduled / completed
- ✅ Parcel arrived at sorting center
- ✅ Parcel out for delivery
- ✅ Delivery completed
- ✅ Payment confirmation
- ✅ Delay or issue alerts

Customize notifications in **Settings > Notifications**. You can enable/disable specific notification types and choose between SMS, email, or both.

SMS is sent to the phone number on your account. Make sure it's up to date!`,
    suggestions: ["Update my phone number", "Turn off notifications", "I didn't receive my SMS"],
  },

  // ===== Invoices / Receipts =====
  {
    keywords: ["invoice", "receipt", "bill", "pdf", "download", "print"],
    response: `🧾 **Invoices & Receipts**

Every transaction generates:
- **PDF Invoice**: Automatically created with full details
- **SMS Receipt**: Sent immediately after payment
- **Email Receipt**: If email is on your account

To access your invoices:
1. Go to **Payments** in your dashboard
2. Find the transaction
3. Click **Download Invoice** for the PDF

Invoices include: tracking number, service details, weight, origin/destination, payment method, amount, and tax breakdown. You can also email invoices directly from the app.`,
    suggestions: ["Download my latest invoice", "Email an invoice", "View payment history"],
  },

  // ===== Courier Operations =====
  {
    keywords: ["courier", "driver", "assignment", "delivery route", "route optimization", "cash collection", "cod"],
    response: `🚚 **Courier Operations**

As a courier, you can:
- **View assignments**: See all parcels assigned to you for the day
- **Optimize routes**: Use AI-powered route optimization for efficient delivery
- **Update status**: Scan QR codes to update parcel status in real-time
- **Collect cash**: Handle COD (Cash on Delivery) with digital confirmation
- **Navigate**: Get turn-by-turn directions to each delivery point

Tips for efficient delivery:
1. Review all assignments before starting your route
2. Use the **Optimize Route** feature — it considers traffic and priorities
3. Scan QR codes at every stop for accurate tracking
4. Confirm cash collection through the app immediately`,
    suggestions: ["Show my assignments", "Optimize my route", "Report a delivery issue"],
  },

  // ===== Bulk / Corporate Shipping =====
  {
    keywords: ["bulk", "corporate", "business", "company", "enterprise", "volume", "contract", "wholesale"],
    response: `🏢 **Bulk & Corporate Shipping**

For businesses shipping regularly:
- **Volume discounts**: Available for 50+ parcels/month
- **Dedicated account manager**: Personalized support
- **Custom tariffs**: Negotiated pricing based on volume
- **API integration**: Connect your system directly to SmartCAMPOST
- **Monthly invoicing**: Consolidated billing

To set up a corporate account:
1. Contact our sales team at business@smartcampost.cm
2. Discuss your shipping volume and requirements
3. Receive a custom pricing proposal
4. Sign the service agreement and start shipping

Current corporate partners enjoy up to **30% discount** on standard rates.`,
    suggestions: ["Request a corporate account", "API integration docs", "Volume pricing info"],
  },

  // ===== Returns / Rerouting =====
  {
    keywords: ["return", "reroute", "redirect", "change address", "cancel shipment", "send back"],
    response: `🔄 **Returns & Rerouting**

To return or reroute a parcel:
- **Before pickup**: Cancel freely from your dashboard at no cost
- **After pickup, before transit**: Rerouting available for a small fee
- **In transit**: Contact support — rerouting may be possible depending on location
- **After delivery**: Arrange a return shipment (standard shipping charges apply)

To request a reroute:
1. Go to your parcel details
2. Click **"Request Change"**
3. Enter the new destination
4. Pay any additional charges

Note: Rerouting availability depends on the parcel's current location and the new destination.`,
    suggestions: ["Cancel my shipment", "Change delivery address", "Return a parcel"],
  },

  // ===== Registration / Sign Up =====
  {
    keywords: ["register", "sign up", "signup", "create account", "new account", "join"],
    response: `📝 **Create an Account**

To register on SmartCAMPOST:
1. Go to the **Sign Up** page
2. Enter your **phone number** (required)
3. Verify via **OTP** sent by SMS
4. Complete your profile (name, email, city)
5. Start shipping!

Account types:
- **Client**: Ship and receive parcels
- **Business**: Corporate account with volume pricing

Your phone number is your unique identifier. You can add an email for additional notifications and invoice delivery.`,
    suggestions: ["I can't receive the OTP", "Forgot my password", "Link email to my account"],
  },

  // ===== Language Support =====
  {
    keywords: ["language", "french", "english", "translate", "langue", "francais", "anglais"],
    response: `🌍 **Language Support**

SmartCAMPOST supports:
- **English** 🇬🇧
- **French** 🇫🇷

You can switch languages anytime:
1. Click the **language toggle** in the navigation bar
2. Or go to **Settings > Preferences > Language**

All notifications (SMS, email) will be sent in your preferred language. The AI assistant also responds in your chosen language.`,
    suggestions: ["Switch to French", "Switch to English", "Update my preferences"],
  },

  // ===== Finance / Revenue =====
  {
    keywords: ["revenue", "finance", "financial", "income", "earnings", "profit", "reconciliation", "audit"],
    response: `📊 **Financial Management**

As a Finance user, you can:
- **Revenue Dashboard**: View total revenue, trends, and breakdowns
- **Tariff Management**: Configure and adjust pricing rules
- **Invoice Oversight**: Monitor all transactions and payments
- **Payment Reconciliation**: Match payments with shipments
- **Financial Reports**: Generate and export detailed reports

Key metrics tracked:
- Daily/weekly/monthly revenue
- Payment method distribution
- Pending vs. completed payments
- Refund rates and amounts

Export reports in PDF or CSV for accounting purposes.`,
    suggestions: ["Show revenue trends", "Export financial report", "View pending payments"],
  },

  // ===== Risk / Security =====
  {
    keywords: ["risk", "fraud", "security", "anomaly", "suspicious", "compliance", "alert", "threat"],
    response: `🛡️ **Risk & Security**

As a Risk analyst, you can:
- **Risk Dashboard**: Monitor active alerts and risk scores
- **Fraud Detection**: AI-powered anomaly detection on transactions
- **Compliance Audits**: Generate compliance reports
- **Flagged Accounts**: Review suspicious user activity
- **Incident Management**: Track and resolve security incidents

Risk scoring monitors:
- Unusual transaction patterns
- Multiple failed payment attempts
- Suspicious address changes
- High-value shipments from new accounts
- Geographic anomalies

All alerts are prioritized by severity: Critical, High, Medium, Low.`,
    suggestions: ["View active alerts", "Generate compliance report", "Review flagged accounts"],
  },

  // ===== Staff Operations =====
  {
    keywords: ["staff", "employee", "operations", "process", "workflow", "team", "manage staff"],
    response: `👥 **Staff Operations**

Staff members handle day-to-day operations:
- **Parcel Processing**: Receive, sort, and dispatch parcels
- **Customer Support**: Handle inquiries and complaints
- **Delivery Coordination**: Assign couriers and monitor deliveries
- **Inventory Management**: Track parcel inventory at the agency
- **Analytics**: View performance metrics and reports

Key workflows:
1. **Parcel intake**: Scan, weigh, label, and register incoming parcels
2. **Dispatch**: Assign parcels to couriers based on destination
3. **Support**: Handle customer inquiries via the ticketing system
4. **Reporting**: Generate daily/weekly performance reports`,
    suggestions: ["View all parcels", "Assign deliveries", "Generate report"],
  },

  // ===== Admin / System =====
  {
    keywords: ["admin", "administrator", "system", "configure", "manage users", "manage agencies"],
    response: `⚙️ **System Administration**

As an administrator, you have full access to:
- **User Management**: Create, edit, deactivate user accounts across all roles
- **Agency Management**: Add/edit agencies, assign staff and managers
- **Tariff Configuration**: Set pricing rules, discounts, and service types
- **System Analytics**: Monitor platform-wide KPIs and performance
- **Compliance**: Generate audit trails and compliance reports
- **System Health**: Monitor API status, database health, and background jobs

Access key areas:
- Users → /admin/users
- Agencies → /admin/agencies
- Tariffs → /admin/tariffs
- Analytics → /admin/analytics`,
    suggestions: ["Manage users", "Configure tariffs", "System health check"],
  },

  // ===== Greeting =====
  {
    keywords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "bonjour", "salut", "bonsoir"],
    response: `Hello! 👋 Welcome to SmartCAMPOST support!

I'm your AI assistant and I can help you with:
- 📦 Tracking your parcels
- 💰 Pricing and quotes
- 🚚 Delivery times and options
- 💳 Payment methods
- 🏢 Agency locations
- 🛡️ Insurance and claims
- ❓ Any other questions

What can I help you with today?`,
    suggestions: ["Track my parcel", "Shipping rates", "Find an agency"],
  },

  // ===== Help =====
  {
    keywords: ["help", "assist", "what can you do", "features", "capabilities"],
    response: `I can assist you with everything on SmartCAMPOST:

📦 **Tracking** — "Where is my parcel?"
💰 **Pricing** — "How much does shipping cost?"
🚚 **Delivery** — "How long will it take?"
💳 **Payment** — "What payment methods do you accept?"
📍 **Locations** — "Where are your agencies?"
🛡️ **Insurance** — "How do I protect my shipment?"
📱 **QR Codes** — "How does scanning work?"
🗺️ **Maps** — "Track on the live map"
🔒 **Account** — "How do I update my profile?"
📊 **Analytics** — "Show me reports" (staff/admin)
🚚 **Courier** — "Optimize my delivery route" (couriers)

Just type your question and I'll do my best to help!`,
    suggestions: ["Track my parcel", "Pricing info", "Contact support"],
  },

  // ===== Addresses =====
  {
    keywords: ["address", "addresses", "saved address", "add address", "my addresses", "destination"],
    response: `📍 **Address Management**

You can save frequently used addresses:
1. Go to **Settings > My Addresses**
2. Click **Add Address**
3. Enter the full address details (street, city, region)
4. Mark as Home, Work, or Custom label

Saved addresses auto-fill when creating parcels, saving you time. You can have up to **10 saved addresses**.

Addresses are also used for:
- Pickup scheduling
- Delivery preferences
- Agency recommendations near your location`,
    suggestions: ["Add a new address", "Edit my addresses", "Set default address"],
  },

  // ===== Delay / Late =====
  {
    keywords: ["delay", "late", "delayed", "slow", "overdue", "not arrived", "still waiting"],
    response: `⏰ **Parcel Delays**

If your parcel is delayed:
1. Check the **live tracking** for the latest status
2. Delays can occur due to:
   - High volume during peak seasons
   - Weather conditions or road closures
   - Customs/security checks
   - Incorrect or incomplete addresses
3. If delayed more than **2 days past estimate**, file a support ticket

Our AI system automatically flags delayed parcels and alerts our operations team. You'll receive an SMS if there's a significant delay with an updated estimated delivery time.`,
    suggestions: ["Track my parcel now", "File a complaint", "Contact support"],
  },

  // ===== Weekend / Holiday =====
  {
    keywords: ["weekend", "saturday", "sunday", "holiday", "public holiday"],
    response: `📅 **Weekend & Holiday Service**

- **Saturday**: Normal operations (8 AM – 6 PM for agencies, 7 AM – 7 PM for deliveries)
- **Sunday**: Closed (no pickup or delivery)
- **Public Holidays**: Closed (parcels in transit continue to next business day)

Express shipments created on Friday may be delivered Saturday. Standard shipments resume Monday.

During holiday periods (Christmas, New Year), plan your shipments in advance to avoid delays.`,
    suggestions: ["Check delivery times", "Express shipping options", "Find open agencies"],
  },
];

// Default quick action suggestions (used for unauthenticated users)
const defaultQuickActions: QuickAction[] = [
  {
    icon: <Package className="w-4 h-4" />,
    label: "Track Parcel",
    query: "How do I track my parcel?",
  },
  {
    icon: <CreditCard className="w-4 h-4" />,
    label: "Pricing",
    query: "What are your prices?",
  },
  {
    icon: <Clock className="w-4 h-4" />,
    label: "Delivery Time",
    query: "How long does delivery take?",
  },
  {
    icon: <MapPin className="w-4 h-4" />,
    label: "Agencies",
    query: "Where are your agencies?",
  },
];

// ----------- Scoring-Based Response Finder -----------
// Instead of matching on the first keyword, score every knowledge entry
// against the user's query and return the best match.
function findResponse(query: string): {
  response: string;
  suggestions: string[];
} {
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/);

  let bestScore = 0;
  let bestEntry: KBEntry | null = null;

  for (const entry of knowledgeEntries) {
    let score = 0;
    for (const kw of entry.keywords) {
      // Exact substring match in the query
      if (lowerQuery.includes(kw)) {
        // Longer keywords get a higher score boost
        score += 1 + kw.length * 0.1;
      }
      // Also check if any individual word matches the keyword
      for (const w of words) {
        if (kw.includes(w) && w.length >= 3) {
          score += 0.4;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestScore >= 0.8) {
    return {
      response: bestEntry.response,
      suggestions: bestEntry.suggestions,
    };
  }

  // Default response
  return {
    response: `I'm not sure I fully understand your question. Here are some things I can help with:

📦 **Tracking** — "Where is my parcel?"
💰 **Pricing** — "How much does shipping cost?"
🚚 **Delivery** — "How long will it take?"
💳 **Payment** — "What payment methods do you accept?"
📍 **Agencies** — "Where are your agencies?"
🛡️ **Insurance** — "Protect my shipment"
🔒 **Account** — "Update my profile"

Try rephrasing your question or use one of the quick actions below! 🤖`,
    suggestions: ["Track my parcel", "Pricing info", "Contact support", "Help"],
  };
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
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const allowedActionTypes = useCallback((): Array<
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
  > => {
    if (!user) return ["TRACK", "CONTACT"];
    if (roleUpper === "CLIENT")
      return ["NAVIGATE", "TRACK", "CREATE_TICKET", "CREATE_PARCEL", "VIEW_INVOICES"];
    if (roleUpper === "COURIER")
      return ["NAVIGATE", "TRACK", "CONTACT", "VIEW_DELIVERIES"];
    if (roleUpper === "AGENT" || roleUpper === "AGENCY_ADMIN")
      return [
        "NAVIGATE", "TRACK", "CONTACT", "CREATE_TICKET",
        "VIEW_ANALYTICS", "VIEW_DELIVERIES", "VIEW_REPORTS",
      ];
    if (roleUpper === "STAFF")
      return [
        "NAVIGATE", "TRACK", "CONTACT", "CREATE_TICKET",
        "VIEW_ANALYTICS", "VIEW_DELIVERIES", "VIEW_REPORTS", "VIEW_INVOICES",
      ];
    if (roleUpper === "ADMIN")
      return [
        "NAVIGATE", "TRACK", "CONTACT", "CREATE_TICKET",
        "VIEW_ANALYTICS", "MANAGE_TARIFFS", "VIEW_INVOICES",
        "MANAGE_USERS", "VIEW_REPORTS", "SYSTEM_STATUS",
      ];
    if (roleUpper === "FINANCE")
      return [
        "NAVIGATE", "TRACK", "CONTACT",
        "VIEW_ANALYTICS", "MANAGE_TARIFFS", "VIEW_INVOICES", "VIEW_REPORTS",
      ];
    if (roleUpper === "RISK")
      return [
        "NAVIGATE", "TRACK", "CONTACT",
        "VIEW_ANALYTICS", "VIEW_RISK", "VIEW_REPORTS", "SYSTEM_STATUS",
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
        "",
        user?.name ? `User name: ${user.name}.` : undefined,
        userPhone ? `User phone: ${userPhone}.` : undefined,
        user?.email ? `User identifier/email: ${user.email}.` : undefined,
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
      user?.email,
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
      if (!allowed.includes(action.type as any)) {
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
          if (base) safeNavigate(`${base}/tracking?ref=${encodeURIComponent(ref)}`);
          else safeNavigate(`/tracking?ref=${encodeURIComponent(ref)}`);
          return;
        }
        case "CREATE_TICKET": {
          if (base) safeNavigate(`${base}/support`);
          return;
        }
        case "CONTACT": {
          if (base) safeNavigate(`${base}/support`);
          else safeNavigate("/tracking");
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
          if (roleUpper === "ADMIN") safeNavigate("/admin/tariffs");
          else if (roleUpper === "FINANCE") safeNavigate("/finance/tariffs");
          return;
        }
        case "VIEW_INVOICES": {
          if (base) safeNavigate(`${base}/invoices`);
          else safeNavigate("/client/invoices");
          return;
        }
        case "MANAGE_USERS": {
          safeNavigate("/admin/users");
          return;
        }
        case "VIEW_DELIVERIES": {
          if (roleUpper === "COURIER") safeNavigate("/courier/deliveries");
          else if (base) safeNavigate(`${base}/parcels`);
          return;
        }
        case "VIEW_RISK": {
          safeNavigate("/risk/dashboard");
          return;
        }
        case "VIEW_REPORTS": {
          if (base) safeNavigate(`${base}/reports`);
          return;
        }
        case "SYSTEM_STATUS": {
          if (base) safeNavigate(`${base}/system`);
          return;
        }
        default:
          return;
      }
    },
    [
      allowedActionTypes,
      language,
      roleBasePath,
      roleUpper,
      safeNavigate,
    ],
  );

  // Generate role-specific welcome message and actions
  const getWelcomeContent = () => {
    if (!user) {
      return {
        message: `Hello! 👋 I'm SmartBot, your AI assistant.

I can help you with:
- 📦 Tracking parcels
- 💰 Pricing & payments
- 🚚 Delivery information
- 📍 Agency locations

How can I assist you today?`,
        suggestions: [
          "Track my parcel",
          "What are your prices?",
          "Find an agency",
        ],
      };
    }

    const role = user.role?.toUpperCase() || "CLIENT";

    if (role === "CLIENT") {
      return {
        message: `Hello ${user.name || "there"}! 👋 Welcome to SmartCAMPOST.

I can help you with:
- 📦 Track your parcels in real-time
- 💰 Get instant shipping quotes
- 🚚 Schedule pickups and deliveries
- 📍 Find our agency locations

What do you need help with today?`,
        suggestions: [
          "Track my parcel",
          "Create new shipment",
          "Check delivery rates",
        ],
      };
    } else if (role === "COURIER") {
      return {
        message: `Welcome back, ${user.name || "Courier"}! 🚚

I'm here to help you with:
- 📍 Optimize your delivery route
- 📦 View your assigned parcels
- 💰 Cash collection support
- 📊 Performance analytics

What do you need?`,
        suggestions: [
          "Show my assignments",
          "Optimize my route",
          "Update delivery status",
        ],
      };
    } else if (role === "AGENCY_ADMIN") {
      return {
        message: `Welcome, Agency Manager 🏢

I can assist you with:
- 📦 Parcel inventory management
- 👥 Staff and courier management
- 📊 Performance analytics & reports
- ⚠️ Alert management

What do you need today?`,
        suggestions: [
          "Parcel statistics",
          "Staff management",
          "Generate reports",
        ],
      };
    } else if (role === "ADMIN") {
      return {
        message: `Welcome, System Administrator ⚙️

I can help you with:
- 🌐 System-wide analytics & monitoring
- 👥 User account management
- 🏢 Agency management
- 💰 Tariff & pricing configuration
- 📋 Compliance & risk reports
- 🔧 System status & health checks

What do you need?`,
        suggestions: ["System analytics", "Manage users", "Configure tariffs", "View all agencies"],
      };
    } else if (role === "STAFF") {
      return {
        message: `Welcome, ${user.name || "Staff"}! 🏢

I can help you with:
- 📦 Parcel processing & management
- 🚚 Delivery coordination
- 📊 Performance analytics
- 💳 Invoice & payment oversight
- 🎫 Support ticket management

What do you need today?`,
        suggestions: ["View parcels", "Check analytics", "Create support ticket"],
      };
    } else if (role === "FINANCE") {
      return {
        message: `Welcome, Finance Manager 💰

I can help you with:
- 📊 Revenue analytics & trends
- 💰 Tariff & pricing management
- 🧾 Invoice oversight & reconciliation
- 📋 Financial reports & exports
- 💳 Payment tracking

What can I help you with?`,
        suggestions: ["Revenue reports", "Manage tariffs", "View invoices"],
      };
    } else if (role === "RISK") {
      return {
        message: `Welcome, Risk Analyst 🛡️

I can help you with:
- ⚠️ Fraud detection & alerts
- 📊 Risk scoring & analytics
- 🔍 Anomaly monitoring
- 📋 Compliance audits
- 🔒 Security assessments

What do you need?`,
        suggestions: ["Risk dashboard", "View alerts", "Compliance report"],
      };
    }

    return {
      message: `Hello! 👋 I'm SmartBot, your AI assistant.

I can help you with:
- 📦 Tracking parcels
- 💰 Pricing & payments
- 🚚 Delivery information

What can I help you with?`,
      suggestions: ["Track my parcel", "Contact support"],
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

        const res = await fetch(streamUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
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
      user?.role,
      userPhone,
    ],
  );

  const handleFeedback = (
    messageId: string,
    feedback: "positive" | "negative",
  ) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, feedback } : msg)),
    );
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // Generate role-based quick actions
  const getQuickActions = (): QuickAction[] => {
    if (!user) {
      return [
        {
          icon: <Package className="w-4 h-4" />,
          label: "Track Parcel",
          query: "How do I track my parcel?",
        },
        {
          icon: <CreditCard className="w-4 h-4" />,
          label: "Pricing",
          query: "What are your prices?",
        },
        {
          icon: <MapPin className="w-4 h-4" />,
          label: "Agencies",
          query: "Where are your agencies?",
        },
      ];
    }

    const role = user.role?.toUpperCase() || "CLIENT";

    if (role === "CLIENT") {
      return [
        {
          icon: <Package className="w-4 h-4" />,
          label: "Track Parcel",
          query: "How do I track my parcel?",
        },
        {
          icon: <Package className="w-4 h-4" />,
          label: "Create Shipment",
          query: "How do I create a new shipment?",
        },
        {
          icon: <CreditCard className="w-4 h-4" />,
          label: "Get Quote",
          query: "Can you give me a shipping quote?",
        },
        {
          icon: <Clock className="w-4 h-4" />,
          label: "Delivery Time",
          query: "How long does delivery take?",
        },
      ];
    } else if (role === "COURIER") {
      return [
        {
          icon: <Truck className="w-4 h-4" />,
          label: "My Assignments",
          query: "Show me my delivery assignments",
        },
        {
          icon: <TrendingUp className="w-4 h-4" />,
          label: "Optimize Route",
          query: "Can you optimize my delivery route?",
        },
        {
          icon: <Package className="w-4 h-4" />,
          label: "Update Status",
          query: "How do I update delivery status?",
        },
        {
          icon: <CreditCard className="w-4 h-4" />,
          label: "Payment Tips",
          query: "Tips for collecting payments safely",
        },
      ];
    } else if (role === "AGENCY_ADMIN") {
      return [
        {
          icon: <BarChart3 className="w-4 h-4" />,
          label: "Parcel Stats",
          query: "Show me parcel inventory statistics",
        },
        {
          icon: <Users className="w-4 h-4" />,
          label: "Staff Mgmt",
          query: "How do I manage agency staff?",
        },
        {
          icon: <TrendingUp className="w-4 h-4" />,
          label: "Reports",
          query: "Generate agency performance report",
        },
        {
          icon: <AlertCircle className="w-4 h-4" />,
          label: "Alerts",
          query: "Show me active parcel alerts",
        },
      ];
    } else if (role === "ADMIN") {
      return [
        {
          icon: <BarChart3 className="w-4 h-4" />,
          label: "System Analytics",
          query: "Show system-wide analytics and KPIs",
        },
        {
          icon: <Users className="w-4 h-4" />,
          label: "User Management",
          query: "Show user accounts dashboard",
        },
        {
          icon: <CreditCard className="w-4 h-4" />,
          label: "Tariffs",
          query: "Open tariff management to configure pricing",
        },
        {
          icon: <TrendingUp className="w-4 h-4" />,
          label: "Reports",
          query: "Generate compliance report",
        },
      ];
    } else if (role === "STAFF") {
      return [
        {
          icon: <Package className="w-4 h-4" />,
          label: "Parcels",
          query: "Show me all parcels to process",
        },
        {
          icon: <BarChart3 className="w-4 h-4" />,
          label: "Analytics",
          query: "Show my performance analytics",
        },
        {
          icon: <Truck className="w-4 h-4" />,
          label: "Deliveries",
          query: "Show current delivery status",
        },
        {
          icon: <AlertCircle className="w-4 h-4" />,
          label: "Support",
          query: "Show open support tickets",
        },
      ];
    } else if (role === "FINANCE") {
      return [
        {
          icon: <TrendingUp className="w-4 h-4" />,
          label: "Revenue",
          query: "Show revenue analytics and trends",
        },
        {
          icon: <CreditCard className="w-4 h-4" />,
          label: "Tariffs",
          query: "Open tariff management to adjust pricing",
        },
        {
          icon: <Package className="w-4 h-4" />,
          label: "Invoices",
          query: "Show recent invoices and payment status",
        },
        {
          icon: <BarChart3 className="w-4 h-4" />,
          label: "Reports",
          query: "Generate financial report",
        },
      ];
    } else if (role === "RISK") {
      return [
        {
          icon: <AlertCircle className="w-4 h-4" />,
          label: "Risk Dashboard",
          query: "Show risk dashboard with current alerts",
        },
        {
          icon: <BarChart3 className="w-4 h-4" />,
          label: "Anomalies",
          query: "Show detected anomalies and fraud alerts",
        },
        {
          icon: <TrendingUp className="w-4 h-4" />,
          label: "Compliance",
          query: "Generate compliance audit report",
        },
        {
          icon: <Users className="w-4 h-4" />,
          label: "Flagged Users",
          query: "Show flagged user accounts for review",
        },
      ];
    }

    return [];
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
        <span>SmartBot</span>
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
            <CardTitle className="text-base text-white">SmartBot</CardTitle>
            <p className="text-xs text-white/80">AI Assistant • Online</p>
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
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
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
            placeholder="Type your message..."
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
          Powered by SmartCAMPOST AI • Responses may not always be accurate
        </p>
      </CardContent>
    </Card>
  );
}
