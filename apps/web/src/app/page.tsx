import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-bold text-text">GCC Startup Platform</h1>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-20">
        <section className="mb-20 text-center">
          <h2 className="mb-4 text-5xl font-bold text-text">
            Build your startup, <span className="text-primary">faster</span>
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-text-secondary">
            All-in-one platform with CRM, CMS, and API management designed for
            startups in the Gulf Cooperation Council region.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="/demo">
              <Button variant="ghost" size="lg">Watch Demo</Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>CRM</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Manage contacts, deals, and pipelines. Track every interaction
                and close deals faster with automated workflows.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CMS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                Create and manage content with a visual page builder. Publish
                posts, manage media, and optimize for SEO.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary">
                RESTful API with authentication, rate limiting, and
                comprehensive documentation. Integrate with anything.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
