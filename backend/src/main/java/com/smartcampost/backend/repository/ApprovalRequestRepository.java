package com.smartcampost.backend.repository;

import com.smartcampost.backend.approval.ApprovalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, UUID> {
    List<ApprovalRequest> findByProcessedFalse();
    List<ApprovalRequest> findByProcessedTrueAndHandledFalse();
}
