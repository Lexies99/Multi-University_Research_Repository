import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface DashboardProps {
  userRole: string;
}

export function Dashboard({ userRole }: DashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Papers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">970</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">45,231</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">11,090</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+24%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Active Researchers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">1,247</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest submissions and approvals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: 'Paper Approved', title: 'Neural Networks in Robotics', user: 'Dr. Smith', time: '2 hours ago', status: 'approved' },
              { action: 'New Submission', title: 'Renewable Energy Solutions', user: 'Lisa Zhang', time: '4 hours ago', status: 'pending' },
              { action: 'Paper Approved', title: 'Genetic Algorithms Study', user: 'Prof. Anderson', time: '6 hours ago', status: 'approved' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border-l-2 border-l-primary/20 pl-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.action}</span>: {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.user} • {activity.time}</p>
                </div>
                <Badge variant={
                  activity.status === 'approved' ? 'default' :
                  activity.status === 'revision' ? 'secondary' :
                  'outline'
                }>
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
