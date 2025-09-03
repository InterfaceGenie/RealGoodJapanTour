// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr"
import type { NextApiRequest, NextApiResponse } from "next"

export async function createSupabaseServerClientApp() {
    const { cookies } = await import("next/headers")
    const cookieStore = cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get: (name: string) => cookieStore.get(name)?.value,
                set: (name: string, value: string, options: any) =>
                    cookieStore.set({ name, value, ...options }),
                remove: (name: string, options: any) =>
                    cookieStore.set({ name, value: "", ...options, maxAge: 0 }),
            },
        }
    )
}

/**
 * Use this in the PAGES ROUTER (/pages/**, API routes, getServerSideProps).
 * Does NOT import `next/headers`.
 */
export function createSupabaseServerClientPages(req: NextApiRequest, res: NextApiResponse) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get: (name: string) => (req as any).cookies?.[name],
                set: (name: string, value: string, options: any) =>
                    res.setHeader("Set-Cookie", serializeCookie(name, value, options)),
                remove: (name: string, options: any) =>
                    res.setHeader("Set-Cookie", serializeCookie(name, "", { ...options, maxAge: 0 })),
            },
        }
    )
}

/* Minimal cookie serializer (no extra deps) */
function serializeCookie(name: string, val: string, options: any = {}) {
    const enc = encodeURIComponent
    let cookie = `${name}=${enc(val)}`
    if (options.maxAge != null) cookie += `; Max-Age=${Math.floor(options.maxAge)}`
    if (options.domain) cookie += `; Domain=${options.domain}`
    cookie += `; Path=${options.path ?? "/"}`
    if (options.expires) cookie += `; Expires=${toUTC(options.expires)}`
    if (options.httpOnly) cookie += `; HttpOnly`
    if (options.secure ?? process.env.NODE_ENV === "production") cookie += `; Secure`
    if (options.sameSite) cookie += `; SameSite=${options.sameSite}`
    return cookie
}
function toUTC(d: Date | string) {
    return (typeof d === "string" ? new Date(d) : d).toUTCString()
}
