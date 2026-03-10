import { api } from "./http";

export const dseApi = {
  createSimulation(payload: any) {
    return api("dse", "/api/simulations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getScenarios(userId: number) {
    return api("dse", `/api/simulations/scenarios?userId=${userId}`);
  },

  getResults(userId: number) {
    return api("dse", `/api/simulations/results?userId=${userId}`);
  },
};