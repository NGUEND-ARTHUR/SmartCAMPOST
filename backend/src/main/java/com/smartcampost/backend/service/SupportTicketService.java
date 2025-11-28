package com.smartcampost.backend.service;
// package com.smartcampost.backend.service;

import com.smartcampost.backend.dto.ticket.*;
import org.springframework.data.domain.Page;

import java.util.UUID;

public interface SupportTicketService {

    TicketResponse createTicket(CreateTicketRequest request);

    TicketResponse getTicketById(UUID ticketId);

    Page<TicketResponse> listMyTickets(int page, int size);

    Page<TicketResponse> listAllTickets(int page, int size);

    TicketResponse replyToTicket(UUID ticketId, TicketReplyRequest request);

    TicketResponse updateTicketStatus(UUID ticketId, UpdateTicketStatusRequest request);
}
