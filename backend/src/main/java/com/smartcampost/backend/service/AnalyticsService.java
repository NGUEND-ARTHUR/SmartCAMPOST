package com.smartcampost.backend.service;
import com.smartcampost.backend.dto.analytics.AnomalyCheckResponse;
import com.smartcampost.backend.dto.analytics.EtaPredictionResponse;

import java.util.UUID;

public interface AnalyticsService {

    EtaPredictionResponse predictEtaForParcel(UUID parcelId);

    AnomalyCheckResponse checkPaymentAnomaly(UUID paymentId);
}