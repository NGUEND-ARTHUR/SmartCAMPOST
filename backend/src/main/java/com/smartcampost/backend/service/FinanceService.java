package com.smartcampost.backend.service;

import com.smartcampost.backend.model.enums.RefundStatus;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface FinanceService {
    Page<?> listRefunds(int page, int size);
    Object updateRefundStatus(UUID refundId, RefundStatus status);
}
