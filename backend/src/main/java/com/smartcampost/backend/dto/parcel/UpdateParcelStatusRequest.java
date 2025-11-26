package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.model.enums.ParcelStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateParcelStatusRequest {

    @NotNull
    private ParcelStatus status;
}
