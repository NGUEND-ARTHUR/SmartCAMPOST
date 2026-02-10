package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.DeliveryAttempt;
import com.smartcampost.backend.model.Parcel;
import com.smartcampost.backend.model.enums.DeliveryAttemptResult;
import com.smartcampost.backend.model.enums.ParcelStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface DeliveryAttemptRepository extends JpaRepository<DeliveryAttempt, UUID> {

    /**
     * Find all delivery attempts for a parcel, ordered by attempt number
     */
    List<DeliveryAttempt> findByParcel_IdOrderByAttemptNumberAsc(UUID parcelId);

    /**
     * Count the number of delivery attempts for a parcel
     */
    int countByParcel_Id(UUID parcelId);

    /**
     * Find the latest attempt for a parcel
     */
    DeliveryAttempt findTopByParcel_IdOrderByAttemptNumberDesc(UUID parcelId);

    /**
     * Check if there's a successful delivery attempt
     */
    boolean existsByParcel_IdAndResult(UUID parcelId, DeliveryAttemptResult result);

    /**
     * Get failed attempts count for a parcel
     */
    @Query("SELECT COUNT(da) FROM DeliveryAttempt da WHERE da.parcel.id = :parcelId AND da.result != 'SUCCESS'")
    int countFailedAttempts(@Param("parcelId") UUID parcelId);

    @Query("SELECT DISTINCT da.parcel FROM DeliveryAttempt da WHERE da.courier.id = :courierId AND da.parcel.status IN :statuses")
    List<Parcel> findDistinctParcelsByCourierAndParcelStatusIn(
            @Param("courierId") UUID courierId,
            @Param("statuses") List<ParcelStatus> statuses
    );
}
