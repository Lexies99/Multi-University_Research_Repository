import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { useAuth } from '../../context/AuthContext'
import { Bookmark, Download, Eye, Grid3x3, List, Search, Star, TrendingUp } from 'lucide-react'

const mockPapers = [
  { id: 1, title: 'Advanced AI in Healthcare: Deep Learning Applications', authors: ['Dr. Smith', 'Dr. Johnson'], downloads: 512, views: 2341, citations: 45, year: 2024, discipline: 'Computer Science', rating: 4.8, university: 'MIT', abstract: 'Exploring deep learning applications in medical diagnosis and treatment planning.' },
  { id: 2, title: 'Quantum Computing Applications in Optimization', authors: ['Prof. Lee'], downloads: 234, views: 1823, citations: 28, year: 2023, discipline: 'Physics', rating: 4.6, university: 'Stanford', abstract: 'A comprehensive study of quantum algorithms for solving optimization problems.' },
  { id: 3, title: 'Sustainable Energy Solutions for Urban Development', authors: ['Dr. Chen', 'Dr. Patel'], downloads: 891, views: 3452, citations: 67, year: 2024, discipline: 'Engineering', rating: 4.9, university: 'UC Berkeley', abstract: 'Innovative approaches to renewable energy integration in smart cities.' },
  { id: 4, title: 'Machine Learning in Financial Risk Assessment', authors: ['Prof. Brown'], downloads: 445, views: 2156, citations: 52, year: 2023, discipline: 'Computer Science', rating: 4.7, university: 'Harvard', abstract: 'Machine learning models for predicting financial risk and market trends.' },
  { id: 5, title: 'Blockchain Security Analysis and Best Practices', authors: ['Dr. Martinez'], downloads: 234, views: 1567, citations: 19, year: 2024, discipline: 'Computer Science', rating: 4.5, university: 'Oxford', abstract: 'Security vulnerabilities and mitigation strategies in blockchain systems.' },
  { id: 6, title: 'Climate Change Mitigation Through Carbon Capture', authors: ['Prof. Wilson', 'Dr. Garcia'], downloads: 1023, views: 4123, citations: 89, year: 2024, discipline: 'Environmental Science', rating: 4.9, university: 'Cambridge', abstract: 'Advanced techniques for capturing and storing atmospheric carbon dioxide.' },
  { id: 7, title: 'Advanced Materials for Next Generation Computing', authors: ['Dr. Kumar', 'Prof. Anderson'], downloads: 389, views: 1945, citations: 34, year: 2023, discipline: 'Physics', rating: 4.6, university: 'MIT', abstract: 'Exploring new semiconductor materials for quantum computing applications.' },
  { id: 8, title: 'Artificial Intelligence in Drug Discovery', authors: ['Dr. Thompson'], downloads: 678, views: 2834, citations: 56, year: 2024, discipline: 'Medicine', rating: 4.8, university: 'Harvard', abstract: 'AI-powered approaches accelerating pharmaceutical research and development.' },
  { id: 9, title: 'Renewable Energy Storage Technologies', authors: ['Dr. Hassan', 'Prof. Lee'], downloads: 567, views: 3100, citations: 71, year: 2024, discipline: 'Engineering', rating: 4.7, university: 'Stanford', abstract: 'Battery and hydrogen storage solutions for renewable energy integration.' },
]

const categories = [
  { id: 'all', label: 'All Papers', count: 9 },
  { id: 'trending', label: 'Trending', count: 3, icon: TrendingUp },
  { id: 'highest-rated', label: 'Highest Rated', count: 4 },
  { id: 'most-downloaded', label: 'Most Downloaded', count: 5 },
]

export function PublicCatalog() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const handleDownload = (paperId: number) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    // Handle download logic here
    alert(`Downloaded paper ${paperId}`)
  }

  const filteredPapers = mockPapers.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
    paper.discipline.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categorizedPapers = (() => {
    switch (activeCategory) {
      case 'trending':
        return filteredPapers.filter(p => p.views > 2500)
      case 'highest-rated':
        return filteredPapers.sort((a, b) => b.rating - a.rating).slice(0, 4)
      case 'most-downloaded':
        return filteredPapers.sort((a, b) => b.downloads - a.downloads).slice(0, 5)
      default:
        return filteredPapers
    }
  })()

  const toggleBookmark = (id: number) => {
    const newBookmarked = new Set(bookmarked)
    if (newBookmarked.has(id)) newBookmarked.delete(id)
    else newBookmarked.add(id)
    setBookmarked(newBookmarked)
  }

  const PaperCard = ({ paper, variant = 'default' }: { paper: typeof mockPapers[0]; variant?: 'default' | 'featured' }) => (
    <Card className={`hover:shadow-lg transition-all ${variant === 'featured' ? 'border-primary' : ''}`}>
      {variant === 'featured' && (
        <div className="bg-primary h-1"></div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base line-clamp-2 hover:text-primary cursor-pointer">{paper.title}</CardTitle>
            <CardDescription className="text-xs mt-1">{paper.authors.join(', ')}</CardDescription>
          </div>
          <div className="flex items-center gap-1 text-yellow-500 flex-shrink-0">
            <Star className="h-4 w-4 fill-yellow-500" />
            <span className="text-xs font-semibold">{paper.rating}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">{paper.abstract}</p>

        <div className="flex gap-1 flex-wrap">
          <Badge variant="outline" className="text-xs">{paper.year}</Badge>
          <Badge variant="outline" className="text-xs">{paper.discipline}</Badge>
          <Badge variant="secondary" className="text-xs">{paper.university}</Badge>
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
            onClick={() => handleDownload(paper.id)}
            disabled={!isAuthenticated}
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
      {/* Header */}
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search papers, authors, disciplines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 text-foreground bg-background border-input"
        />
      </div>

      {/* Categories/Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} defaultValue="all">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id}>
              <span className="text-xs sm:text-sm">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-4">
          {categorizedPapers.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p>No papers found matching your criteria</p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorizedPapers.map(paper => (
                <PaperCard key={paper.id} paper={paper} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {categorizedPapers.map((paper, idx) => (
                <Card key={paper.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4 justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-muted-foreground">#{idx + 1}</span>
                          <h3 className="font-semibold hover:text-primary cursor-pointer">{paper.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{paper.authors.join(', ')}</p>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{paper.abstract}</p>
                        <div className="flex gap-2 items-center flex-wrap">
                          <Badge variant="outline" className="text-xs">{paper.year}</Badge>
                          <Badge variant="outline" className="text-xs">{paper.discipline}</Badge>
                          <Badge variant="secondary" className="text-xs">{paper.university}</Badge>
                          <div className="flex items-center gap-1 text-yellow-500 ml-auto">
                            <Star className="h-3 w-3 fill-yellow-500" />
                            <span className="text-xs font-semibold">{paper.rating}</span>
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
                          onClick={() => handleDownload(paper.id)}
                          disabled={!isAuthenticated}
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
