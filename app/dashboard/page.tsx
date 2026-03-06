import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'
import { LogOut, LayoutDashboard, Bug, Settings, BarChart2 } from 'lucide-react'
import DashboardCharts from './DashboardCharts'
import BugFilterBar from '@/components/BugFilterBar'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<any> }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const resolvedParams = await searchParams;

    // Fetch projects for the filter bar
    const { data: projects } = await supabase.from('projects').select('id, name');

    // Get today's start date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    // Fetch total bugs today
    const { count: totalBugsToday } = await supabase
        .from('bugs')
        .select('*', { count: 'exact', head: true })
        .eq('reporter_id', user.id)
        .gte('created_at', today);

    // Fetch critical bugs today
    const { count: criticalBugsToday } = await supabase
        .from('bugs')
        .select('*', { count: 'exact', head: true })
        .eq('reporter_id', user.id)
        .eq('severity', 'critical')
        .gte('created_at', today);

    // Fetch active integrations
    const { count: activeIntegrations } = await supabase
        .from('integrations')
        .select('*', { count: 'exact', head: true });

    // Fetch all bugs for analytics
    let bugsQuery = supabase
        .from('bugs')
        .select('*')
        .eq('reporter_id', user.id);

    // Apply URL filters
    if (resolvedParams.project) bugsQuery = bugsQuery.eq('project_id', resolvedParams.project);
    if (resolvedParams.story) bugsQuery = bugsQuery.eq('jira_story_id', resolvedParams.story);
    if (resolvedParams.status) bugsQuery = bugsQuery.eq('status', resolvedParams.status);
    if (resolvedParams.severity) bugsQuery = bugsQuery.eq('severity', resolvedParams.severity);
    if (resolvedParams.start) bugsQuery = bugsQuery.gte('created_at', new Date(resolvedParams.start).toISOString());
    if (resolvedParams.end) {
        const endDate = new Date(resolvedParams.end);
        endDate.setDate(endDate.getDate() + 1);
        bugsQuery = bugsQuery.lt('created_at', endDate.toISOString());
    }

    const { data: allBugsRaw, error: allBugsError } = await bugsQuery;

    if (allBugsError) {
        console.error("Dashboard Supabase Error:", allBugsError);
    }
    const allBugs = allBugsRaw || [];

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={`${styles.sidebar} glass`}>
                <div className={styles.sidebarHeader}>
                    <Bug className="text-gradient" size={28} />
                    <h2>AI Reporter</h2>
                </div>

                <nav className={styles.sidebarNav}>
                    <Link href="/dashboard" className={`${styles.navItem} ${styles.active}`}>
                        <LayoutDashboard size={20} />
                        <span>My Dashboard</span>
                    </Link>
                    <Link href="/bugs" className={styles.navItem}>
                        <Bug size={20} />
                        <span>My Bugs</span>
                    </Link>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Link href="/reports" className={styles.navItem}>
                            <BarChart2 size={20} />
                            <span>Reports</span>
                        </Link>
                        <Link href="/reports/story" className={styles.navItem} style={{ paddingLeft: '3rem', fontSize: '0.9rem' }}>
                            <span>Story Reports</span>
                        </Link>
                    </div>
                    <Link href="/settings" className={styles.navItem}>
                        <Settings size={20} />
                        <span>Settings</span>
                    </Link>
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.userDetails}>
                            <span className={styles.userName}>{user.user_metadata?.full_name || 'User'}</span>
                            <span className={styles.userEmail}>{user.email}</span>
                            <span className={styles.userEmail} style={{ fontSize: '0.7rem', color: 'var(--primary-color)' }}>Tester</span>
                        </div>
                    </div>
                    <form action={async () => {
                        'use server'
                        const sb = await createClient()
                        await sb.auth.signOut()
                        redirect('/login')
                    }}>
                        <button className={styles.logoutBtn} title="Log Out">
                            <LogOut size={18} />
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <header className={styles.topbar}>
                    <h1>My Tester Dashboard</h1>
                    <div className={styles.actions}>
                        <Link href="/bugs/new" className={styles.primaryBtn} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Bug size={16} /> Report New Bug
                        </Link>
                    </div>
                </header>

                <div className={styles.dashboardGrid}>
                    {/* Stats Cards */}
                    <div className={`${styles.statCard} glass`}>
                        <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger-color)' }}>
                            <Bug size={24} />
                        </div>
                        <div className={styles.statData}>
                            <h3>{criticalBugsToday || 0}</h3>
                            <p>My Critical Bugs Today</p>
                        </div>
                    </div>

                    <div className={`${styles.statCard} glass`}>
                        <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}>
                            <BarChart2 size={24} />
                        </div>
                        <div className={styles.statData}>
                            <h3>{totalBugsToday || 0}</h3>
                            <p>Total Logged Today</p>
                        </div>
                    </div>

                    <div className={`${styles.statCard} glass`}>
                        <div className={styles.statIcon} style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success-color)' }}>
                            <Settings size={24} />
                        </div>
                        <div className={styles.statData}>
                            <h3>{allBugs?.length || 0}</h3>
                            <p>Lifetime Bugs Reported</p>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <BugFilterBar projects={projects || []} />
                </div>

                <DashboardCharts bugs={allBugs || []} />

            </main>
        </div>
    )
}
