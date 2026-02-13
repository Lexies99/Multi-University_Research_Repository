import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { useAuth } from '../../context/AuthContext'
import { Bookmark, Download, Eye, Grid3x3, List, Search, Star, TrendingUp } from 'lucide-react'
import { apiDownloadPaperFile, apiListPapers } from '../../lib/api'
import type { ApiPaper } from '../../lib/api'

const ACCESS_TOKEN_KEY = 'murrs_access_token'

const categories = [
  { id: 'all', label: 'All Papers' },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'highest-rated', label: 'Highest Rated' },
  { id: 'most-downloaded', label: 'Most Downloaded' },
]

const sortByCategory: Record<string, string> = {
  all: 'relevance',
  trending: 'trending',
  'highest-rated': 'highest-rated',
  'most-downloaded': 'downloads',
}

export function PublicCatalog() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [papers, setPapers] = useState<ApiPaper[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const results = await apiListPapers({
          q: searchQuery || undefined,
          sort: sortByCategory[activeCategory] || 'relevance',
          catalog: true,
          limit: 200,
        })
        if (!cancelled) setPapers(results)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load papers')
          setPapers([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [searchQuery, activeCategory])

  const handleDownload = async (paperId: number) => {
    if (!isAuthenticated || user?.role === 'guest') {
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
      setPapers((prev) => prev.map((p) => (p.id === paperId ? { ...p, downloads: p.downloads + 1 } : p)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file')
    }
  }

  const toggleBookmark = (id: number) => {
    const next = new Set(bookmarked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setBookmarked(next)
  }

  const categoryCounts = useMemo(() => {
    const all = papers.length
    const trending = papers.filter((p) => p.views > 2500).length
    const highest = Math.min(4, papers.length)
    const downloads = Math.min(5, papers.length)
    return { all, trending, highest, downloads }
  }, [papers])

  const PaperCard = ({ paper }: { paper: ApiPaper }) => (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base line-clamp-2 hover:text-primary cursor-pointer" onClick={() => navigate(`/paper/${paper.id}`)}>{paper.title}</CardTitle>
            <CardDescription className="text-xs mt-1">{paper.authors.map((a) => a.name).join(', ') || 'Unknown Author'}</CardDescription>
          </div>
          <div className="flex items-center gap-1 text-yellow-500 flex-shrink-0">
            <Star className="h-4 w-4 fill-yellow-500" />
            <span className="text-xs font-semibold">{(paper.rating ?? 0).toFixed(1)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">{paper.abstract || 'No abstract available.'}</p>

        <div className="flex gap-1 flex-wrap">
          <Badge variant="outline" className="text-xs">{paper.year}</Badge>
          <Badge variant="outline" className="text-xs">{paper.discipline || 'General'}</Badge>
          <Badge variant="secondary" className="text-xs">{paper.university || 'Unknown'}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Eye className="h-3 w-3" />
            <span>{(paper.views / 1000).toFixed(1)}K</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Download className="h-3 w-3" />
            <span>{paper.downloads}</span>
          </div>
          <div className="text-muted-foreground">
            Cite: {paper.citations}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => void handleDownload(paper.id)}
            disabled={!isAuthenticated || user?.role === 'guest'}
          >
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          <Button
            size="sm"
            variant={bookmarked.has(paper.id) ? 'default' : 'outline'}
            onClick={() => toggleBookmark(paper.id)}
            className="px-3"
          >
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Public Catalog</h2>
          <p className="text-sm text-muted-foreground mt-1">Browse and discover research papers</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={viewMode === 'grid' ? 'default' : 'outline'} onClick={() => setViewMode('grid')}>
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search papers, authors, disciplines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 text-foreground bg-background border-input"
        />
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} defaultValue="all">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              <span className="text-xs sm:text-sm">
                {cat.label}
                {cat.id === 'all' && ` (${categoryCounts.all})`}
                {cat.id === 'trending' && ` (${categoryCounts.trending})`}
                {cat.id === 'highest-rated' && ` (${categoryCounts.highest})`}
                {cat.id === 'most-downloaded' && ` (${categoryCounts.downloads})`}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">Loading papers...</CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="pt-6 text-center text-destructive">{error}</CardContent>
            </Card>
          ) : papers.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No papers found matching your criteria</p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {papers.map((paper) => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {papers.map((paper, idx) => (
                <Card key={paper.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4 justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                          <h3 className="font-semibold hover:text-primary cursor-pointer" onClick={() => navigate(`/paper/${paper.id}`)}>{paper.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{paper.authors.map((a) => a.name).join(', ') || 'Unknown Author'}</p>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{paper.abstract || 'No abstract available.'}</p>
                        <div className="flex gap-2 items-center flex-wrap">
                          <Badge variant="outline" className="text-xs">{paper.year}</Badge>
                          <Badge variant="outline" className="text-xs">{paper.discipline || 'General'}</Badge>
                          <Badge variant="secondary" className="text-xs">{paper.university || 'Unknown'}</Badge>
                          <div className="flex items-center gap-1 text-yellow-500 ml-auto">
                            <Star className="h-3 w-3 fill-yellow-500" />
                            <span className="text-xs font-semibold">{(paper.rating ?? 0).toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <div className="text-right text-xs text-muted-foreground space-y-1 hidden sm:block">
                          <div className="flex items-center gap-1 justify-end">
                            <Eye className="h-3 w-3" />
                            {paper.views}
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            <Download className="h-3 w-3" />
                            {paper.downloads}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleDownload(paper.id)}
                          disabled={!isAuthenticated || user?.role === 'guest'}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={bookmarked.has(paper.id) ? 'default' : 'outline'}
                          onClick={() => toggleBookmark(paper.id)}
                        >
                          <Bookmark className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
