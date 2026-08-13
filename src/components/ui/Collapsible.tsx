import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-t border-line pt-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-sm font-medium text-ink"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {title}
        <ChevronDown size={16} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="mt-2.5">{children}</div>}
    </div>
  )
}
