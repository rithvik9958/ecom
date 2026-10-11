import { revalidatePath } from "next/cache";
export const dynamic = 'force-dynamic';
export async function POST() {
  const response = Response.json({ success: true, message: "Logged out successfully" });
  
  // Clear the authentication cookie by expiring it immediately
  response.headers.set(
    "Set-Cookie",
    "admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
  );
  
  return response;
}
