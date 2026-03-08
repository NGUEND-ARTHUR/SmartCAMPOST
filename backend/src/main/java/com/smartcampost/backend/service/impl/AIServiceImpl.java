package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.ai.*;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionRequest;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionResponse;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.service.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
 

@Service
@RequiredArgsConstructor
@Slf4j
public class AIServiceImpl implements AIService {

    private final com.smartcampost.backend.service.impl.client.OpenAIClient openAIClient;
    private final com.smartcampost.backend.repository.UserAccountRepository userAccountRepository;
    private final com.smartcampost.backend.repository.ParcelRepository parcelRepository;

    private final com.smartcampost.backend.service.ai.agents.RouteOptimizationAgent routeOptimizationAgent;
    private final com.smartcampost.backend.service.ai.agents.TrackingPredictionAgent trackingPredictionAgent;
    private final com.smartcampost.backend.service.ai.agents.MonitoringAgent monitoringAgent;

    @Value("${OPENAI_API_KEY:}")
    private String openAiApiKey;

    // Knowledge base fallback for local responses when AI key not configured
    private static final Map<String, KnowledgeEntry> KNOWLEDGE_BASE = new HashMap<>();

    static {
        // ========== CLIENT/CUSTOMER ROLE ==========
        KNOWLEDGE_BASE.put("track", new KnowledgeEntry(
                "TRACKING",
                "📦 To track your parcel:\n1. Go to 'My Parcels' in your dashboard\n2. Click on the parcel to see its status\n3. View the live map showing its journey\n\nYou can also enter your tracking code on the home page for quick tracking.",
                Arrays.asList("Where is my parcel?", "How do I change delivery address?", "Is my parcel delayed?")
        ));

        KNOWLEDGE_BASE.put("price", new KnowledgeEntry(
                "PRICING",
                "💰 Our pricing is based on:\n- **Weight**: Charged per kg\n- **Distance**: Based on origin and destination\n- **Service Type**: Standard (3-5 days) or Express (1-2 days)\n\nCreate a new parcel in your dashboard for an instant quote.",
                Arrays.asList("Do you offer volume discounts?", "Is insurance included?", "What about fragile items?")
        ));

        KNOWLEDGE_BASE.put("delivery", new KnowledgeEntry(
                "DELIVERY",
                "🚚 Delivery times depend on service:\n- **Standard**: 3-5 business days\n- **Express**: 1-2 business days\n\nTrack your parcel in real-time on our map.",
                Arrays.asList("Can I schedule delivery time?", "Do you deliver on weekends?", "What if I'm not home?")
        ));

        KNOWLEDGE_BASE.put("payment", new KnowledgeEntry(
                "PAYMENT",
                "💳 We accept multiple payment methods:\n- **Mobile Money**: Orange Money, MTN Mobile Money\n- **Bank Transfer**: All major banks\n- **Cash**: At our agencies\n\nPayment is required before pickup.",
                Arrays.asList("Can I pay on delivery?", "How do I get a receipt?", "Do you accept international cards?")
        ));

        KNOWLEDGE_BASE.put("pickup", new KnowledgeEntry(
                "PICKUP",
                "📍 For pickup scheduling:\n1. Create your parcel with origin address\n2. Choose a pickup date and time slot\n3. Our courier will collect your package\n\nYou'll receive SMS notifications.",
                Arrays.asList("What if I miss the pickup?", "Can someone else give the parcel?", "Where do I pack my parcel?")
        ));

        KNOWLEDGE_BASE.put("lost", new KnowledgeEntry(
                "CLAIMS",
                "⚠️ For lost or damaged parcels:\n1. File a claim in your dashboard within 24 hours\n2. We'll investigate and follow up\n3. Compensation is based on declared value and insurance coverage\n\nResponse time: 2-5 business days",
                Arrays.asList("How much compensation?", "What if I wasn't insured?", "What's your investigation process?")
        ));

        // ========== COURIER ROLE ==========
        KNOWLEDGE_BASE.put("courier", new KnowledgeEntry(
                "COURIER_HELP",
                "🚚 **Courier Dashboard**:\n- View assigned deliveries\n- Optimize your route with AI suggestions\n- Update delivery status\n- Collect cash payments safely\n\nWhat do you need help with?",
                Arrays.asList("How to optimize my route?", "Payment collection tips", "Handle delivery issues")
        ));

        KNOWLEDGE_BASE.put("route", new KnowledgeEntry(
                "ROUTE_OPTIMIZATION",
                "🛣️ Our AI can optimize your route:\n- Nearest-neighbor algorithm for efficiency\n- Priority stops handled first\n- Real-time traffic considerations\n\nGo to Dashboard > Route Optimization for suggestions.",
                Arrays.asList("Current route issues?", "How accurate is it?", "Can I customize stops?")
        ));

        // ========== AGENCY ROLE ==========
        KNOWLEDGE_BASE.put("agency", new KnowledgeEntry(
                "AGENCY_HELP",
                "🏢 **Agency Dashboard**:\n- Monitor incoming parcels\n- Manage staff and couriers\n- View congestion analytics\n- Generate performance reports\n\nWhat do you need?",
                Arrays.asList("Parcel statistics", "Staff management", "Performance reports")
        ));

        KNOWLEDGE_BASE.put("inventory", new KnowledgeEntry(
                "INVENTORY",
                "📦 **Parcel Inventory**:\n- Track all parcels at your agency\n- Filter by status (arrived, out for delivery, picked up)\n- Set up automatic alerts for delays\n- Export reports for audit\n\nCheck Dashboard > Inventory.",
                Arrays.asList("Current parcel count?", "How to set alerts?", "Export reports?")
        ));

        // ========== FINANCE ROLE ==========
        KNOWLEDGE_BASE.put("revenue", new KnowledgeEntry(
                "FINANCE_HELP",
                "📊 **Finance Dashboard**:\n- View revenue analytics and trends\n- Manage tariffs and pricing rules\n- Oversee invoices and reconciliation\n- Export financial reports (PDF/CSV)\n\nWhat do you need?",
                Arrays.asList("Revenue trends", "Manage tariffs", "Export report")
        ));

        KNOWLEDGE_BASE.put("tariff", new KnowledgeEntry(
                "TARIFF_MANAGEMENT",
                "💰 **Tariff Management**:\n- Create/edit pricing rules by weight, distance, and service type\n- Set seasonal adjustments and bulk discounts\n- Preview price impact before applying changes\n- View tariff history and audit trail",
                Arrays.asList("Configure pricing", "View current tariffs", "Bulk discounts")
        ));

        // ========== RISK ROLE ==========
        KNOWLEDGE_BASE.put("risk", new KnowledgeEntry(
                "RISK_HELP",
                "🛡️ **Risk Dashboard**:\n- Monitor active fraud alerts\n- View risk scores and anomaly detection\n- Generate compliance reports\n- Review flagged accounts\n\nAlerts are prioritized: Critical > High > Medium > Low",
                Arrays.asList("Active alerts", "Compliance report", "Flagged accounts")
        ));

        KNOWLEDGE_BASE.put("fraud", new KnowledgeEntry(
                "FRAUD_DETECTION",
                "🔍 **Fraud Detection**:\nOur AI monitors for suspicious patterns:\n- Unusual transaction volumes\n- Multiple failed payment attempts\n- Suspicious address changes\n- High-value shipments from new accounts\n- Geographic anomalies\n\nAll alerts trigger automatic risk scoring.",
                Arrays.asList("View fraud alerts", "Risk scoring rules", "Investigation process")
        ));

        // ========== INSURANCE ==========
        KNOWLEDGE_BASE.put("insurance", new KnowledgeEntry(
                "INSURANCE",
                "🛡️ **Insurance Options**:\n- Basic (free): Up to 50,000 XAF coverage\n- Standard (2%): Up to 500,000 XAF\n- Premium (3.5%): Full declared value\n\nAdd insurance when creating your parcel. Claims processed within 5-10 business days.",
                Arrays.asList("How to file a claim?", "Insurance pricing", "Coverage details")
        ));

        // ========== UNIVERSAL ==========
        KNOWLEDGE_BASE.put("help", new KnowledgeEntry(
                "SUPPORT",
                "ℹ️ I can assist you with:\n- 📦 Tracking parcels\n- 💰 Pricing & payments\n- 🚚 Delivery information\n- 📍 Agency locations\n- 🛣️ Route optimization\n- 📋 Account management\n- 🛡️ Insurance & claims\n- 📊 Analytics & reports\n\nWhat do you need?",
                Arrays.asList("Track my parcel", "Find an agency", "I have a problem")
        ));

        KNOWLEDGE_BASE.put("hello", new KnowledgeEntry(
                "GREETING",
                "👋 Hello! Welcome to SmartCAMPOST AI Assistant!\n\nI'm here to help you with parcels, tracking, payments, and platform features. What's on your mind?",
                Arrays.asList("Track my parcel", "What are your prices?", "Find nearest agency")
        ));

        KNOWLEDGE_BASE.put("hi", new KnowledgeEntry(
                "GREETING",
                "👋 Hi there! I'm SmartCAMPOST AI. How can I help you today?",
                Arrays.asList("Create a parcel", "Track a delivery", "Check rates")
        ));

        KNOWLEDGE_BASE.put("contact", new KnowledgeEntry(
                "CONTACT",
                "📞 **Contact Us**:\n- **Phone**: +237 222 23 15 05\n- **Email**: support@smartcampost.cm\n- **WhatsApp**: +237 653 72 00 00\n- **Agencies**: Find locations in map view\n- **In-app**: File tickets in dashboard\n\nResponse time: 2-4 hours",
                Arrays.asList("Find nearest agency", "Email support", "File a complaint")
        ));

        // ========== ADMIN/MODERATOR ==========
        KNOWLEDGE_BASE.put("admin", new KnowledgeEntry(
                "ADMIN_HELP",
                "⚙️ **Admin Dashboard**:\n- Monitor all agencies & couriers\n- View system-wide analytics\n- Manage user accounts\n- Generate compliance reports\n\nWhat do you need to manage?",
                Arrays.asList("User management", "System analytics", "Generate reports")
        ));
    }

