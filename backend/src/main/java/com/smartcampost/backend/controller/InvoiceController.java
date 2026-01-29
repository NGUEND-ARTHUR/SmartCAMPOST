package com.smartcampost.backend.controller;

import com.smartcampost.backend.model.Invoice;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
 
import java.util.List;
import java.util.Objects;
import com.smartcampost.backend.exception.ResourceNotFoundException;
import com.smartcampost.backend.exception.ErrorCode;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {

    private final com.smartcampost.backend.repository.InvoiceRepository invoiceRepository;

    public InvoiceController(com.smartcampost.backend.repository.InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CLIENT') or hasRole('ADMIN') or hasRole('FINANCE')")
    public List<Invoice> myInvoices(java.security.Principal principal) {
        // Legacy: not implemented fully. Return empty list for now until InvoiceService is migrated.
        return List.of();
    }

    @GetMapping("/{invoiceId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('CLIENT')")
    public ResponseEntity<?> getInvoice(@PathVariable String invoiceId, org.springframework.security.core.Authentication principal) throws IOException {
        Objects.requireNonNull(invoiceId, "invoiceId is required");
        java.util.UUID id;
        try { id = java.util.UUID.fromString(invoiceId); } catch (Exception e) { return ResponseEntity.badRequest().build(); }
        id = Objects.requireNonNull(id, "parsed invoice id is required");
        return invoiceRepository.findById(id).map(inv -> ResponseEntity.ok(inv)).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-parcel/{parcelId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('CLIENT')")
    public List<Invoice> byParcel(@PathVariable String parcelId, org.springframework.security.core.Authentication principal) {
        // Not yet implemented: return empty list as placeholder
        return List.of();
    }

    @GetMapping("/{invoiceId}/pdf")
    @PreAuthorize("hasRole('ADMIN') or hasRole('FINANCE') or hasRole('CLIENT')")
    public ResponseEntity<Resource> downloadPdf(@PathVariable String invoiceId, org.springframework.security.core.Authentication principal) throws IOException {
        Objects.requireNonNull(invoiceId, "invoiceId is required");
        java.util.UUID id;
        try { id = java.util.UUID.fromString(invoiceId); } catch (Exception e) { return ResponseEntity.badRequest().build(); }
        id = Objects.requireNonNull(id, "parsed invoice id is required");
        var opt = invoiceRepository.findById(id);
        Invoice inv = opt.orElseThrow(() -> new ResourceNotFoundException("Invoice not found", ErrorCode.BUSINESS_ERROR));
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
}
