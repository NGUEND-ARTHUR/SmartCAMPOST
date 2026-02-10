package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.invoice.InvoiceResponse;
import com.smartcampost.backend.exception.AuthException;
import com.smartcampost.backend.exception.ErrorCode;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.model.Invoice;
import com.smartcampost.backend.model.UserAccount;
import com.smartcampost.backend.model.enums.UserRole;
import com.smartcampost.backend.repository.InvoiceRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.repository.UserAccountRepository;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
 
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;
    private final ParcelRepository parcelRepository;
    private final UserAccountRepository userAccountRepository;

    public InvoiceController(
            InvoiceRepository invoiceRepository,
            ParcelRepository parcelRepository,
            UserAccountRepository userAccountRepository
    ) {
        this.invoiceRepository = invoiceRepository;
        this.parcelRepository = parcelRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN') or hasRole('FINANCE')")
    public List<InvoiceResponse> myInvoices(org.springframework.security.core.Authentication auth) {
        UserAccount user = getCurrentUserAccount(auth);
        if (user.getRole() == UserRole.CLIENT) {
            UUID clientId = Objects.requireNonNull(user.getEntityId(), "user.entityId is required");
            return invoiceRepository.findByPayment_Parcel_Client_IdOrderByIssuedAtDesc(clientId)
                    .stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        return invoiceRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @GetMapping("/{invoiceId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('CLIENT')")
    public ResponseEntity<?> getInvoice(
            @PathVariable String invoiceId,
            org.springframework.security.core.Authentication auth
    ) {
        UUID id = parseUuid(invoiceId);
        if (id == null) return ResponseEntity.badRequest().build();

        Invoice inv = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found", ErrorCode.BUSINESS_ERROR));

        enforceInvoiceAccess(inv, auth);
        return ResponseEntity.ok(toResponse(inv));
    }

    @GetMapping("/by-parcel/{parcelId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('CLIENT')")
        public List<InvoiceResponse> byParcel(
            @PathVariable String parcelId,
            org.springframework.security.core.Authentication auth
    ) {
        UUID pid = parseUuid(parcelId);
        if (pid == null) return List.of();

        UserAccount user = getCurrentUserAccount(auth);
        if (user.getRole() == UserRole.CLIENT) {
            var parcel = parcelRepository.findById(pid)
                    .orElseThrow(() -> new ResourceNotFoundException("Parcel not found", ErrorCode.PARCEL_NOT_FOUND));
            if (!Objects.equals(parcel.getClient().getId(), user.getEntityId())) {
                throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "You cannot access invoices for this parcel");
            }
        }

        return invoiceRepository.findByPayment_Parcel_IdOrderByIssuedAtDesc(pid)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @GetMapping("/{invoiceId}/pdf")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('CLIENT')")
    public ResponseEntity<Resource> downloadPdf(
            @PathVariable String invoiceId,
            org.springframework.security.core.Authentication auth
    ) throws IOException {
        Objects.requireNonNull(invoiceId, "invoiceId is required");
        UUID id = parseUuid(invoiceId);
        if (id == null) return ResponseEntity.badRequest().build();

        Invoice inv = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found", ErrorCode.BUSINESS_ERROR));

        enforceInvoiceAccess(inv, auth);
        if (inv.getPdfLink() == null) return ResponseEntity.notFound().build();
        java.io.File f = new java.io.File(inv.getPdfLink());
        if (!f.exists()) return ResponseEntity.notFound().build();
        Resource res = new org.springframework.core.io.FileSystemResource(f);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice-" + invoiceId + ".pdf")
            .contentType(Objects.requireNonNull(MediaType.APPLICATION_PDF))
            .body(res);
    }

    @SuppressWarnings("unused")
    private boolean hasRole(org.springframework.security.core.Authentication auth, String role) {
        if (auth == null || auth.getAuthorities() == null) return false;
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(role));
    }

    @SuppressWarnings("unused")
    private Long parseUserId(java.security.Principal principal) {
        if (principal == null) return null;
        try { return Long.parseLong(principal.getName()); } catch (Exception e) { return null; }
    }

    private UUID parseUuid(String raw) {
        Objects.requireNonNull(raw, "id is required");
        try {
            return UUID.fromString(raw);
        } catch (Exception e) {
            return null;
        }
    }

    private UserAccount getCurrentUserAccount(org.springframework.security.core.Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new AuthException(ErrorCode.AUTH_UNAUTHORIZED, "Unauthenticated");
        }
        String subject = auth.getName();

        try {
            UUID id = UUID.fromString(subject);
            return userAccountRepository.findById(Objects.requireNonNull(id, "userId is required"))
                    .orElseThrow(() -> new ResourceNotFoundException("User not found", ErrorCode.AUTH_USER_NOT_FOUND));
        } catch (IllegalArgumentException ex) {
            return userAccountRepository.findByPhone(subject)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found", ErrorCode.AUTH_USER_NOT_FOUND));
        }
    }

    private void enforceInvoiceAccess(Invoice inv, org.springframework.security.core.Authentication auth) {
        UserAccount user = getCurrentUserAccount(auth);
        if (user.getRole() != UserRole.CLIENT) return;

        UUID clientId = Objects.requireNonNull(user.getEntityId(), "user.entityId is required");
        UUID invoiceClientId = inv.getPayment().getParcel().getClient().getId();
        if (!Objects.equals(clientId, invoiceClientId)) {
            throw new AuthException(ErrorCode.AUTH_FORBIDDEN, "You cannot access this invoice");
        }
    }

        private InvoiceResponse toResponse(Invoice inv) {
        Objects.requireNonNull(inv, "invoice is required");
        UUID paymentId = inv.getPayment() != null ? inv.getPayment().getId() : null;
        UUID parcelId = (inv.getPayment() != null && inv.getPayment().getParcel() != null)
            ? inv.getPayment().getParcel().getId()
            : null;
        String trackingRef = (inv.getPayment() != null && inv.getPayment().getParcel() != null)
            ? inv.getPayment().getParcel().getTrackingRef()
            : null;

        return InvoiceResponse.builder()
            .id(inv.getId())
            .paymentId(paymentId)
            .parcelId(parcelId)
            .parcelTrackingRef(trackingRef)
            .invoiceNumber(inv.getInvoiceNumber())
            .totalAmount(inv.getTotalAmount())
            .issuedAt(inv.getIssuedAt())
            .pdfLink(inv.getPdfLink())
            .build();
        }
}

