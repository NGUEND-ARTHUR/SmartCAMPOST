package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.ticket.CreateTicketRequest;
import com.smartcampost.backend.dto.ticket.TicketReplyRequest;
import com.smartcampost.backend.dto.ticket.TicketResponse;
import com.smartcampost.backend.dto.ticket.UpdateTicketStatusRequest;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ConflictException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Client;
import com.smartcampost.backend.model.SupportTicket;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.TicketStatus;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.ClientRepository;
import com.smartcampost.backend.repository.SupportTicketRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import com.smartcampost.backend.service.SupportTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupportTicketServiceImpl implements SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final ClientRepository clientRepository;
    private final UserAccountRepository userAccountRepository;

    // ================== CREATE ==================
    @Override
    public TicketResponse createTicket(CreateTicketRequest request) {

                Objects.requireNonNull(request, "request is required");

                UserAccount user = getCurrentUserAccount();
        if (user.getRole() != UserRole.CLIENT) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "Only clients can open support tickets");
        }

        UUID clientId = Objects.requireNonNull(user.getEntityId(), "user.entityId is required");
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client not found",
                        ErrorCode.CLIENT_NOT_FOUND
                ));

        // 🔥 Simple business rule: avoid multiple active tickets for same client
        Page<SupportTicket> existingTickets = supportTicketRepository
                .findByClient(client, PageRequest.of(0, 50));

        boolean hasActiveTicket = existingTickets
                .stream()
                .anyMatch(t -> t.getStatus() == TicketStatus.OPEN
                        || t.getStatus() == TicketStatus.IN_PROGRESS);

        if (hasActiveTicket) {
            throw new ConflictException(
                    "You already have an active support ticket",
                    ErrorCode.TICKET_CONFLICT
            );
        }

        SupportTicket ticket = SupportTicket.builder()
                .id(UUID.randomUUID())
                .client(client)
                .subject(request.getSubject())
                .message(request.getMessage())
                .category(request.getCategory())
                .status(TicketStatus.OPEN)
                .createdAt(Instant.now())
                .build();

        SupportTicket saved = supportTicketRepository.save(ticket);
        if (saved == null) throw new IllegalStateException("failed to save support ticket");
        return toResponse(saved);
    }

    // ================== GET BY ID ==================
    @Override
    public TicketResponse getTicketById(UUID ticketId) {
        Objects.requireNonNull(ticketId, "ticketId is required");
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ticket not found",
                        ErrorCode.TICKET_NOT_FOUND
                ));

        enforceAccess(ticket);

        return toResponse(ticket);
    }

    // ================== LIST MY TICKETS (CLIENT) ==================
    @Override
    public Page<TicketResponse> listMyTickets(int page, int size) {
        UserAccount user = getCurrentUserAccount();

        if (user.getRole() != UserRole.CLIENT) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "Current user is not a client");
        }

        UUID clientId = Objects.requireNonNull(user.getEntityId(), "user.entityId is required");
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client not found",
                        ErrorCode.CLIENT_NOT_FOUND
                ));

        return supportTicketRepository
                .findByClient(client, PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ================== LIST ALL (ADMIN / STAFF / AGENT) ==================
    @Override
    public Page<TicketResponse> listAllTickets(int page, int size) {
        UserAccount user = getCurrentUserAccount();

        if (user.getRole() == UserRole.CLIENT || user.getRole() == UserRole.COURIER) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "Not allowed to list all tickets");
        }

        return supportTicketRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ================== REPLY ==================
    @Override
    public TicketResponse replyToTicket(UUID ticketId, TicketReplyRequest request) {
                Objects.requireNonNull(ticketId, "ticketId is required");
                Objects.requireNonNull(request, "request is required");

                UserAccount user = getCurrentUserAccount();

        if (user.getRole() == UserRole.CLIENT || user.getRole() == UserRole.COURIER) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "Not allowed to reply to tickets");
        }

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ticket not found",
                        ErrorCode.TICKET_NOT_FOUND
                ));

        // Reply logic
        String existing = ticket.getMessage() != null ? ticket.getMessage() : "";
        String replyBlock = "\n\n[REPLY] " + request.getReplyMessage();
        ticket.setMessage(existing + replyBlock);

        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }

        ticket.setUpdatedAt(Instant.now());
        SupportTicket saved = supportTicketRepository.save(ticket);
        if (saved == null) throw new IllegalStateException("failed to save support ticket");
        return toResponse(saved);
    }

    // ================== UPDATE STATUS ==================
    @Override
    public TicketResponse updateTicketStatus(UUID ticketId, UpdateTicketStatusRequest request) {
                Objects.requireNonNull(ticketId, "ticketId is required");
                Objects.requireNonNull(request, "request is required");

                UserAccount user = getCurrentUserAccount();

        if (user.getRole() == UserRole.CLIENT || user.getRole() == UserRole.COURIER) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "Not allowed to change ticket status");
        }

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ticket not found",
                        ErrorCode.TICKET_NOT_FOUND
                ));

        // 🔥 Validation – TICKET_STATUS_INVALID
        if (request.getStatus() == null) {
            throw new ConflictException(
                    "Ticket status is required",
                    ErrorCode.TICKET_STATUS_INVALID
            );
        }

        if (ticket.getStatus() == request.getStatus()) {
            throw new ConflictException(
                    "Ticket is already in this status",
                    ErrorCode.TICKET_STATUS_INVALID
            );
        }

        ticket.setStatus(request.getStatus());
        ticket.setUpdatedAt(Instant.now());

        SupportTicket saved = supportTicketRepository.save(ticket);
        if (saved == null) throw new IllegalStateException("failed to save support ticket");
        return toResponse(saved);
    }

    // ================== ACCESS CONTROL ==================
    private void enforceAccess(SupportTicket ticket) {
                Objects.requireNonNull(ticket, "ticket is required");
                UserAccount user = getCurrentUserAccount();

                UUID uid = Objects.requireNonNull(user.getEntityId(), "user.entityId is required");
                if (user.getRole() == UserRole.CLIENT) {
                                if (ticket.getClient() == null ||
                                                !Objects.equals(ticket.getClient().getId(), uid)) {

                throw new AuthException(
                        ErrorCode.AUTH_FORBIDDEN,
                        "You cannot access this ticket"
                );
            }
        }
    }

    // ================== CURRENT USER ==================
    private UserAccount getCurrentUserAccount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthenticated");
        }

        String subject = auth.getName();

        try {
            UUID userId = UUID.fromString(subject);
            return userAccountRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found",
                            ErrorCode.AUTH_USER_NOT_FOUND
                    ));
        } catch (IllegalArgumentException ex) {
            return userAccountRepository.findByPhone(subject)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found",
                            ErrorCode.AUTH_USER_NOT_FOUND
                    ));
        }
    }

    // ================== MAPPER ==================
    private TicketResponse toResponse(SupportTicket ticket) {
        Client client = ticket.getClient();

        return TicketResponse.builder()
                .id(ticket.getId())
                .clientId(client != null ? client.getId() : null)
                .clientName(client != null ? client.getFullName() : null)
                .subject(ticket.getSubject())
                .message(ticket.getMessage())
                .category(ticket.getCategory())
                .status(ticket.getStatus())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
