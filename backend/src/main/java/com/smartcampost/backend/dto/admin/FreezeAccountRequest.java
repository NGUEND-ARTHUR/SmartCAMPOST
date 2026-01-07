package com.smartcampost.backend.dto.admin;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FreezeAccountRequest {
    @NotNull
    private Boolean frozen;
}
