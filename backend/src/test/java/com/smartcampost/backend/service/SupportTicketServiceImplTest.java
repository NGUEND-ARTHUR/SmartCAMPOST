package com.smartcampost.backend.service;

import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.repository.SupportTicketRepository;
import com.smartcampost.backend.service.impl.SupportTicketServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupportTicketServiceImplTest {

    @Mock private SupportTicketRepository ticketRepository;
    @InjectMocks private SupportTicketServiceImpl ticketService;

    @Test
    void getTicket_notFound_shouldThrow() {
        UUID id = UUID.randomUUID();
        when(ticketRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(Exception.class, () -> ticketService.getTicketById(id));
    }
}
