package com.smartcampost.backend.service;
import com.smartcampost.backend.dto.analytics.*;

import java.util.UUID;

public interface AnalyticsService {

    EtaPredictionResponse predictEtaForParcel(UUID parcelId);

    AnomalyCheckResponse checkPaymentAnomaly(UUID paymentId);

    DemandForecastResponse forecastDemand(DemandForecastRequest request);

    SentimentAnalysisResponse analyzeSentiment();

    SmartNotificationResponse getSmartNotifications();

    AddressValidationResponse validateAddress(AddressValidationRequest request);
}