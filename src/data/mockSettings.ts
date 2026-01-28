// Mock Settings Data - Finance Pulse Demo

export interface UserProfile {
  name: string;
  email: string;
  department: string;
  timezone: string;
  avatar: string | null;
}

export interface ExportPreferences {
  format: "pdf" | "csv" | "excel";
  pageSize: "letter" | "a4";
  orientation: "portrait" | "landscape";
  namingPattern: string;
}

export const demoProfile: UserProfile = {
  name: "Demo User",
  email: "demo@financepulse.app",
  department: "Finance",
  timezone: "America/New_York",
  avatar: null,
};

export const demoExportPrefs: ExportPreferences = {
  format: "pdf",
  pageSize: "letter",
  orientation: "portrait",
  namingPattern: "{report_name}_{date}",
};

export const departmentOptions = [
  { value: "finance", label: "Finance" },
  { value: "engineering", label: "Engineering" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
  { value: "hr", label: "Human Resources" },
];

export const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
];

export const exportFormatOptions = [
  { value: "pdf", label: "PDF" },
  { value: "csv", label: "CSV" },
  { value: "excel", label: "Excel (.xlsx)" },
];

export const pageSizeOptions = [
  { value: "letter", label: "Letter (8.5\" x 11\")" },
  { value: "a4", label: "A4 (210mm x 297mm)" },
];

export const orientationOptions = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];
