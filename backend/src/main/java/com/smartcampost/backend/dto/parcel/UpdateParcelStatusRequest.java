package com.smartcampost.backend.dto.parcel;

import com.smartcampost.backend.model.enums.ParcelStatus;
import lombok.Data;

@Data
public class UpdateParcelStatusRequest {
    private ParcelStatus status;
    private String reason;  // optional comment (e.g. "Client not home")
}
