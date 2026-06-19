package com.smartcampost.backend.controller;
import com.smartcampost.backend.dto.ussd.UssdRequest;
import com.smartcampost.backend.dto.ussd.UssdResponse;
import com.smartcampost.backend.service.UssdService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ussd")
@RequiredArgsConstructor
public class UssdController {

    private final UssdService ussdService;

    @PostMapping("/handle")
    public ResponseEntity<UssdResponse> handle(
            @Valid @RequestBody UssdRequest request
    ) {
        return ResponseEntity.ok(ussdService.handleUssdRequest(request));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<Map<String, Object>>> sessions() {
        return ResponseEntity.ok(List.of(
                Map.of(
                        "sessionId", "USSD-DEMO-TRACK",
                        "phone", "****0000",
                        "flow", "TRACK_PARCEL",
                        "status", "READY",
                        "updatedAt", Instant.now()
                ),
                Map.of(
                        "sessionId", "USSD-DEMO-PICKUP",
                        "phone", "****0001",
                        "flow", "PICKUP_REQUEST",
                        "status", "READY",
                        "updatedAt", Instant.now()
                )
        ));
    }
}
