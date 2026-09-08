export function Tooltip({ content, children }: { content: string; children: React.ReactNode }) { return <div title={content}>{children}</div> }
