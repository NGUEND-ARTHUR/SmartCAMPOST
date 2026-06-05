package com.smartcampost.backend.ai.runtime;

import java.util.List;

public enum AiToolName {
    TRACK_PARCEL("trackParcelTool", "Retrieve parcel and tracking details", AiOperatingMode.REACTIVE, false, false, List.of("parcel:read")),
    ASSIGN_COURIER("assignCourierTool", "Generate or execute courier assignment recommendations", AiOperatingMode.PROACTIVE, true, true, List.of("parcel:assign", "courier:read")),
    UPDATE_DELIVERY_STATUS("updateDeliveryStatusTool", "Move delivery through the workflow", AiOperatingMode.PROACTIVE, true, true, List.of("delivery:write")),
    VERIFY_PAYMENT("verifyPaymentTool", "Validate payment state and anomaly signals", AiOperatingMode.REACTIVE, false, false, List.of("payment:read", "payment:verify")),
    GENERATE_REPORT("generateReportTool", "Build operational or financial summaries", AiOperatingMode.REACTIVE, false, false, List.of("report:read")),
    NOTIFY_USER("notifyUserTool", "Send authenticated notifications", AiOperatingMode.PROACTIVE, true, false, List.of("notification:send")),
    DETECT_FRAUD("detectFraudTool", "Create a fraud or risk alert", AiOperatingMode.PROACTIVE, true, false, List.of("risk:write"));

    private final String value;
    private final String description;
    private final AiOperatingMode preferredMode;
    private final boolean writeOperation;
    private final boolean approvalRequired;
    private final List<String> requiredPermissions;

    AiToolName(String value, String description, AiOperatingMode preferredMode, boolean writeOperation, boolean approvalRequired, List<String> requiredPermissions) {
        this.value = value;
        this.description = description;
        this.preferredMode = preferredMode;
        this.writeOperation = writeOperation;
        this.approvalRequired = approvalRequired;
        this.requiredPermissions = requiredPermissions;
    }

    public String value() {
        return value;
    }

    public String description() {
        return description;
    }

    public AiOperatingMode preferredMode() {
        return preferredMode;
    }

    public boolean writeOperation() {
        return writeOperation;
    }

    public boolean approvalRequired() {
        return approvalRequired;
    }

    public List<String> requiredPermissions() {
        return requiredPermissions;
    }

    public static AiToolName fromValue(String value) {
        for (AiToolName toolName : values()) {
            if (toolName.value.equalsIgnoreCase(value)) {
                return toolName;
            }
        }
        throw new IllegalArgumentException("Unknown AI tool: " + value);
    }
}
