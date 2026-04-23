import type { VercelRequest } from "@vercel/node";
import { adminAuth } from "./_admin";

export async function verifyAuth(req: VercelRequest): Promise<string> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new Error("Unauthorized");
  const decoded = await adminAuth.verifyIdToken(header.slice(7));
  return decoded.uid;
}

export function ok(res: import("@vercel/node").VercelResponse, data: unknown) {
  res.status(200).json(data);
}

export function err(res: import("@vercel/node").VercelResponse, status: number, message: string) {
  res.status(status).json({ message });
}
