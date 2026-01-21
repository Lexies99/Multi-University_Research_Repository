import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { useAuth } from '../context/AuthContext'
import { Download, Eye } from 'lucide-react'
import { findPaperById } from '../lib/mockPapers'
import type { Route } from "./+types/paper.$id"

export const meta: Route.MetaFunction = ({ params }) => {
  const id = Number(params.id)
  const paper = findPaperById(id)
  const title = paper ? `${paper.title} – MURRS` : 'Paper – MURRS'
  const description = paper ? `Read abstract: ${paper.abstract}` : 'Research paper details on MURRS'
  return [
    { title },
    { name: 'description', content: description },
  ]
}

export default function PaperDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()

  const paperId = Number(id)
  const paper = useMemo(() => findPaperById(paperId), [paperId])
  const [toast, setToast] = useState<string>('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  if (!paper) {
    return (
      <main className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Paper not found</CardTitle>
            <CardDescription>We couldn't find the paper you are looking for.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} variant="outline">Go back to Catalog</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const isGuest = !isAuthenticated || user?.role === 'guest'

  const handleDownload = () => {
    if (isGuest) {
      navigate('/login')
      return
    }
    setToast(`Downloading: ${paper.title}`)
  }

  const handleRead = () => {
    if (isGuest) {
      navigate('/login')
      return
    }
    // In a real app, open a reader or PDF viewer
    setToast(`Opening reader for: ${paper.title}`)
  }

  return (
    <main className="container mx-auto p-4">
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-card border shadow-lg rounded px-4 py-2 text-sm">
          {toast}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{paper.title}</CardTitle>
              <CardDescription className="text-sm">{paper.authors.join(', ')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">{paper.year}</Badge>
                <Badge variant="outline" className="text-xs">{paper.discipline}</Badge>
                <Badge variant="secondary" className="text-xs">{paper.university}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {paper.views.toLocaleString()} views</span>
                <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {paper.downloads.toLocaleString()} downloads</span>
                <span>Citations: {paper.citations}</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Abstract</h3>
                <p className="text-sm text-muted-foreground">{paper.abstract}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRead} disabled={isGuest}>Read Paper</Button>
                <Button variant="outline" onClick={handleDownload} disabled={isGuest}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              </div>
              {isGuest && (
                <div className="p-3 bg-muted rounded text-sm">
                  Sign in to read the full paper and download. <Button variant="link" className="px-1" onClick={() => navigate('/login')}>Login</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {!isGuest && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reader (Demo)</CardTitle>
                <CardDescription>Simulated reader area for demonstration purposes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-muted rounded flex items-center justify-center text-muted-foreground">
                  Full paper content would be displayed here.
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About this paper</CardTitle>
              <CardDescription>Metadata and quick actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Discipline: </span>{paper.discipline}</div>
              <div><span className="text-muted-foreground">University: </span>{paper.university}</div>
              <div><span className="text-muted-foreground">Year: </span>{paper.year}</div>
              <div><span className="text-muted-foreground">Citations: </span>{paper.citations}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
