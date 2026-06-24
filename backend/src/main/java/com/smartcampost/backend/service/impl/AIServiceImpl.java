package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.ai.*;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionRequest;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionResponse;
import com.smartcampost.backend.model.Conversation;
import com.smartcampost.backend.model.ConversationMessage;
import com.smartcampost.backend.model.enums.ConversationChannel;
import com.smartcampost.backend.model.enums.ConversationRole;
import com.smartcampost.backend.model.enums.ConversationStatus;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.ConversationMessageRepository;
import com.smartcampost.backend.repository.ConversationRepository;
import com.smartcampost.backend.service.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIServiceImpl implements AIService {

    private final com.smartcampost.backend.service.impl.client.OpenAIClient openAIClient;
    private final com.smartcampost.backend.repository.UserAccountRepository userAccountRepository;
    private final com.smartcampost.backend.repository.ParcelRepository parcelRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationMessageRepository conversationMessageRepository;

    private final com.smartcampost.backend.service.ai.agents.RouteOptimizationAgent routeOptimizationAgent;
    private final com.smartcampost.backend.service.ai.agents.TrackingPredictionAgent trackingPredictionAgent;
    private final com.smartcampost.backend.service.ai.agents.MonitoringAgent monitoringAgent;

    @Value("${OPENAI_API_KEY:}")
    private String openAiApiKey;

    private static final int MAX_HISTORY_MESSAGES = 10;

    private static final Map<String, KnowledgeEntry> KNOWLEDGE_BASE = new HashMap<>();

    static {
        KNOWLEDGE_BASE.put("track", new KnowledgeEntry("TRACKING",
                "To track your parcel:\n1. Go to 'My Parcels' in your dashboard\n2. Click on the parcel to see its status\n3. View the live map showing its journey\n\nYou can also enter your tracking code on the home page for quick tracking.",
                Arrays.asList("Where is my parcel?", "How do I change delivery address?", "Is my parcel delayed?")));
        KNOWLEDGE_BASE.put("price", new KnowledgeEntry("PRICING",
                "Our pricing is based on:\n- Weight: Charged per kg\n- Distance: Based on origin and destination\n- Service Type: Standard (3-5 days) or Express (1-2 days)\n\nCreate a new parcel in your dashboard for an instant quote.",
                Arrays.asList("Do you offer volume discounts?", "Is insurance included?", "What about fragile items?")));
        KNOWLEDGE_BASE.put("delivery", new KnowledgeEntry("DELIVERY",
                "Delivery times depend on service:\n- Standard: 3-5 business days\n- Express: 1-2 business days\n\nTrack your parcel in real-time on our map.",
                Arrays.asList("Can I schedule delivery time?", "Do you deliver on weekends?", "What if I'm not home?")));
        KNOWLEDGE_BASE.put("payment", new KnowledgeEntry("PAYMENT",
                "We accept multiple payment methods:\n- Mobile Money: Orange Money, MTN Mobile Money\n- Bank Transfer: All major banks\n- Cash: At our agencies\n\nPayment is required before pickup.",
                Arrays.asList("Can I pay on delivery?", "How do I get a receipt?", "Do you accept international cards?")));
        KNOWLEDGE_BASE.put("pickup", new KnowledgeEntry("PICKUP",
                "For pickup scheduling:\n1. Create your parcel with origin address\n2. Choose a pickup date and time slot\n3. Our courier will collect your package\n\nYou'll receive SMS notifications.",
                Arrays.asList("What if I miss the pickup?", "Can someone else give the parcel?", "Where do I pack my parcel?")));
        KNOWLEDGE_BASE.put("lost", new KnowledgeEntry("CLAIMS",
                "For lost or damaged parcels:\n1. File a claim in your dashboard within 24 hours\n2. We'll investigate and follow up\n3. Compensation is based on declared value and insurance coverage\n\nResponse time: 2-5 business days",
                Arrays.asList("How much compensation?", "What if I wasn't insured?", "What's your investigation process?")));
        KNOWLEDGE_BASE.put("courier", new KnowledgeEntry("COURIER_HELP",
                "Courier Dashboard:\n- View assigned deliveries\n- Optimize your route with AI suggestions\n- Update delivery status\n- Collect cash payments safely\n\nWhat do you need help with?",
                Arrays.asList("How to optimize my route?", "Payment collection tips", "Handle delivery issues")));
        KNOWLEDGE_BASE.put("route", new KnowledgeEntry("ROUTE_OPTIMIZATION",
                "Our AI can optimize your route:\n- Nearest-neighbor algorithm for efficiency\n- Priority stops handled first\n- Real-time traffic considerations\n\nGo to Dashboard > Route Optimization for suggestions.",
                Arrays.asList("Current route issues?", "How accurate is it?", "Can I customize stops?")));
        KNOWLEDGE_BASE.put("agency", new KnowledgeEntry("AGENCY_HELP",
                "Agency Dashboard:\n- Monitor incoming parcels\n- Manage staff and couriers\n- View congestion analytics\n- Generate performance reports\n\nWhat do you need?",
                Arrays.asList("Parcel statistics", "Staff management", "Performance reports")));
        KNOWLEDGE_BASE.put("help", new KnowledgeEntry("SUPPORT",
                "I can assist you with:\n- Tracking parcels\n- Pricing & payments\n- Delivery information\n- Agency locations\n- Route optimization\n- Account management\n- Insurance & claims\n- Analytics & reports\n\nWhat do you need?",
                Arrays.asList("Track my parcel", "Find an agency", "I have a problem")));
        KNOWLEDGE_BASE.put("hello", new KnowledgeEntry("GREETING",
                "Hello! Welcome to SmartCAMPOST AI Assistant!\n\nI'm here to help you with parcels, tracking, payments, and platform features. What's on your mind?",
                Arrays.asList("Track my parcel", "What are your prices?", "Find nearest agency")));
        KNOWLEDGE_BASE.put("hi", new KnowledgeEntry("GREETING",
                "Hi there! I'm SmartCAMPOST AI. How can I help you today?",
                Arrays.asList("Create a parcel", "Track a delivery", "Check rates")));
        KNOWLEDGE_BASE.put("contact", new KnowledgeEntry("CONTACT",
                "Contact Us:\n- Phone: +237 222 23 15 05\n- Email: support@smartcampost.cm\n- WhatsApp: +237 653 72 00 00\n- Agencies: Find locations in map view\n- In-app: File tickets in dashboard\n\nResponse time: 2-4 hours",
                Arrays.asList("Find nearest agency", "Email support", "File a complaint")));
    }

    @Override
    public RouteOptimizationResponse optimizeRoute(RouteOptimizationRequest request) {
        return routeOptimizationAgent.optimize(request);
    }

    @Override
    @Transactional
    public ChatResponse processChat(ChatRequest request) {
        log.info("Processing chat: {}", request.getMessage());
        long startMs = System.currentTimeMillis();

        String sessionId = request.getSessionId() != null ? request.getSessionId() : UUID.randomUUID().toString();

        // 1) Resolve authenticated user
        UserRole userRole = null;
        UUID userId = null;
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                String subject = auth.getName();
                try {
                    userId = UUID.fromString(subject);
                    var userOpt = userAccountRepository.findById(Objects.requireNonNull(userId));
                    if (userOpt.isPresent()) {
                        userRole = userOpt.get().getRole();
                    }
                } catch (IllegalArgumentException ex) {
                    var userOpt = userAccountRepository.findByPhone(subject);
                    if (userOpt.isPresent()) {
                        userRole = userOpt.get().getRole();
                        userId = userOpt.get().getId();
                    }
                }
            }
        } catch (Exception e) {
            log.debug("No authenticated user: {}", e.getMessage());
        }

        // 2) Resolve or create conversation in DB
        Conversation conversation = resolveConversation(sessionId, userId, userRole);

        // 3) Persist user message
        persistMessage(conversation, ConversationRole.USER, request.getMessage(), null);

        // 4) Build RAG context
        StringBuilder rag = buildRagContext(userRole, userId, request);

        // 5) If no OpenAI key, use local KB fallback
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            ChatResponse response = fallbackLocalResponse(request, sessionId, userRole);
            persistMessage(conversation, ConversationRole.ASSISTANT, response.getMessage(),
                    (int) (System.currentTimeMillis() - startMs));
            return response;
        }

        // 6) Build OpenAI messages with role-distinct system prompt + conversation history
        List<Map<String, String>> messages = new ArrayList<>();

        Map<String, String> sys = new HashMap<>();
        sys.put("role", "system");
        sys.put("content", buildSystemPrompt(userRole) + "\n\n--- CURRENT CONTEXT ---\n" + rag);
        messages.add(sys);

        // Load last N messages from conversation history
        List<ConversationMessage> history = conversationMessageRepository
                .findByConversationIdOrderByTimestampAsc(conversation.getId());
        int startIdx = Math.max(0, history.size() - MAX_HISTORY_MESSAGES - 1);
        for (int i = startIdx; i < history.size() - 1; i++) {
            ConversationMessage m = history.get(i);
            Map<String, String> msg = new HashMap<>();
            msg.put("role", m.getRole() == ConversationRole.USER ? "user" : "assistant");
            msg.put("content", m.getContent());
            messages.add(msg);
        }

        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", request.getMessage());
        messages.add(userMsg);

        // 7) Call OpenAI
        String model = System.getenv().getOrDefault("SMARTCAMPOST_AI_MODEL", "gpt-4o-mini");
        try {
            var responseMono = openAIClient.createChatCompletion(model, messages, 800, 0.25);
            String aiText = responseMono.block();
            if (aiText == null || aiText.isBlank()) {
                ChatResponse response = fallbackLocalResponse(request, sessionId, userRole);
                persistMessage(conversation, ConversationRole.ASSISTANT, response.getMessage(),
                        (int) (System.currentTimeMillis() - startMs));
                return response;
            }

            int processingMs = (int) (System.currentTimeMillis() - startMs);
            persistMessage(conversation, ConversationRole.ASSISTANT, aiText.trim(), processingMs);

            return ChatResponse.builder()
                    .message(aiText.trim())
                    .sessionId(sessionId)
                    .suggestions(generateSuggestionsForRole(userRole, request.getMessage()))
                    .intent("AI_ASSISTANT")
                    .confidence(0.85)
                    .build();
        } catch (Exception e) {
            log.error("AI chat failed: {}", e.getMessage());
            ChatResponse response = fallbackLocalResponse(request, sessionId, userRole);
            persistMessage(conversation, ConversationRole.ASSISTANT, response.getMessage(),
                    (int) (System.currentTimeMillis() - startMs));
            return response;
        }
    }

    // ==================== CONVERSATION PERSISTENCE ====================

    private Conversation resolveConversation(String sessionId, UUID userId, UserRole userRole) {
        if (userId != null) {
            try {
                UUID convId = UUID.fromString(sessionId);
                var existing = conversationRepository.findById(convId);
                if (existing.isPresent()) {
                    Conversation c = existing.get();
                    c.setLastMessageAt(Instant.now());
                    return conversationRepository.save(c);
                }
            } catch (IllegalArgumentException ignored) {
            }

            List<Conversation> active = conversationRepository.findByUserIdAndStatus(userId, ConversationStatus.ACTIVE);
            if (!active.isEmpty()) {
                Conversation c = active.get(0);
                c.setLastMessageAt(Instant.now());
                return conversationRepository.save(c);
            }
        }

        Conversation conv = Conversation.builder()
                .id(UUID.randomUUID())
                .userId(userId != null ? userId : UUID.randomUUID())
                .userType(userRole != null ? userRole : UserRole.CLIENT)
                .channel(ConversationChannel.WEB)
                .status(ConversationStatus.ACTIVE)
                .startedAt(Instant.now())
                .lastMessageAt(Instant.now())
                .build();
        return conversationRepository.save(conv);
    }

    private void persistMessage(Conversation conversation, ConversationRole role, String content, Integer processingTimeMs) {
        try {
            ConversationMessage msg = ConversationMessage.builder()
                    .id(UUID.randomUUID())
                    .conversation(conversation)
                    .role(role)
                    .content(content)
                    .timestamp(Instant.now())
                    .processingTimeMs(processingTimeMs)
                    .build();
            conversationMessageRepository.save(msg);
        } catch (Exception e) {
            log.warn("Failed to persist conversation message: {}", e.getMessage());
        }
    }

    // ==================== ROLE-DISTINCT SYSTEM PROMPTS ====================

    private String buildSystemPrompt(UserRole role) {
        String envPrompt = System.getenv("SMARTCAMPOST_AI_SYSTEM_PROMPT");
        if (envPrompt != null && !envPrompt.isBlank()) {
            return envPrompt;
        }

        String base = "You are SmartCAMPOST AI, the intelligent assistant for the SmartCAMPOST logistics platform (Cameroon Postal Services). " +
                "Always be helpful, concise, and accurate. Never hallucinate parcel statuses or make up data. " +
                "If you don't know something, say so and suggest contacting support.\n\n";

        if (role == null) {
            return base + "The user is not authenticated. Answer general questions about SmartCAMPOST services, pricing, agency locations, and how to create an account. " +
                    "Do not perform any actions or reveal internal system details.";
        }

        return switch (role) {
            case CLIENT -> base +
                    "You are assisting a CLIENT (parcel sender/receiver). Your scope:\n" +
                    "- Help track parcels, explain statuses, provide ETAs\n" +
                    "- Explain pricing, service types (Standard/Express), and payment methods (Mobile Money, cash, bank)\n" +
                    "- Guide through parcel creation, address management, and pickup scheduling\n" +
                    "- Help with support tickets, claims for lost/damaged parcels, and refund inquiries\n" +
                    "- Show only this client's own data — never reveal other users' parcels or account info\n" +
                    "- Suggest actions: 'Track parcel', 'Create shipment', 'View invoices', 'File support ticket'";

            case COURIER -> base +
                    "You are assisting a COURIER (delivery driver). Your scope:\n" +
                    "- Help with assigned deliveries, pickup instructions, and route optimization\n" +
                    "- Explain delivery confirmation process (OTP, signature, photo proof)\n" +
                    "- Advise on cash-on-delivery collection and payment reporting\n" +
                    "- Help report delivery issues (recipient absent, wrong address, damaged parcel)\n" +
                    "- Provide navigation tips for Cameroon cities\n" +
                    "- Suggest actions: 'Optimize route', 'View assignments', 'Update delivery status', 'Report issue'";

            case AGENT -> base +
                    "You are assisting an AGENT (agency operator). Your scope:\n" +
                    "- Help manage parcels at the agency (intake, validation, handoff to couriers)\n" +
                    "- Explain parcel validation workflow and QR code scanning\n" +
                    "- Help with courier assignment and pickup management\n" +
                    "- Provide congestion and performance insights for the agency\n" +
                    "- Suggest actions: 'View agency parcels', 'Assign courier', 'Validate parcel', 'Check congestion'";

            case STAFF -> base +
                    "You are assisting STAFF (operational support). Your scope:\n" +
                    "- Help with parcel management across agencies\n" +
                    "- Explain operational procedures and status transitions\n" +
                    "- Support ticket resolution and customer issue handling\n" +
                    "- Access analytics dashboards and generate reports\n" +
                    "- Suggest actions: 'Process parcels', 'View analytics', 'Manage support tickets', 'Check congestion alerts'";

            case ADMIN -> base +
                    "You are assisting an ADMIN (system administrator). You have full access. Your scope:\n" +
                    "- Answer any question about any entity in the system (parcels, users, agencies, payments, etc.)\n" +
                    "- Explain automation decisions made by AI agents (risk detection, route optimization, self-healing)\n" +
                    "- Help with user management, tariff configuration, agency setup, and compliance\n" +
                    "- Generate summaries and reports on system performance, revenue, and operations\n" +
                    "- Suggest actions: 'System analytics', 'Manage users', 'Configure tariffs', 'View AI decisions', 'Self-healing dashboard'";

            case FINANCE -> base +
                    "You are assisting a FINANCE user. Your scope:\n" +
                    "- Help with revenue analytics, payment reconciliation, and financial reporting\n" +
                    "- Explain tariff structures, pricing rules, and discount policies\n" +
                    "- Help manage invoices, refunds, and payment exceptions\n" +
                    "- Suggest actions: 'Revenue trends', 'Manage tariffs', 'View invoices', 'Export financial report'";

            case RISK -> base +
                    "You are assisting a RISK officer. Your scope:\n" +
                    "- Help with fraud detection, risk alerts, and compliance monitoring\n" +
                    "- Explain risk scoring algorithms and alert thresholds\n" +
                    "- Help investigate flagged accounts, suspicious transactions, and anomalies\n" +
                    "- Suggest actions: 'View active alerts', 'Compliance report', 'Investigate flagged account', 'Risk scoring rules'";

            default -> base + "Answer general questions about SmartCAMPOST services.";
        };
    }

    // ==================== RAG CONTEXT ====================

    private StringBuilder buildRagContext(UserRole userRole, UUID userId, ChatRequest request) {
        StringBuilder rag = new StringBuilder();
        if (userRole != null) rag.append("USER_ROLE: ").append(userRole.name()).append("\n");

        if (request.getContext() != null && !request.getContext().isBlank()) {
            var parcelOpt = parcelRepository.findByTrackingRef(request.getContext().trim());
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

        rag.append("NOTE: Do not disclose passwords, OTPs, or sensitive data.\n");
        return rag;
    }

    // ==================== FALLBACK + SUGGESTIONS ====================

    private ChatResponse fallbackLocalResponse(ChatRequest request, String sessionId, UserRole userRole) {
        String message = request.getMessage().toLowerCase();
        KnowledgeEntry bestMatch = null;
        for (Map.Entry<String, KnowledgeEntry> entry : KNOWLEDGE_BASE.entrySet()) {
            if (message.contains(entry.getKey())) {
                bestMatch = entry.getValue();
                break;
            }
        }

        if (bestMatch != null) {
            return ChatResponse.builder()
                    .message(bestMatch.response)
                    .sessionId(sessionId)
                    .suggestions(bestMatch.suggestions)
                    .intent(bestMatch.intent)
                    .confidence(0.85)
                    .build();
        }

        return ChatResponse.builder()
                .message("I'm not sure I understand. Could you rephrase your question? " +
                        (userRole != null ? "I'm here to help " + userRole.name().toLowerCase() + "s with " : "") +
                        "parcels, tracking, and deliveries.")
                .sessionId(sessionId)
                .suggestions(generateSuggestionsForRole(userRole, message))
                .intent("UNKNOWN")
                .confidence(0.3)
                .build();
    }

    private List<String> generateSuggestionsForRole(UserRole role, String context) {
        if (role == UserRole.CLIENT) return Arrays.asList("Track my parcel", "Create new shipment", "Check delivery rates", "View my invoices");
        if (role == UserRole.COURIER) return Arrays.asList("Show my assignments", "Optimize my route", "Update delivery status", "Payment collection tips");
        if (role == UserRole.AGENT) return Arrays.asList("Parcel inventory", "Staff management", "Generate agency report", "View congestion alerts");
        if (role == UserRole.ADMIN) return Arrays.asList("System analytics", "Manage user accounts", "Configure tariffs", "System health check");
        if (role == UserRole.STAFF) return Arrays.asList("Process parcels", "View deliveries", "Open support tickets", "Performance analytics");
        if (role == UserRole.FINANCE) return Arrays.asList("Revenue trends", "Manage tariffs", "View invoices", "Export financial report");
        if (role == UserRole.RISK) return Arrays.asList("Active alerts", "Fraud detection report", "Compliance audit", "Flagged accounts");
        return Arrays.asList("Track my parcel", "Pricing info", "Contact support");
    }

    @Override
    public DeliveryPredictionResponse predictDeliveryTime(DeliveryPredictionRequest request) {
        return trackingPredictionAgent.predict(request);
    }

    @Override
    public AgentStatusResponse getAgentStatus() {
        return monitoringAgent.getStatus();
    }

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
