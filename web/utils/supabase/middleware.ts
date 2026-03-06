import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // refreshing the auth token
    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    if (
        !user &&
        !path.startsWith('/login') &&
        !path.startsWith('/signup') &&
        path !== '/'
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user) {
        // Fetch the active user's role from the public.users table
        const { data: roleData } = await supabase.from('users').select('role').eq('id', user.id).single()
        const role = roleData?.role || 'tester'

        // Protect Admin Routes
        if (path.startsWith('/dashboard/admin') && role !== 'admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }

        // Protect Team Lead Routes
        if (path.startsWith('/dashboard/lead') && role !== 'admin' && role !== 'qa_lead') {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }

        // Redirect logged-in users away from auth pages
        if (path === '/login' || path === '/signup' || path === '/') {
            const url = request.nextUrl.clone()

            // Optional: route admins automatically to admin dash
            if (role === 'admin') url.pathname = '/dashboard/admin'
            else if (role === 'qa_lead') url.pathname = '/dashboard/lead'
            else url.pathname = '/dashboard'

            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
