import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart2 } from 'lucide-react'
import StoryReportClient from './StoryReportClient'

export default async function StoryReportPage({ searchParams }: { searchParams: Promise<any> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const resolvedParams = await searchParams;

    // Fetch projects for the filter bar
    const { data: projects } = await supabase.from('projects').select('id, name')

    // Build the query dynamically based on searchParams
    let query = supabase.from('bugs').select('*')

    // Start with basic visibility context (Tester sees own, Lead/Admin see project scope)
    // For simplicity, we just pull everything this user created or is assigned to.

    // Apply filters from URL
    if (resolvedParams.project) query = query.eq('project_id', resolvedParams.project)
    if (resolvedParams.story) query = query.eq('jira_story_id', resolvedParams.story)
    if (resolvedParams.status) query = query.eq('status', resolvedParams.status)
    if (resolvedParams.severity) query = query.eq('severity', resolvedParams.severity)

    // Apply Date Range
    if (resolvedParams.start) {
        query = query.gte('created_at', new Date(resolvedParams.start).toISOString())
    }
    if (resolvedParams.end) {
        // Add 1 day to the end date to include the entire day
        const endDate = new Date(resolvedParams.end)
        endDate.setDate(endDate.getDate() + 1)
        query = query.lt('created_at', endDate.toISOString())
    }

    const { data: bugs, error } = await query

    if (error) {
        console.error("Story Report Error:", error)
    }

    return (
        <div style={{ padding: '2rem 3rem', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none' }}>
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>
                    <h1 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BarChart2 size={24} className="text-gradient" />
                        Story-wise Defect Report
                    </h1>
                </div>
            </header>

            <main>
                <StoryReportClient bugs={bugs || []} projects={projects || []} />
            </main>
        </div>
    )
}
