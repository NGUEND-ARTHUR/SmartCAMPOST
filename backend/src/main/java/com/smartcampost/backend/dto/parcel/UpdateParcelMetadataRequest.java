package com.smartcampost.backend.dto.parcel;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateParcelMetadataRequest {

    @Size(max = 255)
    private String photoUrl;

    @Size(max = 1000)
    private String descriptionComment;
}
