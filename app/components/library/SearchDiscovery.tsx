import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { useAuth } from '../../context/AuthContext'
import { Search, Filter, Download, Eye, Bookmark, Grid3x3, List, X } from 'lucide-react'
import { mockPapers } from '../../lib/mockPapers'

export function SearchDiscovery() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [sortBy, setSortBy] = useState('relevance')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set())
  const [savedSearches, setSavedSearches] = useState<Array<{ name: string; query: string; filters: Record<string, string[]> }>>([])
  const [showSaveSearch, setShowSaveSearch] = useState(false)
  const [searchName, setSearchName] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const resultsPerPage = 6

  const handleDownload = (paperId: number) => {
    // Guests and unauthenticated users cannot download
    if (!isAuthenticated || user?.role === 'guest') {
      navigate('/login')
      return
    }
    // Handle download logic here
    alert(`Downloaded paper ${paperId}`)
  }

  const disciplines = ['Computer Science', 'Physics', 'Engineering', 'Environmental Science', 'Medicine', 'Mathematics']
  const years = ['2024', '2023', '2022', '2021', '2020']
  const universities = ['Harvard', 'MIT', 'Stanford', 'Oxford', 'Cambridge', 'UC Berkeley']

  const filteredPapers = mockPapers.filter(paper => {
    const matchesSearch = paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
      paper.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesDiscipline = !activeFilters.discipline?.length || activeFilters.discipline.includes(paper.discipline)
    const matchesYear = !activeFilters.year?.length || activeFilters.year.includes(paper.year.toString())
    const matchesUniversity = !activeFilters.university?.length || activeFilters.university.includes(paper.university)

    return matchesSearch && matchesDiscipline && matchesYear && matchesUniversity
  })

  const sortedPapers = [...filteredPapers].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.year - a.year
      case 'citations':
        return b.citations - a.citations
      case 'downloads':
        return b.downloads - a.downloads
      case 'views':
        return b.views - a.views
      default:
        return 0
    }
  })

  const paginatedPapers = sortedPapers.slice(currentPage * resultsPerPage, (currentPage + 1) * resultsPerPage)
  const totalPages = Math.ceil(sortedPapers.length / resultsPerPage)

  const toggleFilter = (category: string, value: string) => {
    setActiveFilters(prev => {
      const current = prev[category] || []
      return {
        ...prev,
        [category]: current.includes(value)
          ? current.filter(v => v !== value)
          : [...current, value]
      }
    })
    setCurrentPage(0)
  }

  const toggleBookmark = (id: number) => {
    const newBookmarked = new Set(bookmarked)
    if (newBookmarked.has(id)) newBookmarked.delete(id)
    else newBookmarked.add(id)
    setBookmarked(newBookmarked)
  }

  const saveCurrentSearch = () => {
    if (searchName.trim()) {
      setSavedSearches(prev => [...prev, { name: searchName, query: searchQuery, filters: activeFilters }])
      setSearchName('')
      setShowSaveSearch(false)
    }
  }

  const loadSearch = (search: typeof savedSearches[0]) => {
    setSearchQuery(search.query)
    setActiveFilters(search.filters)
    setCurrentPage(0)
  }

  const clearFilters = () => {
    setActiveFilters({})
    setSearchQuery('')
    setCurrentPage(0)
  }

  const activeFilterCount = Object.values(activeFilters).flat().length

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search papers, authors, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-2 h-10 text-foreground bg-background border-input"
          />
        </div>

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Saved searches:</span>
            {savedSearches.map((search, idx) => (
              <Button
                key={idx}
                size="sm"
                variant="outline"
                onClick={() => loadSearch(search)}
              >
                {search.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
                {activeFilterCount > 0 && (
                  <Button size="sm" variant="ghost" onClick={clearFilters}>
                    <X className="h-3 w-3" /> Clear
                  </Button>
                )}
              </div>
              {activeFilterCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2">{activeFilterCount} active</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Discipline Filter */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Discipline</h4>
                <div className="space-y-2">
                  {disciplines.map(d => (
                    <label key={d} className="flex items-center gap-2 cursor-pointer hover:text-foreground text-muted-foreground text-sm">
                      <input
                        type="checkbox"
                        checked={activeFilters.discipline?.includes(d) || false}
                        onChange={() => toggleFilter('discipline', d)}
                        className="w-4 h-4"
                      />
                      <span>{d}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* University Filter */}
              <div>
                <h4 className="font-semibold text-sm mb-3">University</h4>
                <div className="space-y-2">
                  {universities.map(u => (
                    <label key={u} className="flex items-center gap-2 cursor-pointer hover:text-foreground text-muted-foreground text-sm">
                      <input
                        type="checkbox"
                        checked={activeFilters.university?.includes(u) || false}
                        onChange={() => toggleFilter('university', u)}
                        className="w-4 h-4"
                      />
                      <span>{u}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Year Filter */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Year</h4>
                <div className="space-y-2">
                  {years.map(y => (
                    <label key={y} className="flex items-center gap-2 cursor-pointer hover:text-foreground text-muted-foreground text-sm">
                      <input
                        type="checkbox"
                        checked={activeFilters.year?.includes(y) || false}
                        onChange={() => toggleFilter('year', y)}
                        className="w-4 h-4"
                      />
                      <span>{y}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">Found {sortedPapers.length} results</p>
              <Dialog open={showSaveSearch} onOpenChange={setShowSaveSearch}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    Save Search
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Current Search</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Search name (e.g., 'AI Healthcare 2024')"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                    />
                    <Button onClick={saveCurrentSearch} className="w-full">Save Search</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Button size="sm" variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>
                  <List className="h-4 w-4" />
                </Button>
                <Button size="sm" variant={viewMode === 'grid' ? 'default' : 'outline'} onClick={() => setViewMode('grid')}>
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="citations">Most Cited</SelectItem>
                  <SelectItem value="downloads">Most Downloaded</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Display */}
          {viewMode === 'list' ? (
            <div className="space-y-3">
              {paginatedPapers.map(paper => (
                <Card key={paper.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2 line-clamp-2 hover:text-primary cursor-pointer" onClick={() => navigate(`/paper/${paper.id}`)}>{paper.title}</h3>
                        <p className="text-sm text-muted-foreground mb-1">by {paper.authors.join(', ')}</p>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{paper.abstract}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {paper.views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" /> {paper.downloads.toLocaleString()}
                          </span>
                          <span>Citations: {paper.citations}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{paper.year}</Badge>
                          <Badge variant="outline" className="text-xs">{paper.discipline}</Badge>
                          <Badge variant="outline" className="text-xs">{paper.university}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant={bookmarked.has(paper.id) ? 'default' : 'outline'}
                          onClick={() => toggleBookmark(paper.id)}
                          title="Bookmark"
                        >
                          <Bookmark className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          title={isAuthenticated && user?.role !== 'guest' ? "Download" : "Login to download"}
                          onClick={() => handleDownload(paper.id)}
                          disabled={!isAuthenticated || user?.role === 'guest'}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedPapers.map(paper => (
                <Card key={paper.id} className="hover:shadow-md transition-shadow flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm line-clamp-2 hover:text-primary cursor-pointer" onClick={() => navigate(`/paper/${paper.id}`)}>{paper.title}</CardTitle>
                    <CardDescription className="text-xs">{paper.authors.join(', ')}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 flex-1 space-y-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">{paper.abstract}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{paper.year}</Badge>
                      <Badge variant="outline" className="text-xs">{paper.discipline}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" /> {(paper.views / 1000).toFixed(1)}K
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-3 w-3" /> {paper.downloads}
                      </div>
                      <div>Cite: {paper.citations}</div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant={bookmarked.has(paper.id) ? 'default' : 'outline'}
                        onClick={() => toggleBookmark(paper.id)}
                        className="flex-1"
                      >
                        <Bookmark className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDownload(paper.id)} disabled={!isAuthenticated || user?.role === 'guest'}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={currentPage === i ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(i)}
                    className="min-w-8"
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
