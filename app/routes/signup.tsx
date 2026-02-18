import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useAuth } from '../context/AuthContext'
import { AlertCircle, BookOpen, UserPlus } from 'lucide-react'
import type { ApiUserRole } from '../lib/api'

const SCHOOL_OPTIONS = [
  'Business School',
  'School of Public Service and Governance',
  'Faculty of Law',
  'School of Technology and Social Sciences (SOTSS)',
]

const DEPARTMENT_OPTIONS_BY_SCHOOL: Record<string, string[]> = {
  'Business School': [
    'Accounting',
    'Finance',
    'Marketing',
    'Human Resource Management',
    'Operations and Supply Chain',
  ],
  'School of Public Service and Governance': [
    'Public Administration',
    'Governance and Leadership',
    'Policy and Strategy',
  ],
  'Faculty of Law': [
    'Public Law',
    'Private Law',
    'International Law',
  ],
  'School of Technology and Social Sciences (SOTSS)': [
    'Computer Science',
    'Information Technology',
    'Information Systems',
    'Economics',
    'Social Sciences',
  ],
}

const DEFAULT_DEPARTMENT_OPTIONS = [
  'Administration',
  'Registry',
  'ICT',
  'Library Services',
]

const ACADEMIC_AREA_OPTIONS_BY_SCHOOL: Record<string, string[]> = {
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

export default function SignupPage() {
  const [name, setName] = useState('')
  const [role, setRole] = useState<ApiUserRole>('student')
  const [schoolId, setSchoolId] = useState('')
  const [school, setSchool] = useState('')
  const [department, setDepartment] = useState('')
  const [schoolEmail, setSchoolEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { createAccount } = useAuth()
  const navigate = useNavigate()
  const academicAreaOptions = useMemo(
    () => ACADEMIC_AREA_OPTIONS_BY_SCHOOL[school] || [],
    [school],
  )

  const getInputValue = (id: string): string => {
    const el = document.getElementById(id) as HTMLInputElement | null
    return (el?.value || '').trim()
  }

  const handleCreateAccount = async () => {
    setError('')
    setSuccess('')

    const finalName = name.trim() || getInputValue('name')
    const finalRole = role
    const finalSchool = school.trim() || getInputValue('school')
    const finalSchoolId = schoolId.trim() || getInputValue('school-id')
    const finalDepartment = department.trim() || getInputValue('department')
    const finalSchoolEmail = schoolEmail.trim() || getInputValue('school-email')
    const finalPassword = password || getInputValue('password')
    const needsSchool = finalRole !== 'librarian'
    const needsSchoolId = finalRole === 'student' || finalRole === 'member'
    const needsDepartment =
      finalRole === 'lecturer' || finalRole === 'staff' || finalRole === 'project_coordinator' || finalRole === 'hod'

    if (!finalName || !finalSchoolEmail || !finalPassword) {
      setError('Please fill in all required fields')
      return
    }
    if (needsSchool && !finalSchool) {
      setError('Please fill in School')
      return
    }
    if (needsSchoolId && !finalSchoolId) {
      setError('Please fill in School ID')
      return
    }
    if (needsDepartment && !finalDepartment) {
      setError('Please fill in Department')
      return
    }
    if (!finalSchoolEmail.toLowerCase().endsWith('@st.gimpa.edu.gh')) {
      setError('School email must end with @st.gimpa.edu.gh')
      return
    }
    if (finalPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const result = await createAccount(
      finalSchoolEmail,
      finalPassword,
      finalName,
      finalRole,
      needsSchoolId ? finalSchoolId : undefined,
      needsSchool ? finalSchool : undefined,
      needsDepartment ? finalDepartment : undefined,
    )
    setLoading(false)

    if (!result.ok) {
      setError(result.error || 'Account creation failed. Check School ID/email or try again.')
      return
    }

    setSuccess('Account submitted. A librarian will activate it before you can sign in.')
    setName('')
    setRole('student')
    setSchoolId('')
    setSchool('')
    setDepartment('')
    setSchoolEmail('')
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">MURRS</h1>
          </div>
          <h2 className="text-2xl font-bold">Create Account</h2>
          <p className="text-muted-foreground">Student self-registration</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Use your GIMPA student email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-md text-sm">
                {success}
              </div>
            )}

            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="mt-1" />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(val) => setRole(val as ApiUserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="project_coordinator">Project Coordinator</SelectItem>
                  <SelectItem value="hod">HOD</SelectItem>
                  <SelectItem value="librarian">Librarian</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role !== 'librarian' && (
              <div>
                <Label htmlFor="school">School</Label>
                <Select value={school} onValueChange={setSchool}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(role === 'student' || role === 'member') && (
              <div>
              <Label htmlFor="school-id">School ID</Label>
                <Input id="school-id" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} placeholder="GIMPA000001" className="mt-1" />
              </div>
            )}

            {(role === 'lecturer' || role === 'project_coordinator' || role === 'hod') && (
              <div>
                <Label htmlFor="department">Academic Area</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select academic area" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicAreaOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {role === 'staff' && (
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {(DEPARTMENT_OPTIONS_BY_SCHOOL[school] || DEFAULT_DEPARTMENT_OPTIONS).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="school-email">School Email</Label>
              <Input id="school-email" type="email" value={schoolEmail} onChange={(e) => setSchoolEmail(e.target.value)} placeholder="john.doe@st.gimpa.edu.gh" className="mt-1" />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create your password" className="mt-1" />
            </div>

            <Button onClick={handleCreateAccount} className="w-full" size="lg" disabled={loading}>
              <UserPlus className="h-4 w-4 mr-2" />
              {loading ? 'Submitting...' : 'Create Account'}
            </Button>

            <Button variant="ghost" className="w-full" onClick={() => navigate('/login')}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
