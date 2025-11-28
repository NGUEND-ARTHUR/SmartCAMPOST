package com.smartcampost.backend.repository;
import com.smartcampost.backend.model.SupportTicket;
import com.smartcampost.backend.model.Client;
import com.smartcampost.backend.model.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {

    Page<SupportTicket> findByClient(Client client, Pageable pageable);

    Page<SupportTicket> findByStatus(TicketStatus status, Pageable pageable);
}