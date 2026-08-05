import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "matber-agro-erp-super-secret-key-2026-anwar"
);

export interface JWTSessionPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  depot_id: string | null;
  depot?: { name: string; code: string } | null;
  // Permissions
  can_create_do: boolean;
  can_edit_sales: boolean;
  can_delete_sales: boolean;
  can_create_sales: boolean;
  can_receive_stock: boolean;
  can_view_reports: boolean;
  can_view_accounting: boolean;
  can_manage_accounting: boolean;
}

export async function signJWT(payload: JWTSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTSessionPayload;
  } catch (err) {
    return null;
  }
}
