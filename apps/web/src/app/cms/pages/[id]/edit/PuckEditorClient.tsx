'use client'

import { Puck, type Data } from '@puckeditor/core'
import '@puckeditor/core/dist/index.css'
import { config } from '@/puck/config'

export default function PuckEditorClient({
  pageId,
  initialData,
  pageTitle
}: {
  pageId: string
  initialData: Data
  pageTitle: string
}) {
  const handlePublish = async (data: Data) => {
    try {
      const res = await fetch(`/api/cms/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // In Puck, we just save the whole `data` object into our blocks column
          blocks: data
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }
      alert('Saved successfully!')
    } catch (err: any) {
      alert(`Error saving page: ${err.message}`)
    }
  }

  return (
    <Puck
      config={config as any}
      data={initialData}
      onPublish={handlePublish}
    />
  )
}
