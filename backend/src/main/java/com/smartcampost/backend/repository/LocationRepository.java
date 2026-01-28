package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.Location;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LocationRepository extends JpaRepository<Location, Long> {
    List<Location> findTop100ByUserIdOrderByTimestampDesc(Long userId);
    List<Location> findTop500ByOrderByTimestampDesc();
}
