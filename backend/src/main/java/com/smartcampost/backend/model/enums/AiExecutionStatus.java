package com.smartcampost.backend.model.enums;

/**
 * Status lifecycle for AI action execution.
 */
public enum AiExecutionStatus {
    STARTED,
    IN_PROGRESS,
    COMPLETED,
    FAILED,
    ROLLED_BACK
}
