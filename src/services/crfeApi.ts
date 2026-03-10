import { api } from "./http";

export const crfeApi = {
  createForecast(payload: any) {
    return api("crfe", "/api/forecasts", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getForecasts(userId: number) {
    return api("crfe", `/api/forecasts?userId=${userId}`);
  },

  generateForecast(userId: number) {
    return api("crfe", `/api/forecasts/generate?userId=${userId}`, {
      method: "POST",
    });
  },

  getRiskAlerts(userId: number) {
    return api("crfe", `/api/risk-alerts?userId=${userId}`);
  },
};