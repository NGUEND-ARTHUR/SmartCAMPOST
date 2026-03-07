/**
 * AI Chatbot Knowledge Base
 * Extracted from AIChatbot.tsx for maintainability.
 * Each entry uses an array of keywords for scoring-based matching.
 */

export interface KBEntry {
  keywords: string[];
  response: string;
  suggestions: string[];
}

export const knowledgeEntries: KBEntry[] = [
  // ===== Tracking =====
  {
    keywords: [
      "track",
      "tracking",
      "where",
      "status",
      "locate",
      "find parcel",
      "my parcel",
    ],
    response: `📦 **Tracking Your Parcel**

To track your parcel you can:
1. Go to **My Parcels** in your dashboard and click any parcel to see its live status
2. Use the **live map** to follow your parcel in real-time
3. Enter your tracking code on the **home page** for instant lookup

Each parcel goes through these statuses:
\`CREATED\` → \`PICKED_UP\` → \`IN_TRANSIT\` → \`AT_AGENCY\` → \`OUT_FOR_DELIVERY\` → \`DELIVERED\`

You will also receive SMS notifications at every major status change.`,
    suggestions: [
      "What if my parcel is delayed?",
      "Can I change the delivery address?",
      "Show me the tracking map",
    ],
  },

  // ===== Pricing / Cost =====
  {
    keywords: [
      "price",
      "pricing",
      "cost",
      "rate",
      "tariff",
      "how much",
      "quote",
      "estimate",
      "fee",
      "charge",
    ],
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
    suggestions: [
      "Do you offer bulk discounts?",
      "Is insurance included?",
      "What about fragile items?",
    ],
  },

  // ===== Delivery Time =====
  {
    keywords: [
      "delivery",
      "deliver",
      "time",
      "long",
      "when",
      "arrive",
      "duration",
      "speed",
      "fast",
      "express",
      "standard",
    ],
    response: `🚚 **Delivery Times**

Delivery times depend on the service you choose:
- **Standard**: 3-5 business days
- **Express**: 1-2 business days

Factors that can affect delivery:
- Distance between origin and destination
- Weather conditions and road accessibility
- Peak season (December, holidays)

You can track your parcel on our **real-time map** to see exactly where it is. Our AI predicts arrival times with high accuracy based on current conditions.`,
    suggestions: [
      "Can I schedule a delivery time?",
      "Do you deliver on weekends?",
      "What if I'm not home?",
    ],
  },

  // ===== Payment =====
  {
    keywords: [
      "payment",
      "pay",
      "mobile money",
      "orange money",
      "mtn",
      "bank",
      "cash",
      "receipt",
      "invoice",
      "transaction",
    ],
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
    suggestions: [
      "Can I pay on delivery?",
      "How do I get a receipt?",
      "Where are my invoices?",
    ],
  },

  // ===== Pickup / Collection =====
  {
    keywords: [
      "pickup",
      "pick up",
      "collect",
      "schedule",
      "come get",
      "courier pickup",
    ],
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
    suggestions: [
      "What if I miss the pickup?",
      "Can someone else hand over the parcel?",
      "How should I package my parcel?",
    ],
  },

  // ===== Lost / Damaged =====
  {
    keywords: [
      "lost",
      "damage",
      "damaged",
      "missing",
      "broken",
      "complaint",
      "claim",
      "compensation",
    ],
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
    suggestions: [
      "How long does investigation take?",
      "How much compensation can I get?",
      "How do I add insurance?",
    ],
  },

  // ===== Refund =====
  {
    keywords: [
      "refund",
      "money back",
      "return money",
      "cancel payment",
      "reimburse",
    ],
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
    suggestions: [
      "How long for refund to arrive?",
      "Can I cancel a parcel in transit?",
      "Track my refund status",
    ],
  },

  // ===== Agency Locations =====
  {
    keywords: [
      "agency",
      "agencies",
      "location",
      "branch",
      "office",
      "find agency",
      "nearest",
      "close to me",
    ],
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
    suggestions: [
      "What are the opening hours?",
      "Can I drop off parcels at any agency?",
      "Show me the map",
    ],
  },

  // ===== Operating Hours =====
  {
    keywords: [
      "hours",
      "open",
      "close",
      "schedule",
      "working hours",
      "opening",
      "when open",
    ],
    response: `🕐 **Operating Hours**

- **Agencies**: Monday–Saturday, 8:00 AM – 6:00 PM
- **Customer Support**: Monday–Friday, 8:00 AM – 8:00 PM
- **Pickup/Delivery**: Monday–Saturday, 7:00 AM – 7:00 PM
- **Online Services**: Available 24/7

We're closed on **Sundays and public holidays**.

During peak seasons (December, Easter), some agencies extend hours. Check the app for real-time agency status.`,
    suggestions: [
      "Are you open on holidays?",
      "Weekend delivery available?",
      "Find an agency near me",
    ],
  },

  // ===== Contact / Support =====
  {
    keywords: [
      "contact",
      "support",
      "call",
      "phone",
      "email",
      "whatsapp",
      "reach",
      "talk to",
      "customer service",
      "ticket",
    ],
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
    suggestions: [
      "File a support ticket",
      "Report a problem",
      "Check ticket status",
    ],
  },

  // ===== Account Management =====
  {
    keywords: [
      "account",
      "profile",
      "password",
      "settings",
      "update",
      "edit profile",
      "notification",
      "preferences",
      "delete account",
    ],
    response: `🔒 **Account Management**

Manage your account:
- **Profile**: Update name, phone, email in Settings > Profile
- **Password**: Change in Settings > Security
- **Notifications**: Customize SMS, email, and push preferences
- **Addresses**: Save frequently used addresses for faster booking
- **Language**: Switch between English and French

For account deletion, contact support — we'll process it within 48 hours and export your data if requested.`,
    suggestions: [
      "How to change my password?",
      "Update my phone number",
      "Manage my addresses",
    ],
  },

  // ===== Insurance =====
  {
    keywords: [
      "insurance",
      "insure",
      "coverage",
      "protect",
      "declare value",
      "declared value",
    ],
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
    suggestions: [
      "How to file an insurance claim?",
      "What items can't be insured?",
      "Insurance for fragile items",
    ],
  },

  // ===== Packaging =====
  {
    keywords: [
      "package",
      "packaging",
      "pack",
      "wrap",
      "box",
      "fragile",
      "bubble wrap",
      "label",
    ],
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
    suggestions: [
      "Where to buy packaging materials?",
      "Can the agency pack my parcel?",
      "Weight limits for parcels",
    ],
  },

  // ===== Prohibited Items =====
  {
    keywords: [
      "prohibited",
      "forbidden",
      "restricted",
      "cannot ship",
      "not allowed",
      "illegal",
      "dangerous",
      "banned",
    ],
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
    suggestions: [
      "Can I ship electronics?",
      "What about medicine?",
      "Declare high-value items",
    ],
  },

  // ===== Weight / Size Limits =====
  {
    keywords: [
      "weight",
      "size",
      "limit",
      "maximum",
      "heavy",
      "large",
      "dimension",
      "kg",
      "kilogram",
    ],
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
    suggestions: [
      "How much does it cost per kg?",
      "Ship heavy items?",
      "Bulk shipment options",
    ],
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
    suggestions: [
      "How to use the scanner?",
      "My QR code doesn't work",
      "Print a new label",
    ],
  },

  // ===== Map / Real-time Tracking =====
  {
    keywords: [
      "map",
      "real-time",
      "realtime",
      "gps",
      "live tracking",
      "follow",
      "journey",
    ],
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
    suggestions: [
      "Show my parcel on map",
      "Find nearest agency on map",
      "How accurate is GPS tracking?",
    ],
  },

  // ===== SMS Notifications =====
  {
    keywords: [
      "sms",
      "notification",
      "notify",
      "alert",
      "message",
      "text message",
      "updates",
    ],
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
    suggestions: [
      "Update my phone number",
      "Turn off notifications",
      "I didn't receive my SMS",
    ],
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
    suggestions: [
      "Download my latest invoice",
      "Email an invoice",
      "View payment history",
    ],
  },

  // ===== Courier Operations =====
  {
    keywords: [
      "courier",
      "driver",
      "assignment",
      "delivery route",
      "route optimization",
      "cash collection",
      "cod",
    ],
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
    suggestions: [
      "Show my assignments",
      "Optimize my route",
      "Report a delivery issue",
    ],
  },

  // ===== Bulk / Corporate Shipping =====
  {
    keywords: [
      "bulk",
      "corporate",
      "business",
      "company",
      "enterprise",
      "volume",
      "contract",
      "wholesale",
    ],
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
    suggestions: [
      "Request a corporate account",
      "API integration docs",
      "Volume pricing info",
    ],
  },

  // ===== Returns / Rerouting =====
  {
    keywords: [
      "return",
      "reroute",
      "redirect",
      "change address",
      "cancel shipment",
      "send back",
    ],
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
    suggestions: [
      "Cancel my shipment",
      "Change delivery address",
      "Return a parcel",
    ],
  },

  // ===== Registration / Sign Up =====
  {
    keywords: [
      "register",
      "sign up",
      "signup",
      "create account",
      "new account",
      "join",
    ],
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
    suggestions: [
      "I can't receive the OTP",
      "Forgot my password",
      "Link email to my account",
    ],
  },

  // ===== Language Support =====
  {
    keywords: [
      "language",
      "french",
      "english",
      "translate",
      "langue",
      "francais",
      "anglais",
    ],
    response: `🌍 **Language Support**

SmartCAMPOST supports:
- **English** 🇬🇧
- **French** 🇫🇷

You can switch languages anytime:
1. Click the **language toggle** in the navigation bar
2. Or go to **Settings > Preferences > Language**

All notifications (SMS, email) will be sent in your preferred language. The AI assistant also responds in your chosen language.`,
    suggestions: [
      "Switch to French",
      "Switch to English",
      "Update my preferences",
    ],
  },

  // ===== Finance / Revenue =====
  {
    keywords: [
      "revenue",
      "finance",
      "financial",
      "income",
      "earnings",
      "profit",
      "reconciliation",
      "audit",
    ],
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
    suggestions: [
      "Show revenue trends",
      "Export financial report",
      "View pending payments",
    ],
  },

  // ===== Risk / Security =====
  {
    keywords: [
      "risk",
      "fraud",
      "security",
      "anomaly",
      "suspicious",
      "compliance",
      "alert",
      "threat",
    ],
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
    suggestions: [
      "View active alerts",
      "Generate compliance report",
      "Review flagged accounts",
    ],
  },

  // ===== Staff Operations =====
  {
    keywords: [
      "staff",
      "employee",
      "operations",
      "process",
      "workflow",
      "team",
      "manage staff",
    ],
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
    keywords: [
      "admin",
      "administrator",
      "system",
      "configure",
      "manage users",
      "manage agencies",
    ],
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
    keywords: [
      "hello",
      "hi",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
      "bonjour",
      "salut",
      "bonsoir",
    ],
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
    keywords: [
      "address",
      "addresses",
      "saved address",
      "add address",
      "my addresses",
      "destination",
    ],
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
    suggestions: [
      "Add a new address",
      "Edit my addresses",
      "Set default address",
    ],
  },

  // ===== Delay / Late =====
  {
    keywords: [
      "delay",
      "late",
      "delayed",
      "slow",
      "overdue",
      "not arrived",
      "still waiting",
    ],
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
    suggestions: [
      "Check delivery times",
      "Express shipping options",
      "Find open agencies",
    ],
  },

  // ===== What is SmartCAMPOST =====
  {
    keywords: [
      "what is",
      "smartcampost",
      "about",
      "platform",
      "system",
      "application",
      "app",
      "campost",
      "postal",
    ],
    response: `🏢 **About SmartCAMPOST**

SmartCAMPOST is the **digital logistics and parcel management platform** for Cameroon Postal Services (CAMPOST).

Key features:
- **Parcel management**: Create, track, and deliver parcels across Cameroon
- **Real-time GPS tracking**: Follow your parcel on an interactive map
- **Dynamic pricing**: Calculated based on weight, distance, and service type
- **AI-powered logistics**: Route optimization, delivery prediction, fraud detection
- **Multi-role system**: Dashboards for clients, couriers, agents, staff, admin, finance, and risk teams
- **Multiple payment methods**: Orange Money, MTN Mobile Money, bank transfer, cash
- **QR code scanning**: At every checkpoint for real-time updates
- **SMS & email notifications**: Automated at every status change
- **9 autonomous AI agents**: Handling predictions, routing, monitoring, and more

The platform serves all 7 roles with tailored dashboards and capabilities.`,
    suggestions: [
      "What roles exist?",
      "How do I create a parcel?",
      "What AI features are available?",
    ],
  },

  // ===== Roles / User Types =====
  {
    keywords: [
      "role",
      "roles",
      "user type",
      "who can",
      "access",
      "permissions",
      "client",
      "courier",
      "agent",
      "staff",
      "admin",
      "finance",
      "risk",
    ],
    response: `👥 **User Roles in SmartCAMPOST**

The platform supports **7 distinct roles**, each with tailored access:

1. **CLIENT** — Ship and receive parcels, track deliveries, manage addresses, view invoices, schedule pickups
2. **COURIER** — View delivery assignments, optimize routes, scan QR codes, collect payments, performance analytics
3. **AGENT / AGENCY_ADMIN** — Manage agency operations, staff, parcel inventory, courier assignments, and reports
4. **STAFF** — Process parcels (intake/sort/dispatch), handle support tickets, coordinate deliveries, manage invoices
5. **ADMIN** — Full system access: user management, agency management, tariff config, compliance, system health
6. **FINANCE** — Revenue analytics, tariff management, invoice oversight, payment reconciliation, financial reports
7. **RISK** — Fraud detection, risk scoring, compliance audits, flagged accounts, incident management, security

Each role has a dedicated dashboard with role-specific features, analytics, and quick actions.`,
    suggestions: [
      "What can a client do?",
      "What can an admin do?",
      "How do I change my role?",
    ],
  },

  // ===== AI Agents / AI Features =====
  {
    keywords: [
      "ai",
      "artificial intelligence",
      "agent",
      "agents",
      "smart",
      "automation",
      "prediction",
      "machine learning",
      "autonomous",
    ],
    response: `🤖 **AI Features in SmartCAMPOST**

SmartCAMPOST uses **9 autonomous AI agents**:

1. **Route Optimizer** — Plans optimal delivery routes considering traffic, priorities, and multi-stop efficiency
2. **Delivery Predictor** — Estimates accurate arrival times based on current conditions
3. **Fraud Detector** — Monitors transactions for suspicious patterns and anomalies
4. **Risk Scorer** — Assigns risk scores to transactions and users
5. **Congestion Monitor** — Detects agency bottlenecks and suggests redistribution
6. **Customer Sentiment** — Analyzes support interactions for satisfaction trends
7. **Demand Forecaster** — Predicts parcel volumes for capacity planning
8. **Price Optimizer** — Suggests optimal pricing based on demand and competition
9. **SmartBot (me!)** — Your AI assistant for questions, navigation, and platform help

These agents work together to make logistics smarter, faster, and more reliable.`,
    suggestions: [
      "How does route optimization work?",
      "Tell me about fraud detection",
      "What is the delivery predictor?",
    ],
  },

  // ===== How to Create a Parcel =====
  {
    keywords: [
      "create parcel",
      "new parcel",
      "send",
      "ship",
      "shipment",
      "new shipment",
      "create shipment",
      "how to send",
    ],
    response: `📦 **Creating a New Shipment**

Step-by-step guide:
1. Go to **Dashboard > My Parcels > Create New Parcel**
2. Enter **sender information** (auto-filled for registered users)
3. Enter **recipient details** (name, phone, address, city)
4. Specify **parcel details**: weight, dimensions, description
5. Choose **service type**: Standard (3-5 days) or Express (1-2 days)
6. Select **insurance** (optional): Basic (free), Standard (2%), Premium (3.5%)
7. Review the **calculated price** — includes weight, distance, service, and insurance
8. Choose **payment method**: Orange Money, MTN MoMo, bank transfer, or cash
9. Confirm — you'll receive a **tracking number** and QR code immediately

You can also **schedule a pickup** so a courier comes to collect the parcel from your location.`,
    suggestions: [
      "Schedule a pickup",
      "What are the prices?",
      "Insurance options",
    ],
  },

  // ===== Notifications / Settings =====
  {
    keywords: [
      "settings",
      "preferences",
      "configure",
      "customize",
      "theme",
      "dark mode",
      "light mode",
      "option",
    ],
    response: `⚙️ **Settings & Preferences**

You can customize your experience:
- **Language**: Switch between English and French
- **Notifications**: Enable/disable SMS, email, or push notifications per event type
- **Profile**: Update name, phone, email, and photo
- **Addresses**: Manage saved addresses for faster shipping
- **Security**: Change password, enable two-factor authentication

Access settings from the **gear icon** in the navigation bar or sidebar.`,
    suggestions: [
      "Change language",
      "Update my profile",
      "Manage notifications",
    ],
  },

  // ===== Dashboard / Navigation =====
  {
    keywords: [
      "dashboard",
      "home",
      "navigate",
      "menu",
      "sidebar",
      "where is",
      "how to find",
      "go to",
    ],
    response: `🏠 **Dashboard & Navigation**

Your dashboard is your home base. It shows:
- **Overview cards**: Quick stats (active parcels, deliveries, revenue, etc.)
- **Recent activity**: Latest parcel updates, payments, and notifications
- **Quick actions**: Common tasks for your role

Navigation:
- **Sidebar** (left): Main navigation for your role's pages
- **Top bar**: Search, notifications, language toggle, profile menu
- **AI Chat** (bottom-right): SmartBot for instant help

Each role has different pages accessible from the sidebar. Ask me about any specific page!`,
    suggestions: [
      "What pages can I access?",
      "Show my parcels",
      "Open analytics",
    ],
  },

  // ===== General Knowledge: Cameroon =====
  {
    keywords: [
      "cameroon",
      "cameroun",
      "africa",
      "country",
      "xaf",
      "cfa",
      "franc",
      "currency",
      "region",
    ],
    response: `🇨🇲 **About Cameroon**

Cameroon is in Central/West Africa, known as "Africa in miniature" for its geographic diversity.

Key facts relevant to SmartCAMPOST:
- **Currency**: CFA Franc (XAF) — pegged to the Euro
- **Major cities**: Douala (economic capital), Yaoundé (political capital), Bafoussam, Garoua, Bamenda, Kribi, Bertoua
- **Official languages**: French and English
- **Population**: ~28 million
- **Mobile money**: Widely used — Orange Money and MTN Mobile Money are the dominant providers
- **Postal service**: CAMPOST (Cameroon Postal Services) — SmartCAMPOST digitizes their operations

Our agency network covers all major cities with plans for expansion to smaller towns.`,
    suggestions: [
      "Where are your agencies?",
      "What payment methods?",
      "Do you deliver nationwide?",
    ],
  },

  // ===== Mobile Money Details =====
  {
    keywords: [
      "orange money",
      "mtn mobile money",
      "momo",
      "mobile payment",
      "how to pay mobile",
    ],
    response: `📱 **Mobile Money Payments**

We support two mobile money providers:

**Orange Money:**
- Dial *150# to access your Orange Money menu
- Pay via the SmartCAMPOST app (automatic prompt to your phone)
- Instant confirmation — no waiting

**MTN Mobile Money (MoMo):**
- Dial *126# to access your MoMo menu
- Pay via the SmartCAMPOST app
- Instant confirmation

Both methods are:
- ✅ Available 24/7
- ✅ Secure and encrypted
- ✅ Instant confirmation
- ✅ Receipt sent via SMS automatically

Transaction fees are absorbed by SmartCAMPOST — you pay only the shipping cost.`,
    suggestions: [
      "Other payment methods?",
      "Payment failed — help",
      "Where are my receipts?",
    ],
  },

  // ===== What Can You Do (Capabilities) =====
  {
    keywords: [
      "what can you do",
      "capabilities",
      "abilities",
      "your features",
      "how can you help",
      "what do you know",
    ],
    response: `🤖 **What I Can Do**

I'm SmartBot, your all-purpose AI assistant! Here's what I can help with:

**SmartCAMPOST Platform:**
- 📦 Parcel tracking, creation, and management
- 💰 Pricing, quotes, and payment information
- 🚚 Delivery times, pickup scheduling
- 🗺️ Agency locations and map features
- 🛡️ Insurance, claims, and refunds
- 📱 QR codes, notifications, and account settings
- 📊 Analytics, reports, and dashboards (per your role)
- 🔧 System features and how-to guides

**General Knowledge:**
- 🌍 Geography, culture, current events
- 🧮 Math, science, technology
- 💼 Business, logistics, supply chain
- 📚 Education, language help
- 💡 General advice and recommendations

I adapt my responses to your role — ask me anything!`,
    suggestions: [
      "Track my parcel",
      "What are your prices?",
      "Tell me about Cameroon",
    ],
  },

  // ===== Thank You / Goodbye =====
  {
    keywords: [
      "thank",
      "thanks",
      "merci",
      "bye",
      "goodbye",
      "au revoir",
      "see you",
      "appreciate",
    ],
    response: `😊 You're welcome! I'm glad I could help.

If you need anything else, just type your question or use the quick actions below. I'm available 24/7!

Have a great day! 🌟`,
    suggestions: ["Track my parcel", "Contact support", "Help"],
  },

  // ===== Login / Authentication =====
  {
    keywords: [
      "login",
      "log in",
      "sign in",
      "signin",
      "authenticate",
      "cannot login",
      "forgot password",
      "reset password",
      "otp",
    ],
    response: `🔐 **Login & Authentication**

To log in:
1. Go to the **Sign In** page
2. Enter your **phone number** or **email**
3. Enter your **password**
4. Click "Sign In"

If you forgot your password:
1. Click **"Forgot Password"** on the login page
2. Enter your registered phone number or email
3. You'll receive an **OTP** (one-time password) via SMS
4. Enter the OTP and set a new password

Common login issues:
- Wrong phone format — use international format (+237...)
- Account not activated — check your SMS for activation code
- Too many failed attempts — wait 15 minutes or contact support`,
    suggestions: [
      "Reset my password",
      "I can't receive OTP",
      "Create an account",
    ],
  },

  // ===== Pickup scheduling =====
  {
    keywords: [
      "schedule pickup",
      "book pickup",
      "pickup time",
      "pickup slot",
      "come collect",
      "home pickup",
    ],
    response: `📅 **Scheduling a Pickup**

To schedule a courier pickup:
1. After creating your parcel, select **"Schedule Pickup"**
2. Choose your **pickup address** (from saved addresses or enter new)
3. Select a **date** and **time slot** (morning 8-12, afternoon 12-4, evening 4-7)
4. Confirm — a courier will be assigned

You'll receive:
- SMS confirmation with pickup details
- Notification when the courier is en route
- Confirmation when pickup is complete

Tips:
- Schedule at least 2 hours in advance
- Ensure someone is present at the address
- Have the parcel properly packaged and ready`,
    suggestions: [
      "Create a parcel first",
      "Manage my addresses",
      "Packaging guidelines",
    ],
  },

  // ===== Report / Analytics =====
  {
    keywords: [
      "report",
      "analytics",
      "statistics",
      "data",
      "performance",
      "kpi",
      "metrics",
      "chart",
      "graph",
    ],
    response: `📊 **Reports & Analytics**

Each role has access to tailored analytics:

**Clients**: Shipping history, spending trends, delivery performance
**Couriers**: Deliveries per day, route efficiency, customer ratings
**Agents**: Agency throughput, parcel inventory, staff performance
**Staff**: Processing speed, ticket resolution, daily/weekly metrics
**Admin**: System-wide KPIs, user growth, revenue, agency performance
**Finance**: Revenue trends, payment methods, refund rates, forecasts
**Risk**: Fraud alerts, risk scores, compliance status, incident trends

Reports can be filtered by date range, exported as PDF or CSV, and shared via email.`,
    suggestions: ["Show my analytics", "Export a report", "Revenue trends"],
  },
];

/**
 * Scoring-based response finder.
 * Scores every knowledge entry against the user's query and returns the best match.
 */
export function findResponse(query: string): {
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
      if (lowerQuery.includes(kw)) {
        score += 1 + kw.length * 0.1;
      }
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

  return {
    response: `I appreciate your question! While I may not have a specific offline answer for that, I can help with many topics:

📦 **SmartCAMPOST**: Tracking, shipping, pricing, delivery, payments, agencies, insurance, QR codes, reports
🌍 **General**: Geography, tech, business, math, science, culture — ask me anything!
👤 **Your Account**: Profile, settings, addresses, notifications, password

Try rephrasing your question, or pick one of the suggestions below. When the AI backend is connected, I can answer even more complex and detailed questions! 🤖`,
    suggestions: [
      "What can you do?",
      "Track my parcel",
      "What is SmartCAMPOST?",
      "Help",
    ],
  };
}
