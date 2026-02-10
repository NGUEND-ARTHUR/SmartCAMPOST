package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.refund.RefundResponse;
import com.smartcampost.backend.model.enums.RefundStatus;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface FinanceService {
    Page<RefundResponse> listRefunds(int page, int size);
    RefundResponse updateRefundStatus(UUID refundId, RefundStatus status);
}
