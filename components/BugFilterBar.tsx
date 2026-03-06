'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Filter, X } from 'lucide-react'

export default function BugFilterBar({ projects }: { projects: any[] }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [project, setProject] = useState(searchParams.get('project') || '')
    const [storyId, setStoryId] = useState(searchParams.get('story') || '')
    const [status, setStatus] = useState(searchParams.get('status') || '')
    const [severity, setSeverity] = useState(searchParams.get('severity') || '')
    const [startDate, setStartDate] = useState(searchParams.get('start') || '')
    const [endDate, setEndDate] = useState(searchParams.get('end') || '')

    // Update state if URL changes externally
    useEffect(() => {
        setProject(searchParams.get('project') || '')
        setStoryId(searchParams.get('story') || '')
        setStatus(searchParams.get('status') || '')
        setSeverity(searchParams.get('severity') || '')
        setStartDate(searchParams.get('start') || '')
        setEndDate(searchParams.get('end') || '')
    }, [searchParams])

    const applyFilters = () => {
        const params = new URLSearchParams()
        if (project) params.set('project', project)
        if (storyId) params.set('story', storyId)
        if (status) params.set('status', status)
        if (severity) params.set('severity', severity)
        if (startDate) params.set('start', startDate)
        if (endDate) params.set('end', endDate)

        router.push(`${pathname}?${params.toString()}`)
    }

    const clearFilters = () => {
        router.push(pathname)
    }

    return (
        <div style={{
            background: 'var(--card-bg)', border: '1px solid var(--border-color)',
            padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem',
            display: 'flex', flexDirection: 'column', gap: '1rem'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                <Filter size={18} /> Filters
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <select
                    value={project} onChange={e => setProject(e.target.value)}
                    style={{ background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.25rem', minWidth: '150px' }}
                >
                    <option value="">All Projects</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <input
                    type="text" value={storyId} onChange={e => setStoryId(e.target.value)}
                    placeholder="Story ID (e.g. PROJ-123)"
                    style={{ background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.25rem' }}
                />

                <select
                    value={status} onChange={e => setStatus(e.target.value)}
                    style={{ background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.25rem', minWidth: '120px' }}
                >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                </select>

                <select
                    value={severity} onChange={e => setSeverity(e.target.value)}
                    style={{ background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.25rem', minWidth: '120px' }}
                >
                    <option value="">All Severities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                        style={{ background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.25rem', colorScheme: 'dark' }}
                    />
                    <span style={{ color: 'var(--text-muted)' }}>to</span>
                    <input
                        type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                        style={{ background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.25rem', colorScheme: 'dark' }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                    onClick={clearFilters}
                    style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                    <X size={14} /> Clear
                </button>
                <button
                    onClick={applyFilters}
                    style={{ background: 'var(--primary-color)', border: 'none', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 500 }}
                >
                    Apply Filters
                </button>
            </div>
        </div>
    )
}
