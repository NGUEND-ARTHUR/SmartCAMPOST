# Backend Workflows

1) AI Tool Execution (runtime)
- Caller: API client or internal event → `POST /api/ai/runtime/tools/execute` (`AiRuntimeController.executeTool`)
- Steps:
  1. Controller enriches request with actor context (`AiRuntimeController.enrichRequest`).
  2. `DefaultAiRuntimeService.executeTool` evaluates policy via `AiPolicyService`.
  3. Decision persisted to `ai_decision_log` (`persistDecision`).
  4. SSE: `ai-decision` event emitted with `correlationId` + decision summary (`SseEmitters.emitAiEvent`).
  5. If decision denies and `requiresApproval`: persist `approval_requests` row and return `PENDING_APPROVAL` to caller.
  6. If allowed (or approval granted), runtime executes the specific tool handler (e.g., `executeAssignCourier`) which calls domain services (AssignmentService, DeliveryService, PaymentService, etc.).
  7. Execution result persisted to `ai_execution_log` and `ai-execution` SSE emitted.

Files: [DefaultAiRuntimeService.java](backend/src/main/java/com/smartcampost/backend/ai/runtime/DefaultAiRuntimeService.java)

2) Approval lifecycle (human-in-the-loop)
- Reviewer UI queries `GET /api/approvals/pending` (Authorization required).
- Reviewer calls `POST /api/approvals/{id}/approve` or `deny` (Authorization required). This sets `processed=true` and `approved=true|false`.
- `ApprovalProcessor` (scheduled every 5s) scans `processed=true && handled=false` rows and for approved entries builds an `AiToolRequest` with `approvalGranted=true` and replays `aiRuntimeService.executeTool(...)`.
- After re-execution, `ApprovalProcessor` marks `handled=true` on the request to avoid reprocessing.

Files: [ApprovalController.java](backend/src/main/java/com/smartcampost/backend/controller/ApprovalController.java), [ApprovalProcessor.java](backend/src/main/java/com/smartcampost/backend/approval/ApprovalProcessor.java)

3) Assignment flow (courier assignment)
- The `ASSIGN_COURIER` tool is implemented in `DefaultAiRuntimeService.executeAssignCourier` and delegates to `AssignmentService.assignCourier(...)`.
- When approval is required, assignment is persisted only after approval replay; when approved the `AssignmentService` executes domain logic (creating `Delivery`/`Dispatch` records and notifying couriers).

Files: [AssignmentServiceImpl.java](backend/src/main/java/com/smartcampost/backend/service/impl/AssignmentServiceImpl.java)

4) Event-driven processing
- System and external events can be posted to `POST /api/ai/runtime/proactive/events` which the runtime maps to tools (e.g., `COURIER_AVAILABLE` -> `ASSIGN_COURIER`). Events produce `ai-runtime` SSE messages summarizing actions and whether manual intervention is required.

Notes
- All decision & execution steps are persisted for audit. Ensure retention and access controls around these tables.
