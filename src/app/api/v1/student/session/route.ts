import { NextResponse } from "next/server";
import { apiError, apiOk } from "@/lib/api/response";
import { isSupabaseConfigured } from "@/lib/config/env";
import { authenticateStudent } from "@/lib/supabase/admin-advanced-repo";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return apiError(503, "SUPABASE_NOT_CONFIGURED", "Supabase is not configured.");
  }

  try {
    const body = (await request.json()) as { identityNumber?: string; username?: string };

    const identityNumber = body.identityNumber?.trim();
    const username = body.username?.trim().toLowerCase();

    if (!identityNumber || !username) {
      throw new Error("identityNumber and username are required.");
    }

    const identity = await authenticateStudent(identityNumber, username);

    if (!identity) {
      return apiError(401, "INVALID_STUDENT_CREDENTIALS", "Invalid student credentials.");
    }

    const response = apiOk({
      identityNumber: identity.identity_number,
      username: identity.username,
    });

    response.cookies.set("student-identity-id", identity.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      httpOnly: true,
    });

    return response;
  } catch (error) {
    return apiError(400, "STUDENT_SESSION_CREATE_FAILED", "Failed to create student session.", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    data: { loggedOut: true },
    error: null,
    meta: null,
  });

  response.cookies.set("student-identity-id", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    httpOnly: true,
  });

  return response;
}
