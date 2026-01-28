package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.ai.*;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionRequest;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionResponse;
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

    // Knowledge base fallback for local responses when AI key not configured
    private static final Map<String, KnowledgeEntry> KNOWLEDGE_BASE = new HashMap<>();

    static {
        // Tracking
        KNOWLEDGE_BASE.put("track", new KnowledgeEntry(
                "TRACKING",
                "To track your parcel:\n1. Go to 'My Parcels' in your dashboard\n2. Click on the parcel to see its status\n3. View the live map showing its journey\n\nYou can also enter your tracking code on the home page.",
                Arrays.asList("Where is my parcel?", "How do I change delivery address?")
        ));

        // Pricing
        KNOWLEDGE_BASE.put("price", new KnowledgeEntry(
                "PRICING",
                "Our pricing is based on:\n- Weight: Charged per kg\n- Distance: Based on origin and destination\n- Service Type: Standard (3-5 days) or Express (1-2 days)\n\nCreate a new parcel for an instant quote.",
                Arrays.asList("Do you offer discounts?", "Is insurance included?")
        ));

        // Delivery
        KNOWLEDGE_BASE.put("delivery", new KnowledgeEntry(
                "DELIVERY",
                "Delivery times:\n- Standard: 3-5 business days\n- Express: 1-2 business days\n\nTrack your parcel in real-time on our map.",
                Arrays.asList("Can I schedule delivery time?", "Do you deliver on weekends?")
        ));

        // Payment
        KNOWLEDGE_BASE.put("payment", new KnowledgeEntry(
                "PAYMENT",
                "We accept:\n- Mobile Money (Orange, MTN)\n- Bank Transfer\n- Cash at agencies\n\nPayment is required before pickup.",
                Arrays.asList("Can I pay on delivery?", "How do I get a receipt?")
        ));

        // Pickup
        KNOWLEDGE_BASE.put("pickup", new KnowledgeEntry(
                "PICKUP",
                "For pickup:\n1. Create your parcel\n2. Choose a date and time slot\n3. Our courier will collect your package\n\nYou'll receive SMS notifications.",
                Arrays.asList("What if I miss the pickup?", "Can someone else give the parcel?")
        ));

        // Support
        KNOWLEDGE_BASE.put("help", new KnowledgeEntry(
                "SUPPORT",
                "I can help with:\n- 📦 Tracking parcels\n- 💰 Pricing & payments\n- 🚚 Delivery info\n- 📍 Agency locations\n\nWhat do you need help with?",
                Arrays.asList("Track my parcel", "Find an agency", "Contact support")
        ));

        // Greeting
        KNOWLEDGE_BASE.put("hello", new KnowledgeEntry(
                "GREETING",
                "Hello! 👋 Welcome to SmartCAMPOST!\n\nI'm your AI assistant. How can I help you today?",
                Arrays.asList("Track my parcel", "What are your prices?", "Find an agency")
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
        double currentLat = request.getCourierLat() != null ? request.getCourierLat() : stops.get(0).getLatitude();
        double currentLng = request.getCourierLng() != null ? request.getCourierLng() : stops.get(0).getLongitude();

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

        // 1) If user is authenticated, inject user role and phone
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                String subject = auth.getName();
                try {
                    java.util.UUID userId = java.util.UUID.fromString(subject);
                    var userOpt = userAccountRepository.findById(userId);
                    if (userOpt.isPresent()) {
                        var user = userOpt.get();
                        rag.append("USER_ROLE: ").append(user.getRole()).append("\n");
                        rag.append("USER_PHONE: ").append(user.getPhone()).append("\n");
                    }
                } catch (IllegalArgumentException ex) {
                    var userOpt = userAccountRepository.findByPhone(subject);
                    userOpt.ifPresent(user -> {
                        rag.append("USER_ROLE: ").append(user.getRole()).append("\n");
                        rag.append("USER_PHONE: ").append(user.getPhone()).append("\n");
                    });
                }
            }
        } catch (Exception e) {
            log.debug("No authenticated user found for RAG: {}", e.getMessage());
        }

        // 2) If request contains a tracking context, fetch parcel
        if (request.getContext() != null && !request.getContext().isBlank()) {
            String ctx = request.getContext().trim();
            parcelRepository.findByTrackingRef(ctx).ifPresent(parcel -> {
                rag.append("PARCEL: ").append(parcel.getTrackingRef()).append("\n");
                rag.append("STATUS: ").append(parcel.getStatus()).append("\n");
                if (parcel.getExpectedDeliveryAt() != null) {
                    rag.append("EXPECTED_DELIVERY: ").append(parcel.getExpectedDeliveryAt()).append("\n");
                }
                if (parcel.getDestinationAgency() != null) {
                    rag.append("DESTINATION_AGENCY: ").append(parcel.getDestinationAgency().getAgencyName()).append("\n");
                }
            });
        }

        // 3) Add explicit instruction about privacy
        rag.append("NOTE: Do not disclose passwords, OTPs, or other users' private data. Only include allowed fields.");

        // If OpenAI key not configured, fallback to local KB
        try {
            String apiKey = System.getenv("OPENAI_API_KEY");
            if (apiKey == null || apiKey.isBlank()) {
                // Fallback: reuse basic keyword matching
                return fallbackLocalResponse(request, sessionId);
            }
        } catch (Exception ignored) {
            return fallbackLocalResponse(request, sessionId);
        }

        // Build messages for OpenAI
        java.util.ArrayList<Map<String, String>> messages = new java.util.ArrayList<>();
        // System prompt from environment or application property
        String systemPrompt = System.getenv("SMARTCAMPOST_AI_SYSTEM_PROMPT");
        if (systemPrompt == null || systemPrompt.isBlank()) {
            systemPrompt = "You are SmartCAMPOST AI, the official intelligent assistant of Cameroon Postal Services. Be concise, accurate, friendly, and professional. If data is missing, ask clarifying questions. Never hallucinate parcel statuses or user data.";
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
                return fallbackLocalResponse(request, sessionId);
            }

            // Build ChatResponse
            return ChatResponse.builder()
                    .message(aiText.trim())
                    .sessionId(sessionId)
                    .suggestions(java.util.Arrays.asList("Track my parcel", "Pricing info", "Contact support"))
                    .intent("AI_ASSISTANT")
                    .confidence(0.75)
                    .build();
        } catch (Exception e) {
            log.error("AI chat failed: {}", e.getMessage());
            return fallbackLocalResponse(request, sessionId);
        }
    }

    private ChatResponse fallbackLocalResponse(ChatRequest request, String sessionId) {
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
                .message("I'm not sure I understand. Try sharing a tracking code or ask 'How much does shipping cost?'")
                .sessionId(sessionId)
                .suggestions(java.util.Arrays.asList("Track my parcel", "Pricing info", "Contact support"))
                .intent("UNKNOWN")
                .confidence(0.3)
                .build();
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
        double currentLat = startLat != null ? startLat : stops.get(0).getLatitude();
        double currentLng = startLng != null ? startLng : stops.get(0).getLongitude();
        
        for (RouteOptimizationRequest.Stop stop : stops) {
            total += calculateDistance(currentLat, currentLng, stop.getLatitude(), stop.getLongitude());
            currentLat = stop.getLatitude();
            currentLng = stop.getLongitude();
        }
        
        return total;
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
