import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "matber-agro-erp-super-secret-key-2026-anwar"
);

export interface JWTSessionPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  org_id: string;
  org_name: string;
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

export async function getSession(request?: Request): Promise<JWTSessionPayload | null> {
  try {
    // In Next.js API routes we can use the cookies() helper
    // If a request object is provided (e.g., in edge runtime), use its headers
    let token: string | undefined;
    if (request) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').map(c => c.trim());
        const sessionCookie = cookies.find(c => c.startsWith('session='));
        if (sessionCookie) token = sessionCookie.split('=')[1];
      }
    } else {
      // Server‑side usage inside Next.js route handlers
      // @ts-ignore – next/headers is only available in the app router
      const { cookies } = await import('next/headers');
      token = cookies().get('session')?.value;
    }
    if (!token) return null;
    return await verifyJWT(token);
  } catch {
    return null;
  }
}

