import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Route } from "./+types/home";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { PublicCatalog } from '../components/library/PublicCatalog';
import { UserAccount } from '../components/library/UserAccount';
import { LibraryStats } from '../components/library/LibraryStats';
import { ApprovalWorkflow } from '../components/library/ApprovalWorkflow';
import { SearchDiscovery } from '../components/library/SearchDiscovery';
import { DocumentUpload } from '../components/library/DocumentUpload';
import { Dashboard } from '../components/library/Dashboard';
import { AccountManagement } from '../components/library/AccountManagement';
import { Profile } from '../components/library/Profile';
import { useAuth } from '../context/AuthContext';
import { Book, Users, BookOpen, Settings, BarChart3, Library, Upload, Search, LogOut, User } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MURRS - Multi-University Research Repository System" },
    { name: "description", content: "Global research repository platform" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('catalog');

  const handleTabChange = (tab: string) => {
    const publicTabs = new Set(['catalog', 'search']);

    // Treat guest as unauthenticated: only allow public tabs
    const isGuest = user?.role === 'guest';
    const isAuthedNonGuest = isAuthenticated && !isGuest;

    if (!isAuthedNonGuest && !publicTabs.has(tab)) {
      navigate('/login');
      return;
    }

    // Role-based guards for authenticated non-guest users
    if (tab === 'approval' && !(user?.role === 'staff' || user?.role === 'librarian')) return;
    if (tab === 'librarian' && user?.role !== 'librarian') return;

    setActiveTab(tab);
  };

  const overdueCount = 8;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Library className="size-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Multi-University Research Repository</h1>
                <p className="text-sm text-muted-foreground">MURRS - Global Research Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role === 'member' ? 'Student' : user.role}</p>
                    {user.university && (
                      <p className="text-xs text-muted-foreground">{user.university}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="size-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className="capitalize">Guest User</Badge>
                  <Button
                    size="sm"
                    onClick={() => navigate('/login')}
                  >
                    Login
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className={`grid w-full mb-6 ${
            user?.role === 'librarian' ? 'grid-cols-7' :
            user?.role === 'staff' ? 'grid-cols-6' :
            user?.role === 'member' ? 'grid-cols-5' :
            'grid-cols-2'
          }`}>
            <TabsTrigger value="catalog" className="flex items-center gap-2">
              <Book className="size-4" />
              <span className="hidden sm:inline">Catalog</span>
            </TabsTrigger>
            
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="size-4" />
              <span className="hidden sm:inline">Search</span>
            </TabsTrigger>

            {isAuthenticated && user?.role !== 'guest' && (
              <TabsTrigger 
                value="dashboard" 
                className="flex items-center gap-2"
              >
                <BarChart3 className="size-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
            )}

            {isAuthenticated && user?.role !== 'guest' && (
              <TabsTrigger 
                value="upload"
                className="flex items-center gap-2"
              >
                <Upload className="size-4" />
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>
            )}

            {isAuthenticated && user?.role !== 'guest' && (
              <TabsTrigger 
                value="profile"
                className="flex items-center gap-2"
              >
                <User className="size-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
            )}

            {(user?.role === 'staff' || user?.role === 'librarian') && (
              <TabsTrigger 
                value="approval"
                className="flex items-center gap-2 relative"
              >
                <BookOpen className="size-4" />
                <span className="hidden sm:inline">Approval</span>
                {overdueCount > 0 && (
                  <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-xs">
                    {overdueCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}

            {user?.role === 'librarian' && (
              <TabsTrigger 
                value="librarian"
                className="flex items-center gap-2"
              >
                <Settings className="size-4" />
                <span className="hidden sm:inline">Librarian</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="catalog">
            <PublicCatalog />
          </TabsContent>

          <TabsContent value="search">
            <SearchDiscovery />
          </TabsContent>

          {isAuthenticated && user?.role !== 'guest' && (
            <TabsContent value="dashboard">
              <Dashboard userRole={user?.role || 'member'} />
            </TabsContent>
          )}

          {isAuthenticated && user?.role !== 'guest' && (
            <TabsContent value="upload">
              <DocumentUpload />
            </TabsContent>
          )}

          {(user?.role === 'staff' || user?.role === 'librarian') && (
            <TabsContent value="approval">
              <ApprovalWorkflow />
            </TabsContent>
          )}

          {user?.role === 'librarian' && (
            <TabsContent value="librarian">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Account Management</h2>
                  <AccountManagement />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4">Library Statistics</h2>
                  <LibraryStats />
                </div>
              </div>
            </TabsContent>
          )}

          {isAuthenticated && user?.role !== 'guest' && (
            <TabsContent value="profile">
              <Profile />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
