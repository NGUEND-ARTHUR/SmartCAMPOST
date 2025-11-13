package com.smartcampost.backend.service;

import java.util.List;
import java.util.UUID;

public interface SupportTicketService {

    UUID openTicket(UUID clientId, UUID parcelId, String subject, String description);

    void addMessage(UUID ticketId, UUID authorId, String message);

    void closeTicket(UUID ticketId);

    List<?> listTicketsForClient(UUID clientId);
}
