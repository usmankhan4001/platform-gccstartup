import { db } from '@/lib/db'
import { pages } from '@gccstartup/db'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import PuckEditorClient from './PuckEditorClient'

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const rows = await db.select().from(pages).where(eq(pages.id, id)).limit(1)
  const pageRecord = rows[0]

  if (!pageRecord) {
    notFound()
  }

  // default to empty root if no blocks yet
  const initialData = {
    content: pageRecord.blocks && Array.isArray(pageRecord.blocks) && pageRecord.blocks.length > 0 
      ? pageRecord.blocks 
      : [],
    root: {},
    zones: {}
  }

  // Some puck versions store data.content, some data.blocks etc,
  // But usually data has { content, root, zones }
  // Wait, `pageRecord.blocks` is usually the array of blocks? If we saved `data`, we might have saved the whole object in blocks.
  // We'll pass the raw blocks if it matches Puck Data, otherwise a structure.
  const puckData = typeof pageRecord.blocks === 'object' && !Array.isArray(pageRecord.blocks) && pageRecord.blocks !== null
    ? pageRecord.blocks
    : initialData

  return (
    <div className="h-screen w-full flex flex-col">
      <PuckEditorClient pageId={pageRecord.id} initialData={puckData as any} pageTitle={pageRecord.title} />
    </div>
  )
}
