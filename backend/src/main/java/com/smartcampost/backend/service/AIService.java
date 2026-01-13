package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.ai.*;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionRequest;
import com.smartcampost.backend.dto.analytics.DeliveryPredictionResponse;

public interface AIService {

    /**
     * Optimize delivery route for a courier
     */
    RouteOptimizationResponse optimizeRoute(RouteOptimizationRequest request);

    /**
     * Process chatbot message and return AI response
     */
    ChatResponse processChat(ChatRequest request);

    /**
     * Predict delivery time based on various factors
     */
    DeliveryPredictionResponse predictDeliveryTime(DeliveryPredictionRequest request);
}
