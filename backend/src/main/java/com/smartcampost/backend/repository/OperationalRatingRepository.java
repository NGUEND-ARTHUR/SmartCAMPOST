package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.OperationalRating;
import com.smartcampost.backend.model.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OperationalRatingRepository extends JpaRepository<OperationalRating, UUID> {
    List<OperationalRating> findByRatedEntityIdAndRatedRole(UUID ratedEntityId, UserRole ratedRole);
    List<OperationalRating> findByTrackingRef(String trackingRef);
}
