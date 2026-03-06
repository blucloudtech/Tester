'use client'

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell,
    PieChart, Pie
} from 'recharts'
import { Bug, Activity, ServerCrash, CheckCircle } from 'lucide-react'
import BugFilterBar from '@/components/BugFilterBar'

const SEVERITY_COLORS: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6'
};

const STATUS_COLORS: Record<string, string> = {
    open: '#3b82f6',
    in_progress: '#f59e0b',
    resolved: '#10b981',
    closed: '#6b7280'
};

export default function StoryReportClient({ bugs, projects }: { bugs: any[], projects: any[] }) {

    // 1. Group Bugs by Story
    const storyGroups = bugs.reduce((acc, bug) => {
        const storyId = bug.jira_story_id || 'Untagged';
        if (!acc[storyId]) {
            acc[storyId] = {
                id: storyId,
                total: 0,
                open: 0,
                in_progress: 0,
                resolved: 0,
                closed: 0,
                severities: { critical: 0, high: 0, medium: 0, low: 0 },
                bugs: []
            };
        }

        acc[storyId].total += 1;
        if (acc[storyId][bug.status] !== undefined) acc[storyId][bug.status] += 1;
        if (acc[storyId].severities[bug.severity] !== undefined) acc[storyId].severities[bug.severity] += 1;
        acc[storyId].bugs.push(bug);

        return acc;
    }, {} as Record<string, any>);

    const storyArray = Object.values(storyGroups).sort((a: any, b: any) => b.total - a.total);

    // Prepare chart data for top stories
    const topStoriesData = storyArray.slice(0, 5).map((s: any) => ({
        name: s.id,
        open: s.open,
        inProgress: s.in_progress,
        resolved: s.resolved,
        closed: s.closed,
        total: s.total
    }));

    // Overall metrics
    const totalBugs = bugs.length;
    const criticalBugs = bugs.filter(b => b.severity === 'critical').length;
    const resolvedBugs = bugs.filter(b => b.status === 'resolved' || b.status === 'closed').length;
    const completionRate = totalBugs > 0 ? Math.round((resolvedBugs / totalBugs) * 100) : 0;

    return (
        <div>
            <BugFilterBar projects={projects} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Filtered Bugs</span>
                    <span style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem' }}>{totalBugs}</span>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Critical Issues</span>
                    <span style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--danger-color)' }}>{criticalBugs}</span>
                </div>
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Resolution Rate</span>
                    <span style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--success-color)' }}>{completionRate}%</span>
                </div>
            </div>

            {storyArray.length > 0 && (
                <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Bugs per Story (Top 5)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={topStoriesData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="#6b7280" />
                                <YAxis stroke="#6b7280" />
                                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1e1e2d', border: 'none', borderRadius: '8px' }} />
                                <Legend />
                                <Bar dataKey="open" name="Open" stackId="a" fill={STATUS_COLORS.open} />
                                <Bar dataKey="inProgress" name="In Progress" stackId="a" fill={STATUS_COLORS.in_progress} />
                                <Bar dataKey="resolved" name="Resolved" stackId="a" fill={STATUS_COLORS.resolved} />
                                <Bar dataKey="closed" name="Closed" stackId="a" fill={STATUS_COLORS.closed} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <h3 style={{ marginBottom: '1rem' }}>Story Defect Matrix</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {storyArray.map((story: any) => (
                    <div key={story.id} className="glass" style={{ padding: '1.5rem', borderRadius: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <h4 style={{ fontSize: '1.1rem', margin: 0 }}>Story: {story.id}</h4>
                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontSize: '0.9rem' }}>
                                Total Bugs: <strong>{story.total}</strong>
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {/* Status Metrics */}
                            <div>
                                <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status Distribution</h5>
                                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Open</span> <span style={{ color: STATUS_COLORS.open }}>{story.open}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>In Progress</span> <span style={{ color: STATUS_COLORS.in_progress }}>{story.in_progress}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Resolved/Closed</span> <span style={{ color: STATUS_COLORS.resolved }}>{story.resolved + story.closed}</span></div>
                                </div>
                            </div>

                            {/* Severity Metrics */}
                            <div>
                                <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Severity Breakdown</h5>
                                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Critical</span> <span style={{ color: SEVERITY_COLORS.critical }}>{story.severities.critical}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>High</span> <span style={{ color: SEVERITY_COLORS.high }}>{story.severities.high}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Medium</span> <span style={{ color: SEVERITY_COLORS.medium }}>{story.severities.medium}</span></div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Low</span> <span style={{ color: SEVERITY_COLORS.low }}>{story.severities.low}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {storyArray.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <p>No bugs found matching the current filters.</p>
                    </div>
                )}
            </div>

        </div>
    )
}
