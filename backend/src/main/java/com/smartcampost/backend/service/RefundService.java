package com.smartcampost.backend.service;
import com.smartcampost.backend.dto.refund.*;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.UUID;

public interface RefundService {

    RefundResponse createRefund(CreateRefundRequest request);

    RefundResponse updateRefundStatus(UUID refundId, UpdateRefundStatusRequest request);

    RefundResponse getRefundById(UUID refundId);

    List<RefundResponse> getRefundsForPayment(UUID paymentId);

    Page<RefundResponse> listAllRefunds(int page, int size);
}