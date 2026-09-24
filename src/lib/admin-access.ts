export type AdminProfile = { role: "owner" | "editor"; active: true; display_name: string | null };
export function isActiveAdmin(profile: { role: string; active: boolean; display_name: string | null } | null): profile is AdminProfile {
  return profile !== null && profile.active === true && (profile.role === "owner" || profile.role === "editor");
}
