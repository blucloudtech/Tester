import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
    const supabase = await createClient()

    // 1. Fetch all Jira integrations to aggregate data across projects
    const { data: jiraIntegrations } = await supabase.from('integrations').select('*').eq('provider', 'jira');

    if (!jiraIntegrations || jiraIntegrations.length === 0) {
        return NextResponse.json({ error: 'No Jira integrations found' }, { status: 404 });
    }

    let allBugsRaw: any[] = [];
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const dateStr = oneDayAgo.toISOString().split('T')[0];

    // 2. Fetch bugs from Jira for each configured project
    for (const integration of jiraIntegrations) {
        if (!integration.config?.domain || !integration.config?.projectKey) continue;
        const config = integration.config;
        const basicAuth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
        const baseUrl = `https://${config.domain}.atlassian.net/rest/api/3/search`;
        
        // JQL: Created in last 24 hours
        const jql = `project = "${config.projectKey}" AND issuetype = "Bug" AND created >= "${dateStr}"`;
        
        try {
            const res = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${basicAuth}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ jql, maxResults: 50, fields: ['summary', 'status', 'priority', 'created'] })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.issues) {
                    const mappedIssues = data.issues.map((i: any) => ({
                        id: i.key,
                        summary: i.fields.summary,
                        severity: i.fields.priority?.name?.toLowerCase() || 'medium',
                        status: i.fields.status?.name || 'Open',
                        created_at: i.fields.created,
                        project_name: config.projectKey
                    }));
                    allBugsRaw = [...allBugsRaw, ...mappedIssues];
                }
            }
        } catch (e) {
            console.error("Daily report Jira fetch failed:", e);
        }
    }

    const criticalCount = allBugsRaw.filter(b => b.severity === 'highest' || b.severity === 'critical' || b.severity === 'high').length;
    const totalCount = allBugsRaw.length;

    // 3. Generate HTML Email Template
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { background-color: #1e1e2d; color: white; padding: 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .summary { padding: 20px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-around; }
        .stat { text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #111827; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        .content { padding: 20px; }
        .bug-item { border-left: 4px solid #d1d5db; padding-left: 15px; margin-bottom: 20px; }
        .bug-item.highest, .bug-item.critical { border-left-color: #ef4444; }
        .bug-item.high { border-left-color: #f97316; }
        .bug-title { font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 5px 0; }
        .bug-meta { font-size: 13px; color: #6b7280; margin: 0 0 10px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; background-color: #f9fafb; border-top: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Jira Daily Defect Report</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #9ca3af;">${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
          <div class="stat">
            <div class="stat-value">${totalCount}</div>
            <div class="stat-label">New Logged</div>
          </div>
          <div class="stat">
            <div class="stat-value" style="color: #ef4444;">${criticalCount}</div>
            <div class="stat-label">Action Required</div>
          </div>
        </div>

        <div class="content">
          <h2 style="font-size: 18px; color: #111827; margin-top: 0;">New Jira Issues (Last 24h)</h2>
          
          ${allBugsRaw.map(bug => `
            <div class="bug-item ${bug.severity}">
              <h3 class="bug-title">[${bug.id}] ${bug.summary}</h3>
              <p class="bug-meta">Project: ${bug.project_name} | Status: ${bug.status} | Severity: ${bug.severity}</p>
            </div>
          `).join('') || '<p>No new bugs logged in Jira yesterday! 🎉</p>'}
          
        </div>
        
        <div class="footer">
          Generated automatically by AI Bug Reporter.<br>
          <a href="#" style="color: #6366f1;">View full dashboard</a>
        </div>
      </div>
    </body>
    </html>
    `;

    return new NextResponse(htmlTemplate, {
        status: 200,
        headers: {
            'Content-Type': 'text/html'
        }
    })
}
