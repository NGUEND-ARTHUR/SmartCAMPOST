package com.smartcampost.backend.bootstrap;

import com.smartcampost.backend.model.Tariff;
import com.smartcampost.backend.model.enums.ServiceType;
import com.smartcampost.backend.repository.TariffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DefaultTariffBootstrap implements ApplicationRunner {

    private final TariffRepository tariffRepository;

    private static final String[] WEIGHT_BRACKETS = {"0-5kg", "5-10kg", "10-20kg", "20-50kg", "50+kg"};

    private static final String[] CAMEROON_REGIONS = {
        "CENTRE", "LITTORAL", "OUEST", "NORD-OUEST", "SUD-OUEST",
        "NORD", "EXTREME-NORD", "ADAMAOUA", "EST", "SUD"
    };

    private static final int[][] STANDARD_PRICES = {
        {1500, 2500, 4000, 7000, 12000},
        {2500, 3500, 5500, 9000, 15000},
    };

    private static final int[][] EXPRESS_PRICES = {
        {2500, 4000, 6500, 11000, 18000},
        {4000, 5500, 8500, 14000, 22000},
    };

    @Override
    public void run(ApplicationArguments args) {
        long existing = tariffRepository.count();
        if (existing >= 1000) {
            log.info("Tariff bootstrap skipped — {} tariffs already exist", existing);
            return;
        }

        log.info("Seeding default tariffs for Cameroon...");
        int count = 0;

        for (String origin : CAMEROON_REGIONS) {
            for (String dest : CAMEROON_REGIONS) {
                boolean sameRegion = origin.equals(dest);
                for (int w = 0; w < WEIGHT_BRACKETS.length; w++) {
                    int stdPrice = sameRegion ? STANDARD_PRICES[0][w] : STANDARD_PRICES[1][w];
                    int expPrice = sameRegion ? EXPRESS_PRICES[0][w] : EXPRESS_PRICES[1][w];

                    saveTariff(ServiceType.STANDARD, origin, dest, WEIGHT_BRACKETS[w], stdPrice);
                    saveTariff(ServiceType.EXPRESS, origin, dest, WEIGHT_BRACKETS[w], expPrice);
                    count += 2;
                }
            }
        }

        for (int w = 0; w < WEIGHT_BRACKETS.length; w++) {
            saveTariff(ServiceType.STANDARD, "NATIONAL", "NATIONAL", WEIGHT_BRACKETS[w], STANDARD_PRICES[1][w]);
            saveTariff(ServiceType.EXPRESS, "NATIONAL", "NATIONAL", WEIGHT_BRACKETS[w], EXPRESS_PRICES[1][w]);
            count += 2;
        }

        log.info("Seeded {} default tariffs", count);
    }

    private void saveTariff(ServiceType serviceType, String origin, String dest, String weightBracket, int price) {
        if (tariffRepository.existsByServiceTypeAndOriginZoneAndDestinationZoneAndWeightBracket(
                serviceType, origin, dest, weightBracket)) {
            return;
        }
        Tariff tariff = Tariff.builder()
                .id(UUID.randomUUID())
                .serviceType(serviceType)
                .originZone(origin)
                .destinationZone(dest)
                .weightBracket(weightBracket)
                .price(BigDecimal.valueOf(price))
                .build();
        tariffRepository.save(tariff);
    }
}
