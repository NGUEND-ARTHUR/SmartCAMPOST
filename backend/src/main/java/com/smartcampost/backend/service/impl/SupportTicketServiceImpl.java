package com.smartcampost.backend.service.impl;

import com.smartcampost.backend.dto.ticket.CreateTicketRequest;
import com.smartcampost.backend.dto.ticket.TicketReplyRequest;
import com.smartcampost.backend.dto.ticket.TicketResponse;
import com.smartcampost.backend.dto.ticket.UpdateTicketStatusRequest;
import com.smartcampost.backend.exception.AuthException;
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

        UserAccount user = getCurrentUserAccount();
        if (user.getRole() != UserRole.CLIENT) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Only clients can open support tickets");
        }

        Client client = clientRepository.findById(user.getEntityId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client not found",
                        ErrorCode.AUTH_USER_NOT_FOUND
                ));

        SupportTicket ticket = SupportTicket.builder()
                .id(UUID.randomUUID())
                .client(client)
                .subject(request.getSubject())
                .message(request.getMessage())
                .category(request.getCategory())
                .status(TicketStatus.OPEN)
                .createdAt(Instant.now())
                .build();

        supportTicketRepository.save(ticket);

        return toResponse(ticket);
    }

    // ================== GET BY ID ==================
    @Override
    public TicketResponse getTicketById(UUID ticketId) {
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
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Current user is not a client");
        }

        Client client = clientRepository.findById(user.getEntityId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Client not found",
                        ErrorCode.AUTH_USER_NOT_FOUND
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
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Not allowed to list all tickets");
        }

        return supportTicketRepository.findAll(PageRequest.of(page, size))
                .map(this::toResponse);
    }

    // ================== REPLY ==================
    @Override
    public TicketResponse replyToTicket(UUID ticketId, TicketReplyRequest request) {
        UserAccount user = getCurrentUserAccount();
        if (user.getRole() == UserRole.CLIENT || user.getRole() == UserRole.COURIER) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Not allowed to reply to tickets");
        }

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ticket not found",
                        ErrorCode.TICKET_NOT_FOUND
                ));

        // Simple approach: append reply text to message body
        String existing = ticket.getMessage() != null ? ticket.getMessage() : "";
        String replyBlock = "\n\n[REPLY] " + request.getReplyMessage();
        ticket.setMessage(existing + replyBlock);

        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        ticket.setUpdatedAt(Instant.now());

        supportTicketRepository.save(ticket);

        return toResponse(ticket);
    }

    // ================== UPDATE STATUS ==================
    @Override
    public TicketResponse updateTicketStatus(UUID ticketId, UpdateTicketStatusRequest request) {
        UserAccount user = getCurrentUserAccount();
        if (user.getRole() == UserRole.CLIENT || user.getRole() == UserRole.COURIER) {
            throw new AuthException(ErrorCode.BUSINESS_ERROR, "Not allowed to change ticket status");
        }

        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ticket not found",
                        ErrorCode.TICKET_NOT_FOUND
                ));

        ticket.setStatus(request.getStatus());
        ticket.setUpdatedAt(Instant.now());

        supportTicketRepository.save(ticket);

        return toResponse(ticket);
    }

    // ================== ACCESS CONTROL ==================
    private void enforceAccess(SupportTicket ticket) {
        UserAccount user = getCurrentUserAccount();

        if (user.getRole() == UserRole.CLIENT) {
            if (ticket.getClient() == null
                    || !ticket.getClient().getId().equals(user.getEntityId())) {
                throw new AuthException(ErrorCode.BUSINESS_ERROR, "You cannot access this ticket");
            }
        }
        // STAFF / AGENT / ADMIN : OK
        // COURIER : by design, no tickets – but we could block explicitly if needed
    }

    // ================== CURRENT USER ==================
    private UserAccount getCurrentUserAccount() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(ErrorCode.AUTH_INVALID_CREDENTIALS, "Unauthenticated");
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
