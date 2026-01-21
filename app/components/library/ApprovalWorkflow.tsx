import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, Clock, FileText, Eye, MessageSquare, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

const pendingSubmissions = [
  {
    id: 'MURRS-2024-1234',
    title: 'Machine Learning Optimization in Cloud Computing Environments',
    author: 'John Smith',
    department: 'Computer Science',
    submittedDate: '2024-12-14',
    daysWaiting: 2,
    documentType: 'Thesis',
    stage: 'Supervisor Review',
  },
  {
    id: 'MURRS-2024-1235',
    title: 'Impact of Climate Change on Coastal Ecosystems',
    author: 'Emma Wilson',
    department: 'Environmental Science',
    submittedDate: '2024-12-13',
    daysWaiting: 3,
    documentType: 'Research Paper',
    stage: 'Peer Review',
  },
];

const approvedPapers = [
  {
    id: 'MURRS-2024-1200',
    title: 'Quantum Algorithms for Cryptography',
    author: 'Sarah Johnson',
    department: 'Physics',
    approvedDate: '2024-12-10',
    reviewer: 'Prof. Anderson',
  },
];

const revisionRequested = [
  {
    id: 'MURRS-2024-1220',
    title: 'Social Media Impact on Mental Health',
    author: 'Lisa Anderson',
    department: 'Psychology',
    requestedDate: '2024-12-11',
    reason: 'Minor revisions needed in methodology section',
    reviewer: 'Prof. Thompson',
  },
];

export function ApprovalWorkflow() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
  const [reviewDecision, setReviewDecision] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDownload = (paperId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    alert(`Downloaded paper ${paperId}`);
  };

  const handleReview = (paperId: string, decision: 'approve' | 'reject' | 'revision') => {
    alert(`Paper ${paperId} has been ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'sent back for revision'}`);
    setDialogOpen(false);
    setSelectedPaper(null);
    setReviewComments('');
    setReviewDecision('');
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setReviewComments('');
    setReviewDecision('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Approval Workflow</h2>
        <p className="text-muted-foreground">
          Review and manage research paper submissions
        </p>
      </div>

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
                      <Badge variant="outline">{paper.id}</Badge>
                      <Badge>{paper.stage}</Badge>
                      {paper.daysWaiting > 3 && (
                        <Badge variant="destructive">Urgent</Badge>
                      )}
                    </div>
                    <CardTitle className="mb-2">{paper.title}</CardTitle>
                    <CardDescription>
                      Submitted by {paper.author} • {paper.department} • {paper.documentType}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-4" />
                      Submitted {paper.submittedDate}
                    </span>
                    <span className={paper.daysWaiting > 3 ? 'text-destructive' : ''}>
                      Waiting {paper.daysWaiting} days
                    </span>
                  </div>

                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger>
                      <Button variant="outline" className="w-full">
                        <Eye className="size-4 mr-2" />
                        Review Paper
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{paper.title}</DialogTitle>
                        <DialogDescription>
                          Review and provide feedback for this submission
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                          <div>
                            <p className="text-sm font-medium">Author</p>
                            <p className="text-sm text-muted-foreground">{paper.author}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Department</p>
                            <p className="text-sm text-muted-foreground">{paper.department}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Submission ID</p>
                            <p className="text-sm text-muted-foreground">{paper.id}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Document Type</p>
                            <p className="text-sm text-muted-foreground">{paper.documentType}</p>
                          </div>
                        </div>

                        <div className="border rounded-lg p-8 bg-white dark:bg-card min-h-[300px] flex items-center justify-center">
                          <div className="text-center space-y-2">
                            <FileText className="size-12 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              PDF Document Preview
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownload(paper.id)}
                              disabled={!isAuthenticated}
                            >
                              <Eye className="size-4 mr-2" />
                              Open Full Document
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="decision">Review Decision</Label>
                            <Select
                              value={reviewDecision}
                              onValueChange={setReviewDecision}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select decision" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="approve">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="size-4 text-green-600" />
                                    Approve
                                  </div>
                                </SelectItem>
                                <SelectItem value="revision">
                                  <div className="flex items-center gap-2">
                                    <AlertCircle className="size-4 text-orange-600" />
                                    Request Revisions
                                  </div>
                                </SelectItem>
                                <SelectItem value="reject">
                                  <div className="flex items-center gap-2">
                                    <XCircle className="size-4 text-red-600" />
                                    Reject
                                  </div>
                                </SelectItem>
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
                            <Button
                              onClick={() => reviewDecision && handleReview(paper.id, reviewDecision as any)}
                              disabled={!reviewDecision}
                            >
                              Submit Review
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
                      <Badge variant="outline">{paper.id}</Badge>
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="size-3 mr-1" />
                        Approved
                      </Badge>
                    </div>
                    <CardTitle className="mb-2">{paper.title}</CardTitle>
                    <CardDescription>
                      Author: {paper.author} • {paper.department}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>Approved on {paper.approvedDate}</span>
                  <span>•</span>
                  <span>Reviewed by {paper.reviewer}</span>
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
                      <Badge variant="outline">{paper.id}</Badge>
                      <Badge variant="secondary">
                        <AlertCircle className="size-3 mr-1" />
                        Revision Requested
                      </Badge>
                    </div>
                    <CardTitle className="mb-2">{paper.title}</CardTitle>
                    <CardDescription>
                      Author: {paper.author} • {paper.department}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>Requested on {paper.requestedDate}</span>
                    <span>•</span>
                    <span>By {paper.reviewer}</span>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-sm flex items-start gap-2">
                      <MessageSquare className="size-4 mt-0.5 shrink-0 text-orange-600" />
                      <span>{paper.reason}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
