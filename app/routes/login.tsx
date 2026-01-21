import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { useAuth, type UserRole } from '../context/AuthContext'
import { LogIn, BookOpen, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('guest')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = () => {
    setError('')

    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    if (selectedRole !== 'guest' && !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    const success = login(email, password, selectedRole)
    if (success) {
      navigate('/')
    } else {
      setError('Login failed. Please try again.')
    }
  }

  const handleGuestAccess = () => {
    const success = login('guest@murrs.edu', 'guest', 'guest')
    if (success) {
      navigate('/')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">MURRS</h1>
          </div>
          <h2 className="text-2xl font-bold">Multi-University Research Repository</h2>
          <p className="text-muted-foreground">Sign in to access research papers and resources</p>
        </div>

        {/* Guest Access */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">Quick Access</CardTitle>
            <CardDescription>View papers without creating an account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGuestAccess} variant="outline" className="w-full">
              Continue as Guest
            </Button>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              You can read abstracts and search papers, but download requires an account
            </p>
          </CardContent>
        </Card>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Create or access your institutional account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Role Selection */}
            <div>
              <Label className="mb-3 block">Account Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['member', 'staff', 'librarian'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`p-3 rounded-lg border-2 transition-all text-sm font-medium capitalize ${
                      selectedRole === role
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              {selectedRole === 'librarian' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Librarian accounts can only be created by existing librarians
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="mt-1"
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Demo: Use any email and password to test
              </p>
            </div>

            {/* Login Button */}
            <Button onClick={handleLogin} className="w-full" size="lg">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>

            {/* Footer */}
            <p className="text-xs text-muted-foreground text-center mt-4">
              {selectedRole === 'member' ? 'Students: Contact your institution librarian to create your account' : 'For access requests, contact your institution librarian'}
            </p>
          </CardContent>
        </Card>

        {/* Test Credentials Section */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Test Credentials
            </CardTitle>
            <CardDescription className="text-xs">For development/testing only</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Member Accounts */}
            <div>
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">Member Accounts:</p>
              <div className="space-y-1 bg-white dark:bg-slate-900 p-2 rounded text-xs">
                <div>📧 john.smith@student.edu | 🔑 password123</div>
                <div>📧 sarah.jones@student.edu | 🔑 password123</div>
              </div>
            </div>

            {/* Staff Accounts */}
            <div>
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">Staff Accounts:</p>
              <div className="space-y-1 bg-white dark:bg-slate-900 p-2 rounded text-xs">
                <div>📧 ama.owusu@university.edu | 🔑 password123</div>
                <div>📧 michael.brown@university.edu | 🔑 password123</div>
              </div>
            </div>

            {/* Librarian Account */}
            <div>
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">Librarian Account:</p>
              <div className="space-y-1 bg-white dark:bg-slate-900 p-2 rounded text-xs">
                <div>📧 librarian@murrs.edu | 🔑 librarian123</div>
              </div>
            </div>

            <p className="text-xs text-blue-700 dark:text-blue-300 mt-3 italic">
              💡 Tip: Or use any email/password combination to create a test account instantly.
            </p>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <Badge variant="outline">Guest</Badge>
            <p className="text-xs text-muted-foreground mt-1">Read abstracts</p>
          </div>
          <div>
            <Badge variant="outline">Member</Badge>
            <p className="text-xs text-muted-foreground mt-1">Download papers</p>
          </div>
          <div>
            <Badge variant="outline">Staff</Badge>
            <p className="text-xs text-muted-foreground mt-1">Manage uploads</p>
          </div>
        </div>
      </div>
    </div>
  )
}
