# SmartCAMPOST AI-Powered Logistics Platform Architecture

## 1. Enterprise Architecture

SmartCAMPOST now follows a secure AI operating-system pattern:

`User/Event -> AI Runtime -> Tool Request -> Permission Validation -> Backend Service -> Audit Log -> Realtime Notification`

The AI has two modes:

- Reactive assistant: answers user questions and retrieves data through authorized tools.
- Proactive agent: consumes operational events, evaluates system state, executes safe tools, requests approval for sensitive tools, and emits realtime outcomes.

## 2. Microservice Decomposition

The current monolith can be split later into these deployable services:

- Identity and RBAC Service: JWT, users, database-driven roles and permissions.
- Logistics Service: parcels, pickups, deliveries, scans, GPS, agencies, couriers.
- Payment Service: MTN, Orange, refunds, invoices, webhook validation.
- AI Runtime Service: reactive chat, proactive events, tool registry, policy engine.
- Notification Service: SMS, email, push, templates, retries.
- Audit and Compliance Service: decision logs, execution logs, approval logs, risk cases.
- Realtime Gateway: WebSocket/SSE updates for maps, AI events, scan events, and GPS.

## 3. Database Schema

Current app uses MySQL/H2-style UUID storage with `BINARY(16)`. The production PostgreSQL equivalent should use `uuid` columns.

Added dynamic RBAC tables:

- `permission`: granular permission codes such as `parcel:read`, `delivery:write`, `ai:discover`.
- `role_permission`: database-driven permission grants per role.

Existing AI audit/state tables:

- `ai_decision_log`
- `ai_execution_log`
- `ai_agent_state`
- `approval_requests`
- `system_event`

## 4. RBAC Model

Roles remain extensible through data. AI tools do not trust role names directly. They require granular permissions:

- `trackParcelTool`: `parcel:read`
- `assignCourierTool`: `parcel:assign`, `courier:read`
- `updateDeliveryStatusTool`: `delivery:write`
- `verifyPaymentTool`: `payment:read`, `payment:verify`
- `generateReportTool`: `report:read`
- `notifyUserTool`: `notification:send`
- `detectFraudTool`: `risk:write`

JWT authentication now enriches authorities with database/fallback permissions.

## 5. AI Orchestration

Current Java orchestration maps to LangGraph concepts:

- Context builder: `AiRuntimeController` enriches actor/event context.
- Analysis/decision node: `AiPolicyService`.
- Tool node: `DefaultAiRuntimeService.executeTool`.
- Approval node: `ApprovalRequest`.
- Execution node: backend services only.
- Audit node: `AiDecisionLog` and `AiExecutionLog`.
- Notification node: SSE events and notification service.

For a LangGraph deployment, run LangGraph as a sidecar service that calls `/api/ai/runtime/tools/execute` and `/api/ai/runtime/proactive/events`; never let LangGraph access the database directly.

## 6. Tool Registry

The tool registry is exposed by:

- `GET /api/ai/runtime/tools`
- `POST /api/ai/runtime/tools/execute`

Every tool has:

- required permissions
- write/read classification
- approval requirement
- structured result
- decision and execution audit log

## 7. Event Architecture

Current internal events:

- scan events
- parcel status changes
- delivery attempts
- system events

Target event bus:

- Kafka topics or RabbitMQ exchanges for `parcel.events`, `delivery.events`, `payment.events`, `risk.events`, `ai.events`.
- `system_event` table acts as durable outbox/inbox for retries and recovery.

## 8. Spring Boot Structure

Important packages:

- `ai.runtime`: AI modes, tools, policy, discovery, audit orchestration.
- `ai.events` and `ai.listeners`: event-driven intelligence hooks.
- `controller`: REST APIs.
- `service`: validated business execution layer.
- `model` and `repository`: persistence.
- `security`: JWT and dynamic permissions.

## 9. API Design

Core AI APIs:

- `POST /api/ai/runtime/reactive/chat`
- `GET /api/ai/runtime/tools`
- `POST /api/ai/runtime/tools/execute`
- `POST /api/ai/runtime/proactive/events`
- `GET /api/ai/runtime/discovery/automation-opportunities`
- `GET/POST/DELETE /api/rbac/roles/{role}/permissions`

## 10. Realtime Design

Current realtime channel:

- SSE via `/api/stream/scans` and `/api/stream/ai`

Target WebSocket channel:

- `/ws/operations`
- channels: `scan-event`, `gps-update`, `ai-decision`, `ai-execution`, `ai-runtime`.

## 11. Payment Flow

Payment integrations must use:

- signed webhook validation
- idempotency keys
- payment state machine
- audit logs
- AI anomaly verification through `verifyPaymentTool`

MTN exists. Orange Money should follow the same adapter pattern.

## 12. Notifications

Notifications are tool-executable only through `notifyUserTool`, which validates permission and persists outcomes. Templates and OTP logs are exposed to staff/admin UIs.

## 13. Audit Logging

Mandatory audit surfaces:

- `ai_decision_log`: policy result and reasoning.
- `ai_execution_log`: backend service execution result.
- `approval_requests`: human-in-the-loop sensitive actions.
- domain audit logs for parcel, actor, and agency timelines.

## 14. Security

Rules:

- AI never directly writes the database.
- AI never bypasses backend services.
- AI tools require permissions.
- Sensitive write tools require approval.
- All outcomes are logged.

## 15. Failure Handling

Recommended production behavior:

- event outbox retries with exponential backoff
- idempotent tool execution keys
- dead-letter event queues
- compensating rollback data in `ai_execution_log.rollback_data`
- notification retry queues

## 16. Human Approval

Sensitive tools such as courier assignment and delivery status mutation can enqueue approval requests. Admin/staff reviewers approve or deny through `/api/approvals`.

## 17. Deployment

Docker-ready production topology:

- Spring Boot API
- PostgreSQL
- Redis
- Kafka or RabbitMQ
- LangGraph sidecar
- Web frontend
- Mobile app
- observability stack: logs, metrics, traces

The current implementation is backward-compatible with the existing app and can evolve toward this topology without rewriting parcel, QR, payment, delivery, notification, or role workflows.
