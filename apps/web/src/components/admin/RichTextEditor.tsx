import type { Field } from '@puckeditor/core'

export function createRichTextField(label: string): Field<string> {
  return {
    type: 'custom',
    label,
    render: () => <textarea placeholder={label} />,
  }
}

export function RichTextEditor() {
  return null
}