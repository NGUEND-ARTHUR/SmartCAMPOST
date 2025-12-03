package com.smartcampost.backend.dto.parcel;

import lombok.Data;

@Data
public class UpdateParcelMetadataRequest {

    private String photoUrl;
    private String descriptionComment;
}
