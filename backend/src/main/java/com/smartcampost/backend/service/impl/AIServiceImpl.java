package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.ai.*;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionRequest;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionResponse;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.service.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
 

@Service
@RequiredArgsConstructor
@Slf4j
public class AIServiceImpl implements AIService {

    private final com.smartcampost.backend.service.impl.client.OpenAIClient openAIClient;
    private final com.smartcampost.backend.repository.UserAccountRepository userAccountRepository;
    private final com.smartcampost.backend.repository.ParcelRepository parcelRepository;
    private final com.smartcampost.backend.repository.CourierRepository courierRepository;
    private final com.smartcampost.backend.repository.AgencyRepository agencyRepository;
    private final com.smartcampost.backend.repository.AiAgentRecommendationRepository aiAgentRecommendationRepository;

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

        // ========== UNIVERSAL ==========
        KNOWLEDGE_BASE.put("help", new KnowledgeEntry(
                "SUPPORT",
                "ℹ️ I can assist you with:\n- 📦 Tracking parcels\n- 💰 Pricing & payments\n- 🚚 Delivery information\n- 📍 Agency locations\n- 🛣️ Route optimization\n- 📋 Account management\n\nWhat do you need?",
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
                "📞 **Contact Us**:\n- **Phone**: +237 6XX XXX XXX\n- **Email**: support@smartcampost.cm\n- **WhatsApp**: +237 6XX XXX XXX\n- **Agencies**: Find locations in map view\n- **In-app**: File tickets in dashboard\n\nResponse time: 2-4 hours",
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
        log.info("Optimizing route for {} stops", request.getStops().size());

        List<RouteOptimizationRequest.Stop> stops = request.getStops();
        if (stops == null || stops.isEmpty()) {
            return RouteOptimizationResponse.builder()
                    .optimizedRoute(Collections.emptyList())
                    .totalDistanceKm(0.0)
                    .estimatedDurationMinutes(0L)
                    .fuelSavingsPercent(0.0)
                    .optimizationStrategy(request.getOptimizationStrategy())
                    .build();
        }

        // existing route optimization code unchanged (omitted for brevity in patch)
        // fallback to existing algorithm already present in file
        
        // For brevity reuse previous implementation by calling existing helper methods
        double currentLat = request.getCourierLat() != null ? request.getCourierLat() :
            stops.stream().findFirst().map(s -> s.getLatitude())
                .orElseThrow(() -> new IllegalStateException("stops cannot be empty"));
        double currentLng = request.getCourierLng() != null ? request.getCourierLng() :
            stops.stream().findFirst().map(s -> s.getLongitude())
                .orElseThrow(() -> new IllegalStateException("stops cannot be empty"));

        List<RouteOptimizationResponse.OptimizedStop> optimizedRoute = new ArrayList<>();
        List<RouteOptimizationRequest.Stop> remaining = new ArrayList<>(stops);
        double totalDistance = 0;
        long totalMinutes = 0;
        LocalDateTime currentTime = LocalDateTime.now();

        int order = 1;
        while (!remaining.isEmpty()) {
            int nearestIndex = 0;
            double nearestScore = Double.MAX_VALUE;
            for (int i = 0; i < remaining.size(); i++) {
                RouteOptimizationRequest.Stop stop = remaining.get(i);
                double distance = calculateDistance(currentLat, currentLng, stop.getLatitude(), stop.getLongitude());
                double score = distance;
                if ("BALANCED".equals(request.getOptimizationStrategy()) && stop.getPriority() != null) {
                    score = distance / (1 + stop.getPriority() * 0.2);
                }
                if (score < nearestScore) {
                    nearestScore = score;
                    nearestIndex = i;
                }
            }

            RouteOptimizationRequest.Stop nearest = remaining.remove(nearestIndex);
            double distance = calculateDistance(currentLat, currentLng, nearest.getLatitude(), nearest.getLongitude());
            long etaMinutes = (long) ((distance / 30.0) * 60);

            currentTime = currentTime.plusMinutes(etaMinutes);
            totalDistance += distance;
            totalMinutes += etaMinutes;

            optimizedRoute.add(RouteOptimizationResponse.OptimizedStop.builder()
                    .id(nearest.getId())
                    .order(order++)
                    .type(nearest.getType())
                    .latitude(nearest.getLatitude())
                    .longitude(nearest.getLongitude())
                    .address(nearest.getAddress())
                    .distanceFromPrevious(Math.round(distance * 100.0) / 100.0)
                    .etaMinutes(etaMinutes)
                    .arrivalTime(currentTime.format(DateTimeFormatter.ofPattern("HH:mm")))
                    .build());

            currentLat = nearest.getLatitude();
            currentLng = nearest.getLongitude();
        }

        double originalDistance = calculateOriginalRouteDistance(request.getCourierLat(), request.getCourierLng(), stops);
        double savings = originalDistance > 0 ? ((originalDistance - totalDistance) / originalDistance) * 100 : 0;

        return RouteOptimizationResponse.builder()
                .optimizedRoute(optimizedRoute)
                .totalDistanceKm(Math.round(totalDistance * 100.0) / 100.0)
                .estimatedDurationMinutes(totalMinutes)
                .fuelSavingsPercent(Math.max(0, Math.round(savings * 10.0) / 10.0))
                .optimizationStrategy(request.getOptimizationStrategy() != null ? request.getOptimizationStrategy() : "SHORTEST")
                .build();
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
        try {
            String apiKey = System.getenv("OPENAI_API_KEY");
            if (apiKey == null || apiKey.isBlank()) {
                return fallbackLocalResponse(request, sessionId, userRole, userPhone);
            }
        } catch (Exception ignored) {
            return fallbackLocalResponse(request, sessionId, userRole, userPhone);
        }

        // Build messages for OpenAI
        java.util.ArrayList<Map<String, String>> messages = new java.util.ArrayList<>();
        // System prompt from environment or application property
        String systemPrompt = System.getenv("SMARTCAMPOST_AI_SYSTEM_PROMPT");
        if (systemPrompt == null || systemPrompt.isBlank()) {
            systemPrompt = "You are SmartCAMPOST AI, the intelligent assistant of Cameroon Postal Services. "
                    + "Be concise, accurate, friendly, and professional. Provide personalized help based on user role. "
                    + "If data is missing, ask clarifying questions. Never hallucinate parcel statuses. "
                    + (userRole != null ? "The user is a " + userRole.name() + ". Customize your advice accordingly." : "");
        }

        Map<String, String> sys = new HashMap<>();
        sys.put("role", "system");
        sys.put("content", systemPrompt);
        messages.add(sys);

        Map<String, String> ctxMsg = new HashMap<>();
        ctxMsg.put("role", "system");
        ctxMsg.put("content", "CONTEXT:\n" + rag.toString());
        messages.add(ctxMsg);

        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", request.getMessage());
        messages.add(userMsg);

        // Call OpenAI client (model and params tuned for cost control)
        String model = System.getenv().getOrDefault("SMARTCAMPOST_AI_MODEL", "gpt-4o-mini");
        int maxTokens = 300;
        double temperature = 0.2;

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
                    "View my addresses"
            ));
        } else if (role == UserRole.COURIER) {
            suggestions.addAll(Arrays.asList(
                    "Show my assignments",
                    "Optimize my route",
                    "Update delivery status"
            ));
        } else if (role == UserRole.AGENT || role == UserRole.ADMIN || role == UserRole.STAFF) {
            suggestions.addAll(Arrays.asList(
                    "Parcel inventory",
                    "Staff management",
                    "Generate reports"
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
        // Calculate base prediction based on distance and service type
        double distance = calculateDistance(
                request.getOriginLat(), request.getOriginLng(),
                request.getDestinationLat(), request.getDestinationLng()
        );

        // Base hours = distance / 50 km/h average for logistics
        double baseHours = distance / 50;
        
        // Adjust for service type
        String serviceType = request.getServiceType() != null ? request.getServiceType() : "STANDARD";
        double multiplier = "EXPRESS".equals(serviceType) ? 0.5 : 1.0;
        
        // Add handling time (2-4 hours for processing)
        double totalHours = (baseHours * multiplier) + 3;
        
        // Convert to days for display (8-hour work days)
        int estimatedDays = (int) Math.ceil(totalHours / 8);
        
        // Confidence decreases with distance
        double confidence = Math.max(0.6, 1.0 - (distance / 1000) * 0.1);

        LocalDateTime estimatedDelivery = LocalDateTime.now().plusDays(estimatedDays);

        return DeliveryPredictionResponse.builder()
                .estimatedDeliveryDate(estimatedDelivery.toLocalDate().toString())
                .estimatedDeliveryTime(estimatedDelivery.format(DateTimeFormatter.ofPattern("HH:mm")))
                .confidenceScore(Math.round(confidence * 100) / 100.0)
                .factors(Arrays.asList(
                        "Distance: " + Math.round(distance) + " km",
                        "Service: " + serviceType,
                        "Current load: Normal"
                ))
                .build();
    }

    // Haversine distance calculation - using Double wrapper to allow null checks
    private double calculateDistance(Double lat1, Double lng1, Double lat2, Double lng2) {
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
            return 0;
        }
        
        final double R = 6371; // Earth's radius in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private double calculateOriginalRouteDistance(Double startLat, Double startLng, List<RouteOptimizationRequest.Stop> stops) {
        if (stops == null || stops.isEmpty()) return 0;
        
        double total = 0;
        double currentLat = startLat != null ? startLat :
            stops.stream().findFirst().map(s -> s.getLatitude())
                .orElseThrow(() -> new IllegalStateException("stops cannot be empty"));
        double currentLng = startLng != null ? startLng :
            stops.stream().findFirst().map(s -> s.getLongitude())
                .orElseThrow(() -> new IllegalStateException("stops cannot be empty"));
        
        for (RouteOptimizationRequest.Stop stop : stops) {
            total += calculateDistance(currentLat, currentLng, stop.getLatitude(), stop.getLongitude());
            currentLat = stop.getLatitude();
            currentLng = stop.getLongitude();
        }
        
        return total;
    }

    @Override
    public AgentStatusResponse getAgentStatus() {
        log.info("Fetching agent status for authenticated user");

        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return AgentStatusResponse.builder()
                        .role("GUEST")
                        .agentHealth("OFFLINE")
                        .summary("No authenticated user")
                        .recommendations(Collections.emptyList())
                        .build();
            }

            String subject = auth.getName();
            UUID userId;
            try {
                userId = UUID.fromString(subject);
            } catch (IllegalArgumentException ex) {
                return AgentStatusResponse.builder()
                        .role("GUEST")
                        .agentHealth("OFFLINE")
                        .summary("Invalid user ID")
                        .recommendations(Collections.emptyList())
                        .build();
            }

            var userOpt = userAccountRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return AgentStatusResponse.builder()
                        .role("GUEST")
                        .agentHealth("OFFLINE")
                        .summary("User not found")
                        .recommendations(Collections.emptyList())
                        .build();
            }

            var user = userOpt.get();
            UserRole userRole = user.getRole();
            List<AgentStatusResponse.RecommendationItem> recommendations = new ArrayList<>();

            // Generate role-specific recommendations
            if (userRole == UserRole.CLIENT) {
                recommendations.add(AgentStatusResponse.RecommendationItem.builder()
                        .title("Client Features Ready")
                        .description("Track parcels, create shipments, and manage your addresses")
                        .priority("MEDIUM")
                        .actionType("INFO")
                        .createdAt(System.currentTimeMillis())
                        .build());
            } else if (userRole == UserRole.COURIER) {
                recommendations.add(AgentStatusResponse.RecommendationItem.builder()
                        .title("Courier Dashboard Ready")
                        .description("View assignments and optimize your delivery routes")
                        .priority("MEDIUM")
                        .actionType("INFO")
                        .createdAt(System.currentTimeMillis())
                        .build());
            } else if (userRole == UserRole.AGENT || userRole == UserRole.ADMIN || userRole == UserRole.STAFF) {
                recommendations.add(AgentStatusResponse.RecommendationItem.builder()
                        .title("Admin Tools Available")
                        .description("Manage operations, view analytics, and generate reports")
                        .priority("MEDIUM")
                        .actionType("INFO")
                        .createdAt(System.currentTimeMillis())
                        .build());
            }

            return AgentStatusResponse.builder()
                    .role(userRole.toString())
                    .agentHealth("HEALTHY")
                    .summary("AI Agents are operational and " + (recommendations.isEmpty() ? "no active recommendations" : "have " + recommendations.size() + " recommendation(s)"))
                    .recommendations(recommendations)
                    .lastActivityAt(System.currentTimeMillis())
                    .build();

        } catch (Exception ex) {
            log.error("Error getting agent status: {}", ex.getMessage());
            return AgentStatusResponse.builder()
                    .role("UNKNOWN")
                    .agentHealth("DEGRADED")
                    .summary("Error retrieving agent status: " + ex.getMessage())
                    .recommendations(Collections.emptyList())
                    .build();
        }
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
