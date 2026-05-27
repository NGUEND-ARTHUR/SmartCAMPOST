# Backend Database — Key entities & schema notes

Primary tables (high level)

- `user_account` — identity table. See: [backend/src/main/java/com/smartcampost/backend/model/UserAccount.java](backend/src/main/java/com/smartcampost/backend/model/UserAccount.java)
  - Columns: `id` (UUID BINARY(16)), `phone`, `email`, `password_hash`, `auth_provider`, `google_id`, `role`, `entity_id`, `created_at`, `frozen`

- `ai_decision_log` — audit trail for AI decisions. See: [backend/src/main/java/com/smartcampost/backend/model/AiDecisionLog.java](backend/src/main/java/com/smartcampost/backend/model/AiDecisionLog.java)
  - Stores module, decision type/outcome, input JSON, confidence, reasoning text, overrides and created timestamp.

- `ai_execution_log` — log of actual tool executions (successful or failed). See: [backend/src/main/java/com/smartcampost/backend/model/AiExecutionLog.java](backend/src/main/java/com/smartcampost/backend/model/AiExecutionLog.java)

- `approval_requests` — persistent approval queue for human-in-the-loop decisions. See: [backend/src/main/java/com/smartcampost/backend/approval/ApprovalRequest.java](backend/src/main/java/com/smartcampost/backend/approval/ApprovalRequest.java)
  - Important fields: `parametersJson` stores the original tool request and actor; `processed`, `approved`, `handled` flags control lifecycle.

- Domain tables: `parcel`, `delivery`, `pickup_request`, `scan_event`, `invoice`, etc. See repository package: [backend/src/main/java/com/smartcampost/backend/repository](backend/src/main/java/com/smartcampost/backend/repository)

Indexing & performance notes
- Index decision and execution logs on `created_at` and `subject_id` to support analytics queries.
- Approval queue should have an index on `processed` and `handled` for the ApprovalProcessor scan.

Data governance
- AI logs contain PII and must be retained according to retention policy. Consider encryption at rest and column-level redaction for `input_data`.
- Mask sensitive fields (phone, email) when returned via any public APIs.

Migration tips
- Use UUID binary(16) columns as in existing entities. When adding new columns, use sensible defaults and `@PrePersist` initialization where appropriate.
