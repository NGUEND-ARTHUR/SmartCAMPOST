# Backend APIs — Key request/response contracts

1) Ai Runtime - Execute Tool
- Endpoint: `POST /api/ai/runtime/tools/execute`
- Auth: Bearer JWT (also allowed as `?token=...` for SSE/clients)
- Request body: `AiToolRequest` (JSON)

Example request
```json
{
  "mode": "REACTIVE",
  "toolName": "ASSIGN_COURIER",
  "actor": { "actorId": "<uuid>", "name": "user@example.com", "role": "STAFF", "permissions": ["approval:review"] },
  "parameters": { "parcelId": "<uuid>", "reason": "Optimize assignment" },
  "ownershipVerified": false,
  "approvalGranted": false,
  "approvalReference": null,
  "correlationId": "corr-123",
  "sourceEventType": null
}
```

- Successful response: `AiToolResult` (see below). When a decision requires human review the runtime will return a `PENDING_APPROVAL` result and persist an `ApprovalRequest`.

AiToolResult (sample)
```json
{
  "toolName": "ASSIGN_COURIER",
  "success": false,
  "status": "PENDING_APPROVAL",
  "message": "High-impact write action — requires approval",
  "data": { "tool": "ASSIGN_COURIER" },
  "auditReference": "<ai-decision-id>",
  "approvalRequired": true,
  "completedAt": "2026-05-27T...Z"
}
```

2) Approvals API
- List pending: `GET /api/approvals/pending` — returns persisted `ApprovalRequest` objects
- Approve: `POST /api/approvals/{id}/approve` — reviewer marks processed+approved → ApprovalProcessor will re-run the original request with `approvalGranted=true`
- Deny: `POST /api/approvals/{id}/deny`

ApprovalRequest fields (persisted)
- `id`, `toolName`, `actorId`, `actorRole`, `parametersJson` (JSON payload with parameters + actor), `reason`, `approved` (bool), `processed` (bool), `handled` (bool), `createdAt`, `processedAt`

3) SSE / Event Stream
- Endpoint: `GET /api/stream/ai` via `EventSource` (SSE). For browsers, attach token as `?token=<jwt>` because `EventSource` cannot set headers.
- Envelope: when emitted the server uses an envelope: `{"correlationId": "<id>", "payload": <object> }`.
- Event names emitted by AI runtime & services: `ai-decision`, `ai-execution`, `ai-runtime`, `scan-event` (scan events use raw `ScanEvent` object).

Example SSE envelope for `ai-decision`
```json
{
  "correlationId": "corr-123",
  "payload": {
    "tool": "ASSIGN_COURIER",
    "decisionOutcome": "PENDING_APPROVAL",
    "reason": "Write action requires approval",
    "subjectType": "PARCEL",
    "targetId": "<uuid>"
  }
}
```

4) Chat (reactive)
- Endpoint: `POST /api/ai/runtime/reactive/chat`
- Request: `ChatRequest` — `{ "message": "Where is my parcel?", "sessionId": "s1", "language":"en" }`
- Response: `ChatResponse` — contains `message`, `suggestions`, optional `action` with `type` and `payload`.

References (code)
- `AiRuntimeController`: [backend/src/main/java/com/smartcampost/backend/ai/runtime/AiRuntimeController.java](backend/src/main/java/com/smartcampost/backend/ai/runtime/AiRuntimeController.java)
- `DefaultAiRuntimeService` implementation: [backend/src/main/java/com/smartcampost/backend/ai/runtime/DefaultAiRuntimeService.java](backend/src/main/java/com/smartcampost/backend/ai/runtime/DefaultAiRuntimeService.java)
- `SseEmitters`: [backend/src/main/java/com/smartcampost/backend/sse/SseEmitters.java](backend/src/main/java/com/smartcampost/backend/sse/SseEmitters.java)
- `ApprovalController`: [backend/src/main/java/com/smartcampost/backend/controller/ApprovalController.java](backend/src/main/java/com/smartcampost/backend/controller/ApprovalController.java)
