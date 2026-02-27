import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  apiDownloadPaperFile,
  apiHasReviewedPaperFile,
  apiDownloadReviewedPaperFile,
  apiGetMyPapers,
  apiGetPaperAnnotations,
  apiGetPaperStats,
  apiListStudents,
  apiListUsers,
} from '../../lib/api'
import type { ApiPaper, ApiPaperAnnotation, ApiPaperStats, ApiStudent, ApiUser } from '../../lib/api'

interface DashboardProps {
  userRole: string
}

export function Dashboard({ userRole }: DashboardProps) {
  const isAdmin = userRole === 'system_admin' || userRole === 'librarian' || userRole === 'head_library'
  const [stats, setStats] = useState<ApiPaperStats | null>(null)
  const [myPapers, setMyPapers] = useState<ApiPaper[]>([])
  const [hasReviewedByPaper, setHasReviewedByPaper] = useState<Record<number, boolean>>({})
  const [annotationsByPaper, setAnnotationsByPaper] = useState<Record<number, ApiPaperAnnotation[]>>({})
  const [students, setStudents] = useState<ApiStudent[]>([])
  const [users, setUsers] = useState<ApiUser[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const accessToken = localStorage.getItem('murrs_access_token')
        const [s, mine, userItems, studentItems] = await Promise.all([
          apiGetPaperStats(),
          accessToken ? apiGetMyPapers(accessToken) : Promise.resolve([]),
          accessToken && isAdmin ? apiListUsers(accessToken, { limit: 500 }) : Promise.resolve([]),
          accessToken && isAdmin ? apiListStudents(accessToken, { limit: 500 }) : Promise.resolve([]),
        ])
        if (cancelled) return
        setStats(s)
        setMyPapers(
          [...mine].sort(
            (a, b) =>
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime(),
          ),
        )
        setUsers(userItems)
        setStudents(studentItems)
      } catch {
        if (!cancelled) {
          setStats({ total_papers: 0, total_views: 0, total_downloads: 0, pending_reviews: 0 })
          setMyPapers([])
          setUsers([])
          setStudents([])
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isAdmin, userRole])

  useEffect(() => {
    if (!(userRole === 'member' || userRole === 'student')) return
    const accessToken = localStorage.getItem('murrs_access_token')
    if (!accessToken || myPapers.length === 0) {
      setHasReviewedByPaper({})
      return
    }
    let cancelled = false
    const run = async () => {
      const entries = await Promise.all(
        myPapers.map(async (paper) => {
          try {
            const ok = await apiHasReviewedPaperFile(paper.id, accessToken)
            return [paper.id, ok] as const
          } catch {
            return [paper.id, false] as const
          }
        }),
      )
      if (cancelled) return
      setHasReviewedByPaper(Object.fromEntries(entries))
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [myPapers, userRole])

  const roleCount = (role: string) =>
    users.filter((u) => (u.roles || [u.role]).map((r) => String(r).toLowerCase()).includes(role)).length

  const handleDownloadPaper = async (paperId: number) => {
    const accessToken = localStorage.getItem('murrs_access_token')
    if (!accessToken) return
    try {
      let blob: Blob
      let filename: string
      try {
        const reviewed = await apiDownloadReviewedPaperFile(paperId, accessToken)
        blob = reviewed.blob
        filename = reviewed.filename
      } catch {
        // Fallback for papers that do not yet have a supervisor-reviewed version.
        const latest = await apiDownloadPaperFile(paperId, accessToken)
        blob = latest.blob
        filename = latest.filename
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download file'
      window.alert(message)
    }
  }

  const handleLoadAnnotations = async (paperId: number) => {
    const accessToken = localStorage.getItem('murrs_access_token')
    if (!accessToken) return
    try {
      const rows = await apiGetPaperAnnotations(paperId, accessToken)
      setAnnotationsByPaper((prev) => ({ ...prev, [paperId]: rows }))
    } catch {
      setAnnotationsByPaper((prev) => ({ ...prev, [paperId]: [] }))
    }
  }

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

      {isAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Students (Imported)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl">{students.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Lecturers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl">{roleCount('lecturer')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">HODs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl">{roleCount('hod')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Project Supervisors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl">{roleCount('project_supervisor')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Project Coordinators</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl">{roleCount('project_coordinator')}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>People Overview</CardTitle>
              <CardDescription>Recent students and staff in the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Recent Students</p>
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No student records uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {students.slice(0, 8).map((s) => (
                      <div key={s.student_id} className="text-sm border rounded px-3 py-2 flex items-center justify-between gap-2">
                        <span>{s.full_name} ({s.student_id})</span>
                        <span className="text-muted-foreground">{s.department || '-'} / {s.year || '-'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Recent Staff Accounts</p>
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No staff accounts found.</p>
                ) : (
                  <div className="space-y-2">
                    {users.slice(0, 8).map((u) => (
                      <div key={u.id} className="text-sm border rounded px-3 py-2 flex items-center justify-between gap-2">
                        <span>{u.full_name || u.email}</span>
                        <span className="text-muted-foreground">{(u.roles && u.roles.length ? u.roles : [u.role]).join(', ')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

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
                    <p className="text-xs text-muted-foreground">
                      Reviewed file uploaded: {hasReviewedByPaper[paper.id] ? 'Yes' : 'No'}
                    </p>
                    {paper.review_comments && (
                      <p className="text-xs bg-muted rounded p-2">
                        Feedback: {paper.review_comments}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => void handleDownloadPaper(paper.id)}>
                        Download Reviewed File
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void handleLoadAnnotations(paper.id)}>
                        View Supervisor Notes
                      </Button>
                    </div>
                    {annotationsByPaper[paper.id] && (
                      <div className="space-y-2 rounded bg-muted/40 p-2">
                        {annotationsByPaper[paper.id].length === 0 ? (
                          <p className="text-xs text-muted-foreground">No annotation notes found.</p>
                        ) : (
                          annotationsByPaper[paper.id].map((annotation) => (
                            <div key={annotation.id} className="text-xs rounded border bg-background p-2">
                              <p className="font-medium">{annotation.location || 'General note'}</p>
                              <p>{annotation.text}</p>
                              <p className="text-muted-foreground">
                                {annotation.created_at ? new Date(annotation.created_at).toLocaleString() : ''}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
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
