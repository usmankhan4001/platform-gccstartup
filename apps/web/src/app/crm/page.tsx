import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

const stats = [
  { title: 'Contacts', value: '2,453', change: '+12%' },
  { title: 'Deals', value: '89', change: '+5%' },
  { title: 'Pipeline Value', value: '$1.2M', change: '+18%' },
  { title: 'Open Conversations', value: '34', change: '-3%' },
]

export default function CrmDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-text">{stat.value}</p>
              <p className="mt-1 text-sm text-success">{stat.change} this month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              No recent activity to display.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              No upcoming tasks.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
