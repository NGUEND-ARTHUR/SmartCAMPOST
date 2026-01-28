package com.smartcampost.backend.service;

import org.springframework.core.io.Resource;

import java.io.IOException;
import java.util.UUID;

public interface QRService {
    byte[] generateQrPngForParcel(UUID parcelId) throws IOException;
    Resource generateQrPdfForParcel(UUID parcelId) throws IOException;
}
