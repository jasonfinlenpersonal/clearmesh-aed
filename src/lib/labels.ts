import type { AccessType, ReportType } from "./schema";

export const EMERGENCY_NUMBER = "000";

export const ACCESS_LABELS: Record<AccessType, string> = {
  public_24_7: "Public, 24/7",
  business_hours: "Business hours",
  restricted: "Restricted access",
};

export const ACCESS_HINTS: Record<AccessType, string> = {
  public_24_7: "Anyone can reach it at any time.",
  business_hours: "Only reachable while the venue is open.",
  restricted: "Staff, members or residents only. Ask on site.",
};

// Map marker colours; also used for the legend.
export const ACCESS_COLOURS: Record<AccessType, string> = {
  public_24_7: "#16a34a",
  business_hours: "#d97706",
  restricted: "#6b7280",
};

export const REPORT_LABELS: Record<ReportType, string> = {
  missing: "AED is missing",
  not_working: "AED is not working / damaged",
  moved: "AED has moved",
  access_changed: "Access details are wrong",
  other: "Something else",
};
