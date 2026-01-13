package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.RefundAdjustment;
import com.smartcampost.backend.model.enums.RefundAdjustmentType;
import com.smartcampost.backend.model.enums.RefundStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RefundAdjustmentRepository extends JpaRepository<RefundAdjustment, UUID> {
    
    List<RefundAdjustment> findByPaymentId(UUID paymentId);
    
    List<RefundAdjustment> findByStatus(RefundStatus status);
    
    List<RefundAdjustment> findByType(RefundAdjustmentType type);
    
    List<RefundAdjustment> findByProcessedByStaffId(UUID staffId);
    
    List<RefundAdjustment> findByStatusAndType(RefundStatus status, RefundAdjustmentType type);
}
