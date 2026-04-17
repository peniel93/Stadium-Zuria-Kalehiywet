import { NextResponse } from "next/server";

type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export function apiOk<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({
    success: true,
    data,
    error: null,
    meta: meta ?? null,
  });
}

export function apiError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
) {
  const error: ApiErrorBody = { code, message };

  if (details !== undefined) {
    error.details = details;
  }

  return NextResponse.json(
    {
      success: false,
      data: null,
      error,
      meta: null,
    },
    { status },
  );
}
