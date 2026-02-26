// Placeholder for specific Payment Method API Route
// Handles GET (one), PUT, and DELETE

import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ methodId: string }> }
) {
  const { methodId } = await params;
  return new Response(`Not Implemented: ${methodId}`, { status: 501 });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ methodId: string }> }
) {
  const { methodId } = await params;
  return new Response(`Not Implemented: ${methodId}`, { status: 501 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ methodId: string }> }
) {
  const { methodId } = await params;
  return new Response(`Not Implemented: ${methodId}`, { status: 501 });
}
