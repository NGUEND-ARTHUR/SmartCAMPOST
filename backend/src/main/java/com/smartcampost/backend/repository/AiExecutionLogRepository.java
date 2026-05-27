package com.smartcampost.backend.repository;

import com.smartcampost.backend.model.AiExecutionLog;
import com.smartcampost.backend.model.enums.AiExecutionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiExecutionLogRepository extends JpaRepository<AiExecutionLog, UUID> {

    List<AiExecutionLog> findByExecutionStatus(AiExecutionStatus executionStatus);
}
