import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, ShieldAlert } from 'lucide-react'
import styles from '../../page.module.css'

export default async function AdminUsersPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch all users
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className={styles.layout}>
            <header className={styles.topbar} style={{ padding: '2rem 3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link href="/dashboard/admin" className={styles.backBtn} style={{ color: 'var(--text-muted)' }}>
                    <ArrowLeft size={20} />
                </Link>
                <h1><Users size={28} className={styles.titleIcon} style={{ color: 'var(--primary-color)' }} /> User Management</h1>
            </header>

            <main className={styles.mainContent} style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '0' }}>
                <div className={`${styles.docSection} glass`} style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                        <h2>Platform Members</h2>
                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '0.9rem' }}>
                            {users?.length || 0} Total
                        </span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem', fontWeight: 500 }}>Name</th>
                                <th style={{ padding: '1rem', fontWeight: 500 }}>Email</th>
                                <th style={{ padding: '1rem', fontWeight: 500 }}>Role</th>
                                <th style={{ padding: '1rem', fontWeight: 500 }}>Joined</th>
                                <th style={{ padding: '1rem', fontWeight: 500 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users?.map((u) => (
                                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', color: 'white' }}>{u.full_name || 'N/A'} {u.id === user.id ? '(You)' : ''}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.2)' : u.role === 'qa_lead' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                            color: u.role === 'admin' ? '#fca5a5' : u.role === 'qa_lead' ? '#86efac' : '#93c5fd',
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                        }}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button disabled className={styles.outlineBtn} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', opacity: 0.5 }}>
                                            Edit Role
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    )
}
