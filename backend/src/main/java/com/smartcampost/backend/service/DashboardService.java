package com.smartcampost.backend.service;
import com.smartcampost.backend.dto.dashboard.DashboardSummaryResponse;

public interface DashboardService {

    DashboardSummaryResponse getSummary();
}