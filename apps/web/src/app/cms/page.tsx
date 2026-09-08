import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

const stats = [
  { title: 'Pages', value: '24', change: '+3' },
  { title: 'Posts', value: '156', change: '+8' },
  { title: 'Media Files', value: '1,024', change: '+42' },
  { title: 'Published', value: '168', change: '+11' },
]

export default function CmsDashboardPage() {
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
              <p className="mt-1 text-sm text-success">{stat.change} this week</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Edits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              No recent edits to display.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Draft Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              No draft posts.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
