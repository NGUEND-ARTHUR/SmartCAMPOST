package com.smartcampost.backend.controller;
import com.smartcampost.backend.dto.ussd.UssdRequest;
import com.smartcampost.backend.dto.ussd.UssdResponse;
import com.smartcampost.backend.service.UssdService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}