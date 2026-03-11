import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/shell/AppShell";

import { LandingPage } from "@/views/landing/LandingPage";
import { LoginPage } from "@/views/auth/LoginPage";

import { DashboardPage } from "@/views/dashboard/DashboardPage";
import { FinancialProfilePage } from "@/views/fice/FinancialProfilePage";
import { InputsPage } from "@/views/fice/InputsPage";
import { SnapshotsPage } from "@/views/fice/SnapshotsPage";

import { AuditPage } from "@/views/tacl/AuditPage";
import { IntegrityPage } from "@/views/tacl/IntegrityPage";

import { NotFoundPage } from "@/views/system/NotFoundPage";
import { ErrorBoundaryPage } from "@/views/system/ErrorBoundaryPage";
import { ProtectedRoute } from "@/views/system/ProtectedRoute";
import { TransactionsPage } from "./views/transactions/TransactionsPage";
import { ForecastPage } from "@/views/analysis/ForecastPage";
import { SimulationsPage } from "@/views/analysis/SimulationsPage";

function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-white/60">Esta sección estará conectada en la siguiente fase.</p>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage />, errorElement: <ErrorBoundaryPage /> },
  { path: "/login", element: <LoginPage />, errorElement: <ErrorBoundaryPage /> },

  { path: "/dashboard", element: <Navigate to="/app/dashboard" replace /> },

  { path: "/fice/profile", element: <Navigate to="/app/finance/profile" replace /> },
  { path: "/fice/inputs", element: <Navigate to="/app/finance/inputs" replace /> },
  { path: "/fice/snapshots", element: <Navigate to="/app/system/snapshots" replace /> },

  { path: "/tacl/audit", element: <Navigate to="/app/system/audit" replace /> },
  { path: "/tacl/integrity", element: <Navigate to="/app/system/integrity" replace /> },

  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundaryPage />,
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },

      { path: "dashboard", element: <DashboardPage /> },

      { path: "finance/profile", element: <FinancialProfilePage /> },
      { path: "finance/inputs", element: <InputsPage /> },
      { path: "finance/transactions", element: <TransactionsPage /> },
      { path: "analysis/forecast", element: <ForecastPage /> },
      { path: "analysis/simulations", element: <SimulationsPage /> },
      { path: "system/audit", element: <AuditPage /> },
      { path: "system/integrity", element: <IntegrityPage /> },
      { path: "system/snapshots", element: <SnapshotsPage /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);