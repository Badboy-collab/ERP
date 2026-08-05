export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "DEPOT_ADMIN" | "OPERATOR";
  depot_id: string | null;
  depot: { id: string; name: string; code: string } | null;
  // Granular Permissions
  can_create_do: boolean;
  can_edit_sales: boolean;
  can_delete_sales: boolean;
  can_create_sales: boolean;
  can_receive_stock: boolean;
  can_view_reports: boolean;
  can_view_accounting: boolean;
  can_manage_accounting: boolean;
}

const SESSION_KEY = "erp_active_user";

export function getSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSessionUser(user: SessionUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSessionUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function isSuperAdmin(user: SessionUser | null): boolean {
  return user?.role === "SUPER_ADMIN";
}

export function hasPermission(user: SessionUser | null, permission: keyof SessionUser): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  return Boolean(user[permission]);
}


