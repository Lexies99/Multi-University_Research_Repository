import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Textarea } from '../ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { useAuth } from '../../context/AuthContext'
import { CheckCircle, XCircle, Clock, FileText, Eye, MessageSquare, AlertCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Label } from '../ui/label'
import { apiDownloadPaperFile, apiGetPendingPapers, apiListPapers, apiReviewPaper } from '../../lib/api'
import type { ApiPaper } from '../../lib/api'

const ACCESS_TOKEN_KEY = 'murrs_access_token'

export function ApprovalWorkflow() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [pendingSubmissions, setPendingSubmissions] = useState<ApiPaper[]>([])
  const [approvedPapers, setApprovedPapers] = useState<ApiPaper[]>([])
  const [revisionRequested, setRevisionRequested] = useState<ApiPaper[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPaper, setSelectedPaper] = useState<ApiPaper | null>(null)
  const [reviewDecision, setReviewDecision] = useState('')
  const [reviewComments, setReviewComments] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadAll = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) {
      setError('Missing auth token.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const [pending, approved, revision] = await Promise.all([
        apiGetPendingPapers(token),
        apiListPapers({ status: 'approved', sort: 'newest', limit: 50 }),
        apiListPapers({ status: 'revision', sort: 'newest', limit: 50 }),
      ])
      setPendingSubmissions(pending)
      setApprovedPapers(approved)
      setRevisionRequested(revision)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  const handleDownload = async (paperId: number) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) {
      navigate('/login')
      return
    }
    try {
      const { blob, filename } = await apiDownloadPaperFile(paperId, token)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download paper')
    }
  }

  const handleReview = async () => {
    if (!selectedPaper || !reviewDecision) return
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) {
      setError('Missing auth token.')
      return
    }
    try {
      await apiReviewPaper(selectedPaper.id, reviewDecision as 'approve' | 'revision' | 'reject', reviewComments, token)
      setDialogOpen(false)
      setSelectedPaper(null)
      setReviewComments('')
      setReviewDecision('')
      await loadAll()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    }
  }

  const openReviewDialog = (paper: ApiPaper) => {
    setSelectedPaper(paper)
    setDialogOpen(true)
    setReviewComments('')
    setReviewDecision('')
  }

  const handleCancel = () => {
    setDialogOpen(false)
    setSelectedPaper(null)
    setReviewComments('')
    setReviewDecision('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Approval Workflow</h2>
        <p className="text-muted-foreground">Review and manage research paper submissions</p>
      </div>

      {loading && (
        <Card>
          <CardContent className="pt-6 text-muted-foreground">Loading workflow data...</CardContent>
        </Card>
      )}
      {error && (
        <Card>
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="size-4" />
            Pending Review
            <Badge variant="destructive" className="ml-1">
              {pendingSubmissions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="size-4" />
            Approved
            <Badge variant="secondary" className="ml-1">
              {approvedPapers.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="revision" className="flex items-center gap-2">
            <AlertCircle className="size-4" />
            Revision Requested
            <Badge variant="secondary" className="ml-1">
              {revisionRequested.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingSubmissions.map((paper) => (
            <Card key={paper.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">PAPER-{paper.id}</Badge>
                      <Badge>Pending</Badge>
                    </div>
                    <CardTitle className="mb-2">{paper.title}</CardTitle>
                    <CardDescription>
                      Submitted by {paper.authors.map((a) => a.name).join(', ') || 'Unknown'} • {paper.discipline || 'General'} • {paper.document_type || 'Research Paper'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-4" />
                      Submitted {paper.created_at ? new Date(paper.created_at).toLocaleDateString() : '-'}
                    </span>
                    <span>Status: {paper.status}</span>
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => openReviewDialog(paper)}>
                    <Eye className="size-4 mr-2" />
                    Review Paper
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedPapers.map((paper) => (
            <Card key={paper.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">PAPER-{paper.id}</Badge>
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="size-3 mr-1" />
                        Approved
                      </Badge>
                    </div>
                    <CardTitle className="mb-2">{paper.title}</CardTitle>
                    <CardDescription>
                      Author: {paper.authors.map((a) => a.name).join(', ') || 'Unknown'} • {paper.discipline || 'General'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>Downloads: {paper.downloads}</span>
                  <span>•</span>
                  <span>Views: {paper.views}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="revision" className="space-y-4">
          {revisionRequested.map((paper) => (
            <Card key={paper.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">PAPER-{paper.id}</Badge>
                      <Badge variant="secondary">
                        <AlertCircle className="size-3 mr-1" />
                        Revision Requested
                      </Badge>
                    </div>
                    <CardTitle className="mb-2">{paper.title}</CardTitle>
                    <CardDescription>
                      Author: {paper.authors.map((a) => a.name).join(', ') || 'Unknown'} • {paper.discipline || 'General'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-sm flex items-start gap-2">
                      <MessageSquare className="size-4 mt-0.5 shrink-0 text-orange-600" />
                      <span>{paper.review_comments || 'No review comments provided.'}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPaper?.title || 'Review Paper'}</DialogTitle>
            <DialogDescription>Review and provide feedback for this submission</DialogDescription>
          </DialogHeader>

          {selectedPaper && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Author</p>
                  <p className="text-sm text-muted-foreground">{selectedPaper.authors.map((a) => a.name).join(', ') || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Department</p>
                  <p className="text-sm text-muted-foreground">{selectedPaper.discipline || 'General'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Submission ID</p>
                  <p className="text-sm text-muted-foreground">PAPER-{selectedPaper.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Document Type</p>
                  <p className="text-sm text-muted-foreground">{selectedPaper.document_type || 'Research Paper'}</p>
                </div>
              </div>

              <div className="border rounded-lg p-8 bg-white dark:bg-card min-h-[200px] flex items-center justify-center">
                <div className="text-center space-y-2">
                  <FileText className="size-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Abstract preview</p>
                  <p className="text-xs text-muted-foreground max-w-md">{selectedPaper.abstract || 'No abstract available.'}</p>
                  <Button variant="outline" size="sm" onClick={() => void handleDownload(selectedPaper.id)} disabled={!isAuthenticated}>
                    <Eye className="size-4 mr-2" />
                    Open Full Document
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="decision">Review Decision</Label>
                  <Select value={reviewDecision} onValueChange={setReviewDecision}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select decision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approve">Approve</SelectItem>
                      <SelectItem value="revision">Request Revisions</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="comments">Review Comments</Label>
                  <Textarea
                    id="comments"
                    placeholder="Provide detailed feedback for the author..."
                    rows={6}
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={() => void handleReview()} disabled={!reviewDecision}>
                    Submit Review
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
