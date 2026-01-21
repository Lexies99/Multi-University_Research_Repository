import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useAuth } from '../../context/AuthContext'
import { Users, UserPlus, Trash2, CheckCircle, Lock } from 'lucide-react'

interface CreatedAccount {
  id: string
  email: string
  name: string
  role: 'member' | 'staff'
  createdDate: string
  university: string
  department: string
}

export function AccountManagement() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<CreatedAccount[]>([
    {
      id: '1',
      email: 'john.student@university.edu',
      name: 'John Student',
      role: 'member',
      createdDate: '2024-12-20',
      university: 'MIT',
      department: 'Computer Science',
    },
    {
      id: '2',
      email: 'staff.member@university.edu',
      name: 'Staff Member',
      role: 'staff',
      createdDate: '2024-12-18',
      university: 'Harvard',
      department: 'Library Services',
    },
  ])

  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newDepartment, setNewDepartment] = useState('')
  const [newRole, setNewRole] = useState<'member' | 'staff'>('member')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [error, setError] = useState('')

  const handleCreateAccount = () => {
    setError('')

    if (!newEmail || !newName || !newDepartment) {
      setError('Please fill in all fields')
      return
    }

    if (!newEmail.includes('@')) {
      setError('Please enter a valid email')
      return
    }

    if (accounts.some(a => a.email === newEmail)) {
      setError('Email already exists')
      return
    }

    // Random university
    const universities = ['MIT', 'Harvard', 'Stanford', 'Oxford', 'Cambridge', 'UC Berkeley']
    const randomUniversity = universities[Math.floor(Math.random() * universities.length)]

    const newAccount: CreatedAccount = {
      id: `acc_${Date.now()}`,
      email: newEmail,
      name: newName,
      role: newRole,
      createdDate: new Date().toISOString().split('T')[0],
      university: randomUniversity,
      department: newDepartment,
    }

    setAccounts([...accounts, newAccount])
    setNewEmail('')
    setNewName('')
    setNewDepartment('')
    setNewRole('member')
    setDialogOpen(false)
  }

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id))
  }

  // Only admin can access this
  if (user?.role !== 'admin') {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <Lock className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold">Access Denied</p>
              <p className="text-sm text-muted-foreground">Only administrators can manage user accounts</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Account Management
          </h2>
          <p className="text-muted-foreground mt-1">Create and manage member and staff accounts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Create Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@university.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g., Computer Science"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="role">Account Type</Label>
                <Select value={newRole} onValueChange={(val) => setNewRole(val as 'member' | 'staff')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member (Student)</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleCreateAccount} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Accounts List */}
      <div className="space-y-3">
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No accounts created yet
            </CardContent>
          </Card>
        ) : (
          accounts.map(account => (
            <Card key={account.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{account.name}</h3>
                      <Badge variant={account.role === 'member' ? 'outline' : 'secondary'}>
                        {account.role === 'member' ? 'Student' : 'Staff'}
                      </Badge>
                      <Badge variant="outline" className="text-green-700 bg-green-50 dark:bg-green-900/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{account.email}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>🏫 {account.department}</span>
                      <span>📍 {account.university}</span>
                      <span>📅 Created {account.createdDate}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteAccount(account.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{accounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Members</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{accounts.filter(a => a.role === 'member').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Staff</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{accounts.filter(a => a.role === 'staff').length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
