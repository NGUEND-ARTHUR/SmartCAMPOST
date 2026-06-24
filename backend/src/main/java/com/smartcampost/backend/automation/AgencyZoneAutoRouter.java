package com.smartcampost.backend.automation;

import com.smartcampost.backend.ai.events.ParcelStatusChangedEvent;
import com.smartcampost.backend.model.Agency;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.ParcelStatus;
import com.smartcampost.backend.repository.AgencyRepository;
import com.smartcampost.backend.repository.ParcelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Automation E — Agency zone auto-routing.
 * When a parcel is created, determines the destination agency based on the
 * recipient address's region/city and assigns it automatically.
 *
 * DUAL MODE:
 * - AUTONOMOUS: @EventListener on ParcelStatusChangedEvent → CREATED
 * - MANUAL: admin/agent can override via existing assignment UI or manualRoute()
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AgencyZoneAutoRouter {

    private final AgencyRepository agencyRepository;
    private final ParcelRepository parcelRepository;

    @Async
    @EventListener
    public void onParcelCreated(ParcelStatusChangedEvent event) {
        if (event.newStatus() != ParcelStatus.CREATED) return;
        try {
            routeParcel(event.parcelId());
        } catch (Exception e) {
            log.error("[AUTOMATION-E] Auto-routing failed for parcel {}: {}", event.parcelId(), e.getMessage());
        }
    }

    @Transactional
    public Agency routeParcel(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId).orElse(null);
        if (parcel == null) {
            log.warn("[AUTOMATION-E] Parcel {} not found", parcelId);
            return null;
        }

        if (parcel.getDestinationAgency() != null) {
            log.debug("[AUTOMATION-E] Parcel {} already has destination agency {}", parcelId,
                    parcel.getDestinationAgency().getAgencyName());
            return parcel.getDestinationAgency();
        }

        if (parcel.getRecipientAddress() == null) {
            log.debug("[AUTOMATION-E] Parcel {} has no recipient address — cannot auto-route", parcelId);
            return null;
        }

        String region = parcel.getRecipientAddress().getRegion();
        String city = parcel.getRecipientAddress().getCity();

        Agency matched = findBestAgency(region, city);
        if (matched == null) {
            log.info("[AUTOMATION-E] No matching agency for parcel {} (region={}, city={})",
                    parcel.getTrackingRef(), region, city);
            return null;
        }

        parcel.setDestinationAgency(matched);
        parcelRepository.save(parcel);
        log.info("[AUTOMATION-E] Auto-routed parcel {} → agency {} ({})",
                parcel.getTrackingRef(), matched.getAgencyName(), matched.getCity());
        return matched;
    }

    private Agency findBestAgency(String region, String city) {
        if (city != null && !city.isBlank()) {
            List<Agency> byCity = agencyRepository.findByCityIgnoreCase(city.trim());
            if (!byCity.isEmpty()) return byCity.get(0);
        }

        if (region != null && !region.isBlank()) {
            List<Agency> byRegion = agencyRepository.findByRegionIgnoreCase(region.trim());
            if (!byRegion.isEmpty()) return byRegion.get(0);
        }

        return null;
    }

    /**
     * Manual override: route a parcel to a specific agency.
     */
    @Transactional
    public void manualRoute(UUID parcelId, UUID agencyId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + parcelId));
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new IllegalArgumentException("Agency not found: " + agencyId));
        parcel.setDestinationAgency(agency);
        parcelRepository.save(parcel);
        log.info("[AUTOMATION-E] MANUAL route: parcel {} → agency {}", parcel.getTrackingRef(), agency.getAgencyName());
    }

    /**
     * Manual override: auto-route a parcel (re-run algorithm).
     */
    @Transactional
    public Agency manualAutoRoute(UUID parcelId) {
        Parcel parcel = parcelRepository.findById(parcelId)
                .orElseThrow(() -> new IllegalArgumentException("Parcel not found: " + parcelId));
        parcel.setDestinationAgency(null);
        parcelRepository.save(parcel);
        return routeParcel(parcelId);
    }
}
