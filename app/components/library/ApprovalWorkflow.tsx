import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Textarea } from '../ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { useAuth } from '../../context/AuthContext'
import { CheckCircle, Clock, FileText, Eye, MessageSquare, AlertCircle, ExternalLink } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Label } from '../ui/label'
import {
  apiDownloadPaperFile,
  apiGetPendingPapers,
  apiGetRevisionPapers,
  apiGetReviewedPapers,
  apiReviewPaper,
  apiUploadCorrectedPaperFile,
} from '../../lib/api'
import type { ApiPaper } from '../../lib/api'

const ACCESS_TOKEN_KEY = 'murrs_access_token'

export function ApprovalWorkflow() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [pendingSubmissions, setPendingSubmissions] = useState<ApiPaper[]>([])
  const [approvedPapers, setApprovedPapers] = useState<ApiPaper[]>([])
  const [revisionRequested, setRevisionRequested] = useState<ApiPaper[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPaper, setSelectedPaper] = useState<ApiPaper | null>(null)
  const [reviewDecision, setReviewDecision] = useState('')
  const [reviewComments, setReviewComments] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [correctedFile, setCorrectedFile] = useState<File | null>(null)
  const [correctedNote, setCorrectedNote] = useState('')
  const [uploadingCorrectedFile, setUploadingCorrectedFile] = useState(false)
  const [documentViewerUrl, setDocumentViewerUrl] = useState<string | null>(null)
  const [documentViewerName, setDocumentViewerName] = useState<string>('')
  const [documentMimeType, setDocumentMimeType] = useState<string>('')
  const [documentLoading, setDocumentLoading] = useState(false)
  const isLibrarian = user?.role === 'librarian'
  const canUploadCorrection = user?.role === 'lecturer' || user?.role === 'project_supervisor'
  const correctedFileInputRef = useRef<HTMLInputElement | null>(null)

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
        apiGetReviewedPapers(token),
        apiGetRevisionPapers(token),
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

  const clearDocumentViewer = () => {
    if (documentViewerUrl) {
      URL.revokeObjectURL(documentViewerUrl)
    }
    setDocumentViewerUrl(null)
    setDocumentViewerName('')
    setDocumentMimeType('')
  }

  const handleDownloadDocument = async (paperId: number) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) {
      navigate('/login')
      return
    }

    setDocumentLoading(true)
    try {
      const { blob, filename } = await apiDownloadPaperFile(paperId, token)
      const resolvedName =
        (filename && !/^paper-\d+$/i.test(filename) ? filename : '') ||
        selectedPaper?.file_name ||
        selectedPaper?.title ||
        `paper-${paperId}`
      const resolvedMime = blob.type || selectedPaper?.mime_type || ''
      const url = URL.createObjectURL(blob)
      setDocumentViewerUrl(url)
      setDocumentViewerName(resolvedName)
      setDocumentMimeType(resolvedMime)

      const a = document.createElement('a')
      a.href = url
      a.download = resolvedName
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download paper')
    } finally {
      setDocumentLoading(false)
    }
  }

  const handleReview = async () => {
    if (!selectedPaper || !reviewDecision) return
    const token = localStorage.getItem(ACCESS_TOKEN_KEY)
    if (!token) {
      setReviewError('Missing auth token.')
      return
    }
    setReviewError('')
    setSubmittingReview(true)
    try {
      if (canUploadCorrection && correctedFile) {
        setUploadingCorrectedFile(true)
        const updated = await apiUploadCorrectedPaperFile(selectedPaper.id, correctedFile, correctedNote, token)
        setSelectedPaper(updated)
        setCorrectedFile(null)
        setCorrectedNote('')
        setUploadingCorrectedFile(false)
      }
      const decisionForApi = (isLibrarian && reviewDecision === 'publish' ? 'approve' : reviewDecision) as 'approve' | 'revision' | 'reject'
      await apiReviewPaper(selectedPaper.id, decisionForApi, reviewComments, token)
      setDialogOpen(false)
      setSelectedPaper(null)
      setReviewComments('')
      setReviewDecision('')
      await loadAll()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit review'
      setError(message)
      setReviewError(message)
      setUploadingCorrectedFile(false)
    } finally {
      setSubmittingReview(false)
    }
  }

  const openReviewDialog = (paper: ApiPaper) => {
    setSelectedPaper(paper)
    setDialogOpen(true)
    setReviewError('')
    setReviewComments('')
    setReviewDecision('')
    setCorrectedFile(null)
    setCorrectedNote('')
  }

  const handleCancel = () => {
    clearDocumentViewer()
    setDialogOpen(false)
    setSelectedPaper(null)
    setReviewError('')
    setReviewComments('')
    setReviewDecision('')
    setCorrectedFile(null)
    setCorrectedNote('')
  }

  useEffect(() => {
    if (!dialogOpen) {
      clearDocumentViewer()
    }
  }, [dialogOpen])

  const handlePickCorrectedFile = () => {
    correctedFileInputRef.current?.click()
  }

  const handleCorrectedFileSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCorrectedFile(file)
    e.currentTarget.value = ''
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">{isLibrarian ? 'Publication Workflow' : 'Approval Workflow'}</h2>
        <p className="text-muted-foreground">
          {isLibrarian
            ? 'Publish fully approved research papers'
            : 'Review and manage research paper submissions'}
        </p>
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
            {isLibrarian ? 'Ready to Publish' : 'Pending Review'}
            <Badge variant="destructive" className="ml-1">
              {pendingSubmissions.length}
            </Badge>
          </TabsTrigger>
          {!isLibrarian && (
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="size-4" />
              Approved
              <Badge variant="secondary" className="ml-1">
                {approvedPapers.length}
              </Badge>
            </TabsTrigger>
          )}
          {!isLibrarian && (
            <TabsTrigger value="revision" className="flex items-center gap-2">
              <AlertCircle className="size-4" />
              Revision Requested
              <Badge variant="secondary" className="ml-1">
                {revisionRequested.length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingSubmissions.map((paper) => (
            <Card key={paper.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">PAPER-{paper.id}</Badge>
                      <Badge>{isLibrarian ? 'Ready to Publish' : 'Pending'}</Badge>
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
                    {isLibrarian ? 'Review & Publish' : 'Review Paper'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {!isLibrarian && (
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
        )}

        {!isLibrarian && (
          <TabsContent value="revision" className="space-y-4">
          <Card>
            <CardContent className="pt-4 text-sm text-muted-foreground">
              Revision requested items are waiting for the student to resubmit an updated version. Reviewers cannot approve these until resubmission.
            </CardContent>
          </Card>
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
        )}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPaper?.title || 'Review Paper'}</DialogTitle>
            <DialogDescription>
              {isLibrarian ? 'Finalize publication for this submission' : 'Review and provide feedback for this submission'}
            </DialogDescription>
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
                  <div className="flex w-full items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-[120px]"
                      onClick={() => void handleDownloadDocument(selectedPaper.id)}
                      disabled={!isAuthenticated || documentLoading}
                    >
                      {documentLoading ? 'Downloading...' : 'Download'}
                    </Button>
                  </div>
                </div>
              </div>

              {documentViewerUrl && (
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      Document Workspace: {selectedPaper.title} ({documentViewerName || 'Document'})
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(documentViewerUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="size-4 mr-2" />
                      Open in New Tab
                    </Button>
                  </div>
                  {(documentMimeType || '').toLowerCase().includes('pdf') ? (
                    <iframe
                      src={documentViewerUrl}
                      title="Paper Document Viewer"
                      className="w-full h-[70vh] rounded border bg-white"
                    />
                  ) : (
                    <div className="rounded border p-3 text-sm text-muted-foreground">
                      This file format may not render inline in all browsers. Download to review and edit.
                    </div>
                  )}
                </div>
              )}

              {canUploadCorrection && (
                <div className="space-y-2">
                  <input
                    ref={correctedFileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleCorrectedFileSelected}
                  />
                  <Button
                    variant="outline"
                    onClick={handlePickCorrectedFile}
                    disabled={uploadingCorrectedFile}
                  >
                    {correctedFile ? 'Change Corrected File' : 'Upload Corrected Version'}
                  </Button>
                  {correctedFile && (
                    <p className="text-xs text-muted-foreground">
                      Attached: {correctedFile.name} (will send on Submit Review)
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="decision">{isLibrarian ? 'Publication Decision' : 'Review Decision'}</Label>
                  <Select value={reviewDecision} onValueChange={setReviewDecision}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLibrarian ? 'Select publication action' : 'Select decision'} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLibrarian ? (
                        <>
                          <SelectItem value="publish">Publish</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="approve">Approve</SelectItem>
                          <SelectItem value="revision">Request Revisions</SelectItem>
                          <SelectItem value="reject">Reject</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="comments">{isLibrarian ? 'Publication Notes' : 'Review Comments'}</Label>
                  <Textarea
                    id="comments"
                    placeholder={isLibrarian ? 'Optional notes for the author regarding publication...' : 'Provide detailed feedback for the author...'}
                    rows={6}
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  {reviewError && (
                    <p className="mr-auto text-sm text-destructive">{reviewError}</p>
                  )}
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={() => void handleReview()} disabled={!reviewDecision || submittingReview}>
                    {submittingReview ? 'Submitting...' : isLibrarian ? 'Publish Work' : 'Submit Review'}
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
