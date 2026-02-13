import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAuth } from '../context/AuthContext'
import { LogIn, BookOpen, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError('')

    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    const success = await login(email, password, 'member')
    setLoading(false)

    if (!success) {
      setError('Login failed. Please check your credentials.')
      return
    }

    navigate('/')
  }

  const handleGuestAccess = async () => {
    const success = await login('guest@murrs.edu', 'guest', 'guest')
    if (success) {
      navigate('/')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

        {/* Login / Register Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Sign in with your institutional account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
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
                onKeyDown={handleKeyDown}
                className="mt-1"
              />
            </div>

            {/* Submit Button */}
            <Button onClick={handleLogin} className="w-full" size="lg" disabled={loading}>
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>

            {/* Footer */}
            <div className="text-xs text-muted-foreground text-center mt-4 space-y-2">
              <p>Need access? Contact your institution librarian.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
