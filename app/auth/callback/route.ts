// app/auth/callback/route.ts
import { NextResponse } from "next/server"
import { createSupabaseServerClientApp } from "@/lib/supabase/server"

export async function GET(req: Request) {
    const { searchParams, origin } = new URL(req.url)
    const code = searchParams.get("code")
    if (code) {
        const supabase = createSupabaseServerClientApp()
        await supabase.auth.exchangeCodeForSession(code)
    }
    return NextResponse.redirect(new URL("/", origin))
}
