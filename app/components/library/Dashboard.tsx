import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { apiGetMyPapers, apiGetPaperStats, apiListPapers } from '../../lib/api'
import type { ApiPaper, ApiPaperStats } from '../../lib/api'

interface DashboardProps {
  userRole: string
}

export function Dashboard({ userRole }: DashboardProps) {
  const canReview = userRole === 'librarian' || userRole === 'project_coordinator' || userRole === 'hod' || userRole === 'lecturer'
  const [stats, setStats] = useState<ApiPaperStats | null>(null)
  const [recent, setRecent] = useState<Array<{ action: string; title: string; time: string; status: string }>>([])
  const [myPapers, setMyPapers] = useState<ApiPaper[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const accessToken = localStorage.getItem('murrs_access_token')
        const [s, papers, mine] = await Promise.all([
          apiGetPaperStats(),
          apiListPapers({ sort: 'newest', limit: 3, status: canReview ? undefined : 'approved' }),
          accessToken ? apiGetMyPapers(accessToken) : Promise.resolve([]),
        ])
        if (cancelled) return
        setStats(s)
        setRecent(
          papers.map((p) => ({
            action: p.status === 'approved' ? 'Paper Approved' : 'New Submission',
            title: p.title,
            time: p.created_at ? new Date(p.created_at).toLocaleString() : 'recently',
            status: p.status,
          })),
        )
        setMyPapers(mine)
      } catch {
        if (!cancelled) {
          setStats({ total_papers: 0, total_views: 0, total_downloads: 0, pending_reviews: 0 })
          setRecent([])
          setMyPapers([])
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [canReview, userRole])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Papers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats?.total_papers ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats?.total_views?.toLocaleString() ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats?.total_downloads?.toLocaleString() ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats?.pending_reviews ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest submissions and approvals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              recent.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 border-l-2 border-l-primary/20 pl-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{activity.action}</span>: {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge variant={activity.status === 'approved' ? 'default' : activity.status === 'revision' ? 'secondary' : 'outline'}>
                    {activity.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {(userRole === 'member' || userRole === 'student') && (
        <Card>
          <CardHeader>
            <CardTitle>My Submissions</CardTitle>
            <CardDescription>Supervisor decisions and feedback on your work</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myPapers.length === 0 ? (
                <p className="text-sm text-muted-foreground">You have not submitted any papers yet.</p>
              ) : (
                myPapers.map((paper) => (
                  <div key={paper.id} className="p-3 border rounded-md space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{paper.title}</p>
                      <Badge variant={paper.status === 'approved' ? 'default' : paper.status === 'revision' ? 'secondary' : 'outline'}>
                        {paper.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted: {paper.created_at ? new Date(paper.created_at).toLocaleString() : '-'}
                    </p>
                    {paper.review_comments && (
                      <p className="text-xs bg-muted rounded p-2">
                        Feedback: {paper.review_comments}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
