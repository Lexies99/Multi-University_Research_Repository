import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function LibraryStats() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
          <CardDescription>View library statistics and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Total Documents</h3>
              <p className="text-2xl font-bold text-primary">970</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Total Downloads</h3>
              <p className="text-2xl font-bold text-primary">45,231</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Active Users</h3>
              <p className="text-2xl font-bold text-primary">1,247</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold">Total Views</h3>
              <p className="text-2xl font-bold text-primary">180,500</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
