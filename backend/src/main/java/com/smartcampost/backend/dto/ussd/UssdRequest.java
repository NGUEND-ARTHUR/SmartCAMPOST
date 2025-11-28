package com.smartcampost.backend.dto.ussd;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UssdRequest {

    @NotBlank
    private String msisdn;

    @NotBlank
    private String sessionRef;

    @NotBlank
    private String userInput;
}