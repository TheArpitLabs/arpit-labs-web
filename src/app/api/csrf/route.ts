import { NextResponse } from "next/server";
import { initializeCSRF } from "@/lib/csrf";

export async function GET() {
  try {
    const token = await initializeCSRF();
    
    return NextResponse.json({ 
      success: true, 
      token,
      headerName: 'x-csrf-token'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
