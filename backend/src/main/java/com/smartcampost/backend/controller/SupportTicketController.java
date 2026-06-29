package com.smartcampost.backend.controller;
import com.smartcampost.backend.dto.ticket.*;
import com.smartcampost.backend.service.SupportTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/support/tickets")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class SupportTicketController {

    private final SupportTicketService supportTicketService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENT','AGENT','COURIER')")
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request
    ) {
        return ResponseEntity.ok(supportTicketService.createTicket(request));
    }

    @GetMapping("/{ticketId}")
    public ResponseEntity<TicketResponse> getTicket(@PathVariable UUID ticketId) {
        return ResponseEntity.ok(supportTicketService.getTicketById(ticketId));
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CLIENT','AGENT','COURIER')")
    public ResponseEntity<Page<TicketResponse>> listMyTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(supportTicketService.listMyTickets(page, size));
    }

    @GetMapping
    @PreAuthorize("!hasAnyRole('CLIENT','COURIER')")
    public ResponseEntity<Page<TicketResponse>> listAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(supportTicketService.listAllTickets(page, size));
    }

    @PostMapping("/{ticketId}/reply")
    @PreAuthorize("!hasAnyRole('CLIENT','COURIER')")
    public ResponseEntity<TicketResponse> replyToTicket(
            @PathVariable UUID ticketId,
            @Valid @RequestBody TicketReplyRequest request
    ) {
        return ResponseEntity.ok(supportTicketService.replyToTicket(ticketId, request));
    }

    @PatchMapping("/{ticketId}/status")
    @PreAuthorize("!hasAnyRole('CLIENT','COURIER')")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable UUID ticketId,
            @Valid @RequestBody UpdateTicketStatusRequest request
    ) {
        return ResponseEntity.ok(supportTicketService.updateTicketStatus(ticketId, request));
    }
}