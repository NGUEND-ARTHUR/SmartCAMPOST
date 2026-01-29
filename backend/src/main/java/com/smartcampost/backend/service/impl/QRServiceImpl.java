package com.smartcampost.backend.service.impl;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.smartcampost.backend.repository.ParcelRepository;
import com.smartcampost.backend.service.QRService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Objects;
import java.util.UUID;

@Service
public class QRServiceImpl implements QRService {

    private final ParcelRepository parcelRepository;

    public QRServiceImpl(ParcelRepository parcelRepository) {
        this.parcelRepository = parcelRepository;
    }

    @Override
    public byte[] generateQrPngForParcel(UUID parcelId) throws IOException {
        UUID id = Objects.requireNonNull(parcelId, "parcelId is required");
        String text = parcelRepository.findById(id)
            .map(p -> p.getTrackingRef() != null ? p.getTrackingRef() : String.valueOf(p.getId()))
            .orElse("UNKNOWN");

        int size = 300; // high-res for print
        HashMap<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.MARGIN, 1);
        BitMatrix matrix;
        try {
            matrix = new MultiFormatWriter().encode(text, BarcodeFormat.QR_CODE, size, size, hints);
        } catch (Exception e) {
            throw new IOException(e);
        }

        BufferedImage img = MatrixToImageWriter.toBufferedImage(matrix);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            javax.imageio.ImageIO.write(img, "PNG", baos);
            return baos.toByteArray();
        }
    }

    @Override
    public Resource generateQrPdfForParcel(UUID parcelId) throws IOException {
        byte[] png = generateQrPngForParcel(parcelId);
        Path outDir = Files.createDirectories(Path.of("storage", "qrcodes"));
        Path out = outDir.resolve("qr-" + parcelId.toString() + ".pdf");

        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage();
            doc.addPage(page);

            BufferedImage img = javax.imageio.ImageIO.read(new java.io.ByteArrayInputStream(png));
            var pdImage = LosslessFactory.createFromImage(doc, img);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float x = 50;
                float y = page.getMediaBox().getHeight() - 150;
                float displaySize = 85; // px -> approx 3cm
                cs.drawImage(pdImage, x, y, displaySize, displaySize);
                cs.beginText();
                cs.newLineAtOffset(x, y - 10);
                cs.endText();
            }
            doc.save(out.toFile());
        }
        return new FileSystemResource(Objects.requireNonNull(out.toFile(), "output file is required"));
    }
}
