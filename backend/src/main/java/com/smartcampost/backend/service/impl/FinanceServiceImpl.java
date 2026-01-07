package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Refund;
import com.smartcampost.backend.model.enums.RefundStatus;
import com.smartcampost.backend.repository.RefundRepository;
import com.smartcampost.backend.service.FinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FinanceServiceImpl implements FinanceService {

    private final RefundRepository refundRepository;

    @Override
    public Page<?> listRefunds(int page, int size) {
        return refundRepository.findAll(PageRequest.of(page, size));
    }

    @Override
    public Object updateRefundStatus(UUID refundId, RefundStatus status) {
        Refund refund = refundRepository.findById(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund not found", ErrorCode.REFUND_NOT_FOUND));

        refund.setStatus(status);
        refundRepository.save(refund);

        return refund;
    }
}
