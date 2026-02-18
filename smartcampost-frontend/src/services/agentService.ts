/**
 * Agent Tasks API Service
 */
import { httpClient } from "./apiClient";

export interface AgentTask {
  id: string;
  type: "PICKUP" | "DELIVERY" | "SCAN";
  parcelId: string;
  location: string;
  scheduledAt: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE" | "BLOCKED";
}

export const agentService = {
  /**
   * Get agent's tasks for today
   */
  getAgentTasks(): Promise<AgentTask[]> {
    return httpClient.get("/agents/me/tasks");
  },

  /**
   * Get task details
   */
  getTaskById(taskId: string): Promise<AgentTask> {
    return httpClient.get(`/agents/tasks/${taskId}`);
  },

  /**
   * Update task status
   */
  updateTaskStatus(taskId: string, status: string): Promise<AgentTask> {
    return httpClient.patch(`/agents/tasks/${taskId}/status`, { status });
  },

  /**
   * Accept a task
   */
  acceptTask(taskId: string): Promise<AgentTask> {
    return httpClient.post(`/agents/tasks/${taskId}/accept`, {});
  },

  /**
   * Complete a task
   */
  completeTask(taskId: string): Promise<AgentTask> {
    return httpClient.post(`/agents/tasks/${taskId}/complete`, {});
  },
};
