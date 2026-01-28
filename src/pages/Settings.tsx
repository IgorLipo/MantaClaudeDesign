import { useParams, Navigate } from "react-router-dom";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ExportPreferencesForm } from "@/components/settings/ExportPreferencesForm";

export default function Settings() {
  const { tab } = useParams();
  const currentTab = tab || "profile";

  // Redirect base /settings to /settings/profile
  if (!tab) {
    return <Navigate to="/settings/profile" replace />;
  }

  // Validate tab
  if (!["profile", "exports"].includes(currentTab)) {
    return <Navigate to="/settings/profile" replace />;
  }

  return (
    <SettingsLayout>
      {currentTab === "profile" && <ProfileForm />}
      {currentTab === "exports" && <ExportPreferencesForm />}
    </SettingsLayout>
  );
}
