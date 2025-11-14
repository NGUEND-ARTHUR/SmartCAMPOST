package com.smartcampost.backend.controller;

import com.smartcampost.backend.dto.agency.AgencyRequest;
import com.smartcampost.backend.dto.agency.AgencyResponse;
import com.smartcampost.backend.service.AgencyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agencies")
@RequiredArgsConstructor
public class AgencyController {

    private final AgencyService agencyService;

    @PostMapping
    public ResponseEntity<AgencyResponse> create(@Valid @RequestBody AgencyRequest request) {
        return ResponseEntity.ok(agencyService.createAgency(request));
    }

    @GetMapping
    public ResponseEntity<List<AgencyResponse>> list() {
        return ResponseEntity.ok(agencyService.listAgencies());
    }

    @GetMapping("/{agencyId}")
    public ResponseEntity<AgencyResponse> get(@PathVariable UUID agencyId) {
        return ResponseEntity.ok(agencyService.getAgency(agencyId));
    }

    @PutMapping("/{agencyId}")
    public ResponseEntity<AgencyResponse> update(@PathVariable UUID agencyId,
                                                 @Valid @RequestBody AgencyRequest request) {
        return ResponseEntity.ok(agencyService.updateAgency(agencyId, request));
    }
}

