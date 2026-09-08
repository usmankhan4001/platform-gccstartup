import type { Field } from '@puckeditor/core'

export function createMediaPickerField(label: string): Field<string> {
  return {
    type: 'custom',
    label,
    render: () => <input type="text" placeholder={label} />,
  }
}

export function MediaPickerModal() {
  return null
}