    @Override
    public RouteOptimizationResponse optimizeRoute(RouteOptimizationRequest request) {
        return routeOptimizationAgent.optimize(request);
    }

    @Override
    public ChatResponse processChat(ChatRequest request) {
        log.info("Processing chat message via AI: {}", request.getMessage());

        String sessionId = request.getSessionId() != null ? request.getSessionId() : UUID.randomUUID().toString();

        // Build RAG context
        StringBuilder rag = new StringBuilder();
        UserRole userRole = null;
        String userPhone = null;
        UUID userId = null;

        // 1) Extract user role and phone from authentication
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                String subject = auth.getName();
                try {
                    userId = java.util.UUID.fromString(subject);
                    UUID nonNullUserId = java.util.Objects.requireNonNull(userId, "userId is required");
                    var userOpt = userAccountRepository.findById(nonNullUserId);
                    if (userOpt.isPresent()) {
                        var user = userOpt.get();
                        userRole = user.getRole();
                        userPhone = user.getPhone();
                        rag.append("USER_ROLE: ").append(user.getRole()).append("\n");
                        rag.append("USER_PHONE: ").append(user.getPhone()).append("\n");
                        
                        // Add role-specific context
                        if (user.getRole() == UserRole.CLIENT) {
                            rag.append("CONTEXT: User is a client/shipper\n");
                        } else if (user.getRole() == UserRole.COURIER) {
                            rag.append("CONTEXT: User is a courier with delivery assignments\n");
                        } else if (user.getRole() == UserRole.AGENT || user.getRole() == UserRole.ADMIN || user.getRole() == UserRole.STAFF) {
                            rag.append("CONTEXT: User is staff/admin\n");
                        }
                    }
                } catch (IllegalArgumentException ex) {
                    var userOpt = userAccountRepository.findByPhone(subject);
                    if (userOpt.isPresent()) {
                        var user = userOpt.get();
                        userRole = user.getRole();
                        userPhone = user.getPhone();
                        userId = user.getId();
                        rag.append("USER_ROLE: ").append(user.getRole()).append("\n");
                        rag.append("USER_PHONE: ").append(user.getPhone()).append("\n");
                    }
                }
            }
        } catch (Exception e) {
            log.debug("No authenticated user found for RAG: {}", e.getMessage());
        }

        // 2) If request contains a tracking context, fetch parcel
        if (request.getContext() != null && !request.getContext().isBlank()) {
            String ctx = request.getContext().trim();
            var parcelOpt = parcelRepository.findByTrackingRef(ctx);
            if (parcelOpt.isPresent()) {
                var parcel = parcelOpt.get();
                rag.append("PARCEL: ").append(parcel.getTrackingRef()).append("\n");
                rag.append("STATUS: ").append(parcel.getStatus()).append("\n");
                if (parcel.getExpectedDeliveryAt() != null) {
                    rag.append("EXPECTED_DELIVERY: ").append(parcel.getExpectedDeliveryAt()).append("\n");
                }
                if (parcel.getDestinationAgency() != null) {
                    rag.append("DESTINATION_AGENCY: ").append(parcel.getDestinationAgency().getAgencyName()).append("\n");
                }
            }
        }

        // 3) Add privacy and role-specific instructions
        rag.append("NOTE: Do not disclose passwords, OTPs, or sensitive data. Only include relevant allowed fields.\n");
        rag.append("INSTRUCTIONS: Tailor responses specifically for ").append(userRole != null ? userRole.name() : "GUEST").append(" role.\n");

        // If OpenAI key not configured, fallback to local KB with role awareness
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            return fallbackLocalResponse(request, sessionId, userRole, userPhone);
        }

        // Build messages for OpenAI
        java.util.ArrayList<Map<String, String>> messages = new java.util.ArrayList<>();
        // Expanded system prompt with project knowledge and universal expert instructions
        String systemPrompt = System.getenv("SMARTCAMPOST_AI_SYSTEM_PROMPT");
        if (systemPrompt == null || systemPrompt.isBlank()) {
            systemPrompt = (
                "You are SmartCAMPOST AI, the universal expert and autonomous assistant for the SmartCAMPOST logistics platform (Cameroon Postal Services). " +
                "You have full knowledge of all platform features, business rules, user roles, and technical documentation. " +
                "You can answer any question about SmartCAMPOST, including parcels, tracking, payments, agencies, user accounts, technical issues, and operational procedures. " +
                "You are also able to perform actions and trigger tasks for the user, based on their role and permissions.\n" +
                "\n" +
                "Your capabilities include:\n" +
                "- Answering all user, staff, courier, agency, and admin questions about the system\n" +
                "- Providing step-by-step help for any feature\n" +
                "- Suggesting and triggering actions (e.g., navigation, ticket creation, tracking, route optimization)\n" +
                "- Explaining business logic, technical flows, and operational policies\n" +
                "- Never hallucinating parcel statuses or making up data\n" +
                "- Always tailoring your answers and actions to the user's role: " + (userRole != null ? userRole.name() : "GUEST") + "\n" +
                "\n" +
                "Project summary:\n" +
                "SmartCAMPOST is a digital logistics and parcel management platform for Cameroon Postal Services. It supports parcel creation, tracking, delivery, agency/courier management, payments, support, and analytics.\n" +
                "Key features:\n" +
                "- Parcel creation, tracking, and delivery\n" +
                "- Address and agency management\n" +
                "- Real-time courier route optimization\n" +
                "- Delivery time prediction\n" +
                "- User roles: CLIENT, COURIER, AGENT, ADMIN, STAFF, FINANCE, RISK\n" +
                "- Support ticketing and helpdesk\n" +
                "- Payment integration (Mobile Money, bank, cash)\n" +
                "- Analytics and reporting\n" +
                "- Security and compliance\n" +
                "\n" +
                "Instructions:\n" +
                "- Always answer as a SmartCAMPOST expert.\n" +
                "- If the user asks for help, provide clear, actionable steps.\n" +
                "- If the user requests an action (e.g., track parcel, optimize route, create ticket), return a structured action in your response.\n" +
                "- If you need more information (e.g., tracking code), ask for it.\n" +
                "- If the user is not authenticated, answer as a public support agent.\n" +
                "- If the user is a CLIENT, focus on parcel, address, payment, and support features.\n" +
                "- If the user is a COURIER, focus on assignments, route optimization, and delivery status.\n" +
                "- If the user is an AGENT or ADMIN, focus on analytics, staff, agency, and compliance.\n" +
                "- If you do not know the answer, say so and suggest contacting support.\n"
            );
        }

        Map<String, String> sys = new HashMap<>();
        sys.put("role", "system");
        sys.put("content", systemPrompt);
        messages.add(sys);

        // Add a summary of available endpoints/features to the context for richer answers
        StringBuilder featureContext = new StringBuilder();
        featureContext.append("Available features and endpoints:\n");
        featureContext.append("- /api/ai/chat: AI assistant chat (all roles)\n");
        featureContext.append("- /api/ai/optimize-route: Route optimization (courier)\n");
        featureContext.append("- /api/ai/predict-delivery: Delivery time prediction (all)\n");
        featureContext.append("- /api/ai/agent/status: Agent status and recommendations (staff/admin)\n");
        featureContext.append("- /api/ai/recommendations: AI recommendations (courier/agency)\n");
        featureContext.append("- /api/parcels, /api/addresses, /api/users, /api/support, /api/payments, /api/analytics: Core business endpoints\n");
        featureContext.append("- User role: ").append(userRole != null ? userRole.name() : "GUEST").append("\n");
        featureContext.append("- User phone: ").append(userPhone != null ? userPhone : "N/A").append("\n");
        featureContext.append("- Context: ").append(rag.toString()).append("\n");

        Map<String, String> ctxMsg = new HashMap<>();
        ctxMsg.put("role", "system");
        ctxMsg.put("content", featureContext.toString());
        messages.add(ctxMsg);

        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", request.getMessage());
        messages.add(userMsg);

        // Call OpenAI client (model and params tuned for quality)
        String model = System.getenv().getOrDefault("SMARTCAMPOST_AI_MODEL", "gpt-4o-mini");
        int maxTokens = 600;
        double temperature = 0.25;

        try {
            var responseMono = openAIClient.createChatCompletion(model, messages, maxTokens, temperature);
            String aiText = responseMono.block();
            if (aiText == null || aiText.isBlank()) {
                return fallbackLocalResponse(request, sessionId, userRole, userPhone);
            }

            // Build ChatResponse with role-specific suggestions
            List<String> suggestions = generateSuggestionsForRole(userRole, request.getMessage());
            return ChatResponse.builder()
                    .message(aiText.trim())
                    .sessionId(sessionId)
                    .suggestions(suggestions)
                    .intent("AI_ASSISTANT")
                    .confidence(0.75)
                    .build();
        } catch (Exception e) {
            log.error("AI chat failed: {}", e.getMessage());
            return fallbackLocalResponse(request, sessionId, userRole, userPhone);
        }
    }

    private ChatResponse fallbackLocalResponse(ChatRequest request, String sessionId, UserRole userRole, String userPhone) {
        String message = request.getMessage().toLowerCase();
        KnowledgeEntry bestMatch = null;
        for (Map.Entry<String, KnowledgeEntry> entry : KNOWLEDGE_BASE.entrySet()) {
            if (message.contains(entry.getKey())) {
                bestMatch = entry.getValue();
                break;
            }
        }

        List<String> suggestions = new ArrayList<>();
        if (bestMatch != null) {
            suggestions.addAll(bestMatch.suggestions);
            return ChatResponse.builder()
                    .message(bestMatch.response)
                    .sessionId(sessionId)
                    .suggestions(suggestions)
                    .intent(bestMatch.intent)
                    .confidence(0.85)
                    .build();
        }

        // Default response with role-specific suggestions
        suggestions = generateSuggestionsForRole(userRole, message);
        return ChatResponse.builder()
                .message("I'm not sure I understand. Could you rephrase your question? "
                        + (userRole != null ? "I'm here to help " + userRole.name().toLowerCase() + "s with " : "")
                        + "parcels, tracking, and deliveries.")
                .sessionId(sessionId)
                .suggestions(suggestions)
                .intent("UNKNOWN")
                .confidence(0.3)
                .build();
    }

    private List<String> generateSuggestionsForRole(UserRole role, String context) {
        List<String> suggestions = new ArrayList<>();
        
        if (role == UserRole.CLIENT) {
            suggestions.addAll(Arrays.asList(
                    "Track my parcel",
                    "Create new shipment",
                    "Check delivery rates",
                    "View my invoices"
            ));
        } else if (role == UserRole.COURIER) {
            suggestions.addAll(Arrays.asList(
                    "Show my assignments",
                    "Optimize my route",
                    "Update delivery status",
                    "Payment collection tips"
            ));
        } else if (role == UserRole.AGENT) {
            suggestions.addAll(Arrays.asList(
                    "Parcel inventory",
                    "Staff management",
                    "Generate agency report",
                    "View congestion alerts"
            ));
        } else if (role == UserRole.ADMIN) {
            suggestions.addAll(Arrays.asList(
                    "System analytics",
                    "Manage user accounts",
                    "Configure tariffs",
                    "System health check"
            ));
        } else if (role == UserRole.STAFF) {
            suggestions.addAll(Arrays.asList(
                    "Process parcels",
                    "View deliveries",
                    "Open support tickets",
                    "Performance analytics"
            ));
        } else if (role == UserRole.FINANCE) {
            suggestions.addAll(Arrays.asList(
                    "Revenue trends",
                    "Manage tariffs",
                    "View invoices",
                    "Export financial report"
            ));
        } else if (role == UserRole.RISK) {
            suggestions.addAll(Arrays.asList(
                    "Active alerts",
                    "Fraud detection report",
                    "Compliance audit",
                    "Flagged accounts"
            ));
        } else {
            suggestions.addAll(Arrays.asList(
                    "Track my parcel",
                    "Pricing info",
                    "Contact support"
            ));
        }
        
        return suggestions;
    }

    @Override
    public DeliveryPredictionResponse predictDeliveryTime(DeliveryPredictionRequest request) {
        return trackingPredictionAgent.predict(request);
    }

    @Override
    public AgentStatusResponse getAgentStatus() {
        return monitoringAgent.getStatus();
    }

    // Inner class for knowledge base entries
    private static class KnowledgeEntry {
        String intent;
        String response;
        List<String> suggestions;

        KnowledgeEntry(String intent, String response, List<String> suggestions) {
            this.intent = intent;
            this.response = response;
            this.suggestions = suggestions;
        }
    }
}
