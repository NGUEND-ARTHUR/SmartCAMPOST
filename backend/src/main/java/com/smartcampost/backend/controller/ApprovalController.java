package com.smartcampost.backend.controller;

import com.smartcampost.backend.approval.ApprovalRequest;
import com.smartcampost.backend.repository.ApprovalRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalRequestRepository approvalRequestRepository;

    @GetMapping("/pending")
    @PreAuthorize("hasAuthority('approval:review') or hasRole('ADMIN')")
    public List<ApprovalRequest> pending() {
        return approvalRequestRepository.findByProcessedFalse();
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAuthority('approval:review') or hasRole('ADMIN')")
    public ResponseEntity<?> approve(@PathVariable UUID id) {
        return approvalRequestRepository.findById(id).map(req -> {
            req.setApproved(true);
            req.setProcessed(true);
            req.setProcessedAt(Instant.now());
            approvalRequestRepository.save(req);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/deny")
    @PreAuthorize("hasAuthority('approval:review') or hasRole('ADMIN')")
    public ResponseEntity<?> deny(@PathVariable UUID id) {
        return approvalRequestRepository.findById(id).map(req -> {
            req.setApproved(false);
            req.setProcessed(true);
            req.setProcessedAt(Instant.now());
            approvalRequestRepository.save(req);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

}
