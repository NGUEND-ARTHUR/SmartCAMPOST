# Backend Risks & Mitigations

This file highlights known risks for the backend AI-enabled features and recommended mitigations.

1) Unauthorized or accidental write-actions by AI
- Risk: AI proposes or executes high-impact actions (assign courier, change delivery status, refund) without human oversight.
- Mitigation: Policy engine (`AiPolicyService`) gates risky tools and persistent `ApprovalRequest` queue forces human review. See `DefaultAiRuntimeService` and `ApprovalProcessor`.

2) Auditability gaps
- Risk: Missing context for why a decision was taken.
- Mitigation: `ai_decision_log` stores `input_data`, `reasoning`, `confidence_score`, and `ai_execution_log` stores execution results and `auditReference` linking records.

3) Sensitive data leakage via logs and SSE
- Risk: PII (phone numbers, emails) may be emitted in events or stored in logs.
- Mitigation: Redact/mask sensitive fields before emitting; configure retention and access controls for AI logs. Emit only necessary fields in SSE envelopes.

4) Denial-of-service via public AI endpoints or SSE connections
- Risk: Abuse of `POST /api/ai/runtime/tools/execute` or many SSE connections.
- Mitigation: Apply `RateLimitFilter`, use token limits for SSE, enforce CORS and require auth for runtime endpoints.

5) Inconsistent approval processing in multi-instance deployments
- Risk: ApprovalProcessor (in-memory scheduling) might replay approvals multiple times in horizontal scale.
- Mitigation: Use database transactional flags and update semantics (e.g., `processed` + `handled`) with optimistic locking, or move processor to a single leader instance (via distributed lock / leader election) or use message queue.

6) Secret management and JWT security
- Risk: Weak or leaked JWT secret enables token forging.
- Mitigation: Enforce `SMARTCAMPOST_JWT_SECRET` presence and minimum length. Use short token lifetime, rotate secrets, and consider asymmetric JWT keys for key rotation.

7) Rate limiting and lockout state not shared across instances
- Risk: In-memory RateLimitFilter and AccountLockoutService are not suitable for multi-instance production.
- Mitigation: Replace with Redis-based counters and locks for global enforcement.

8) Approvals backlog and reviewer fatigue
- Risk: Too many approval requests increase latency and block operations.
- Mitigation: Tune `AiPolicyService` to require approval only for high-impact cases; add batching, escalation policies, and SLA monitoring for the approval queue.
