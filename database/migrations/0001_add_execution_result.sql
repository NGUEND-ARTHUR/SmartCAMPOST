-- Migration: add execution_result to ai_agent_recommendation
-- Run this against the `smartcampost` database as a privileged user.

ALTER TABLE ai_agent_recommendation
  ADD COLUMN execution_result VARCHAR(500) NULL;

-- Rollback (if you really need to revert):
-- ALTER TABLE ai_agent_recommendation DROP COLUMN execution_result;
