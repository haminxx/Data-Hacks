/** Demo enterprise gate — replace with real auth / cookies when backend is ready. */
export const ENTERPRISE_SESSION_KEY = "ss_enterprise_session";

export function setEnterpriseSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ENTERPRISE_SESSION_KEY, "1");
}

export function clearEnterpriseSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ENTERPRISE_SESSION_KEY);
}

export function hasEnterpriseSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ENTERPRISE_SESSION_KEY) === "1";
}
