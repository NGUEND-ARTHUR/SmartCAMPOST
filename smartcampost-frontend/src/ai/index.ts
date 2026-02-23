import { DataOptimizationAgent } from "./agents/dataOptimizationAgent";
import { MapIntelligenceAgent } from "./agents/mapIntelligenceAgent";

const dataOptimizationAgent = new DataOptimizationAgent(60_000);

export const aiAgents = {
  dataOptimization: dataOptimizationAgent,
  mapIntelligence: new MapIntelligenceAgent(dataOptimizationAgent),
};
