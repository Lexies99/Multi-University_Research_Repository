import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Upload, FileText, X, Plus } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { apiListSupervisors, apiUploadPaper, type ApiUser } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const DISCIPLINES_BY_SCHOOL: Record<string, string[]> = {
  'Business School': [
    'Business Administration',
    'Accounting and Finance',
  ],
  'School of Public Service and Governance': [
    'Public Service and Governance',
  ],
  'Faculty of Law': [
    'Law',
  ],
  'School of Technology and Social Sciences (SOTSS)': [
    'Computer Science and Information Systems',
    'Information Systems and Innovation',
    'Economics and Hospitality Studies',
    'Liberal Arts and Communication Studies',
  ],
}

const ALL_DISCIPLINES = [
  'Business Administration',
  'Accounting and Finance',
  'Public Service and Governance',
  'Law',
  'Computer Science and Information Systems',
  'Information Systems and Innovation',
  'Economics and Hospitality Studies',
  'Liberal Arts and Communication Studies',
]

export function DocumentUpload() {
  const { user } = useAuth()
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [authors, setAuthors] = useState([{ name: '' }]);
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    keywords: '',
    discipline: '',
    documentType: '',
    license: '',
  });
  const [submitMessage, setSubmitMessage] = useState('');
  const [supervisors, setSupervisors] = useState<ApiUser[]>([]);
  const [supervisorId, setSupervisorId] = useState('');
  const disciplineOptions = useMemo(
    () => DISCIPLINES_BY_SCHOOL[user?.university || ''] || ALL_DISCIPLINES,
    [user?.university],
  )

  useEffect(() => {
    let cancelled = false
    const loadSupervisors = async () => {
      const accessToken = localStorage.getItem('murrs_access_token')
      if (!accessToken || (user?.role !== 'member' && user?.role !== 'student')) return
      try {
        const items = await apiListSupervisors(accessToken)
        if (!cancelled) setSupervisors(items)
      } catch {
        if (!cancelled) setSupervisors([])
      }
    }
    void loadSupervisors()
    return () => {
      cancelled = true
    }
  }, [user?.role])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage('');
    const accessToken = localStorage.getItem('murrs_access_token');
    if (!accessToken) {
      setSubmitMessage('Please sign in to upload a paper.');
      return;
    }
    if (!selectedFile) {
      setSubmitMessage('Please attach a file before submitting.');
      return;
    }
    if ((user?.role === 'member' || user?.role === 'student') && !supervisorId) {
      setSubmitMessage('Please assign a supervisor before submitting.');
      return;
    }
    setIsUploading(true);
    setUploadProgress(25);

    try {
      const created = await apiUploadPaper(
        {
          title: formData.title,
          abstract: formData.abstract,
          discipline: formData.discipline,
          university: user?.university || 'GIMPA',
          document_type: formData.documentType,
          license: formData.license,
          file: selectedFile,
          tags: formData.keywords.split(',').map((k) => k.trim()).filter(Boolean),
          authors: authors.map((a) => ({
            name: a.name,
          })),
          supervisor_id: supervisorId ? Number(supervisorId) : undefined,
        },
        accessToken,
      );

      setUploadProgress(100);
      setSubmitMessage(
        `Submission sent successfully. Paper ID: ${created.id}. It is now in lecturer review (${created.status}), and notification emails have been queued.`,
      );
      setSelectedFile(null);
      setFormData({
        title: '',
        abstract: '',
        keywords: '',
        discipline: '',
        documentType: '',
        license: '',
      });
      setAuthors([{ name: '' }]);
      setSupervisorId('');
    } catch (err) {
      setSubmitMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const addAuthor = () => {
    setAuthors([...authors, { name: '' }]);
  };

  const removeAuthor = (index: number) => {
    setAuthors(authors.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl mb-2">Submit Research Paper</h2>
        <p className="text-muted-foreground">
          Upload your research paper for review and approval
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {submitMessage && (
          <Card>
            <CardContent className="pt-4 text-sm">{submitMessage}</CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
            <CardDescription>Upload your research paper (PDF, DOCX, max 500MB)</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="size-12 mx-auto text-primary" />
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <X className="size-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="size-12 mx-auto text-muted-foreground" />
                  <p className="font-medium">Drop your file here or click to browse</p>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: PDF, DOCX, LaTeX
                  </p>
                </div>
              )}
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.docx,.tex"
                onChange={handleFileSelect}
              />
            </div>

            {isUploading && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading and validating...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.role === 'librarian' && (
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Supervisor filtering applies to member accounts.
              </div>
            )}
            {(user?.role === 'member' || user?.role === 'student') && (
              <div>
                <Label htmlFor="supervisor">Assign Supervisor *</Label>
                <Select value={supervisorId} onValueChange={setSupervisorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select supervisor for approval" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.length === 0 && (
                      <SelectItem value="__none__" disabled>
                        No lecturers found in your school
                      </SelectItem>
                    )}
                    {supervisors.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.full_name || s.email} ({s.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter research paper title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="abstract">Abstract *</Label>
              <Textarea
                id="abstract"
                placeholder="Enter paper abstract (250-500 words)"
                rows={6}
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discipline">Discipline *</Label>
                <Select
                  value={formData.discipline}
                  onValueChange={(value) => setFormData({ ...formData, discipline: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplineOptions.map((discipline) => (
                      <SelectItem key={discipline} value={discipline}>
                        {discipline}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="documentType">Document Type *</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thesis">Thesis</SelectItem>
                    <SelectItem value="dissertation">Dissertation</SelectItem>
                    <SelectItem value="research-paper">Research Paper</SelectItem>
                    <SelectItem value="conference-paper">Conference Paper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="keywords">Keywords *</Label>
              <Input
                id="keywords"
                placeholder="Enter keywords separated by commas"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authors</CardTitle>
            <CardDescription>Add all authors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authors.map((author, index) => (
              <div key={index} className="space-y-3 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <Badge variant="outline">Author {index + 1}</Badge>
                  {authors.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAuthor(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      placeholder="Full name"
                      value={author.name}
                      onChange={(e) => {
                        const newAuthors = [...authors];
                        newAuthors[index].name = e.target.value;
                        setAuthors(newAuthors);
                      }}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addAuthor}>
              <Plus className="size-4 mr-2" />
              Add Author
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Copyright & License</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="license">License Type *</Label>
              <Select
                value={formData.license}
                onValueChange={(value) => setFormData({ ...formData, license: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select license" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cc-by">CC BY - Attribution</SelectItem>
                  <SelectItem value="cc-by-sa">CC BY-SA - Attribution-ShareAlike</SelectItem>
                  <SelectItem value="cc-by-nc">CC BY-NC - Attribution-NonCommercial</SelectItem>
                  <SelectItem value="all-rights-reserved">All Rights Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
              <Checkbox id="copyright-confirm" required />
              <div>
                <label htmlFor="copyright-confirm" className="text-sm cursor-pointer">
                  I confirm that I have the right to upload this work and agree to the terms
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Save Draft
          </Button>
          <Button type="submit" disabled={!selectedFile || isUploading}>
            {isUploading ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      </form>
    </div>
  );
}
