import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/shell/AppShell";

import { LandingPage } from "@/views/landing/LandingPage";
import { LoginPage } from "@/views/auth/LoginPage";

import { DashboardPage } from "@/views/dashboard/DashboardPage";
import { FinancialProfilePage } from "@/views/fice/FinancialProfilePage";
//import { InputsPage } from "@/views/fice/InputsPage";
import { SnapshotsPage } from "@/views/fice/SnapshotsPage";

import { AuditPage } from "@/views/tacl/AuditPage";
import { IntegrityPage } from "@/views/tacl/IntegrityPage";

import { NotFoundPage } from "@/views/system/NotFoundPage";
import { ErrorBoundaryPage } from "@/views/system/ErrorBoundaryPage";
import { ProtectedRoute } from "@/views/system/ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage />, errorElement: <ErrorBoundaryPage /> },
  { path: "/login", element: <LoginPage />, errorElement: <ErrorBoundaryPage /> },

  // redirects por si entras a rutas antiguas
  { path: "/dashboard", element: <Navigate to="/app/dashboard" replace /> },
  { path: "/fice/profile", element: <Navigate to="/app/fice/profile" replace /> },
  { path: "/fice/inputs", element: <Navigate to="/app/fice/inputs" replace /> },
  { path: "/fice/snapshots", element: <Navigate to="/app/fice/snapshots" replace /> },
  { path: "/tacl/audit", element: <Navigate to="/app/tacl/audit" replace /> },
  { path: "/tacl/integrity", element: <Navigate to="/app/tacl/integrity" replace /> },

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

      { path: "fice/profile", element: <FinancialProfilePage /> },
//      { path: "fice/inputs", element: <InputsPage /> },
      { path: "fice/snapshots", element: <SnapshotsPage /> },

      { path: "tacl/audit", element: <AuditPage /> },
      { path: "tacl/integrity", element: <IntegrityPage /> },

      { path: "*", element: <NotFoundPage /> },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);