/* Shared UI kit barrel.
   Import paths stay stable: `@/components/ui/<File>` always works, and the
   primitives below are additionally re-exported here for convenience. */

/* Buttons & surfaces */
export { Button, ButtonLink, buttonVariants } from './Button'
export type { Variant, ButtonSize, StyleProps, CommonProps } from './Button'
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card'
export { Badge, badgeVariants } from './Badge'
export type { BadgeProps, BadgeTone } from './Badge'
export { Separator } from './Separator'
export { Skeleton, SkeletonCard, SkeletonChart, SkeletonConversation, SkeletonTable } from './Skeleton'
export { EmptyState, EMPTY_COPY } from './EmptyState'
export type { EmptyStateProps, EmptyCopyKey } from './EmptyState'

/* Forms
   `Select` stays the native field (puck blocks and public hubs rely on its
   `label`/`name`/`<option>` API). The Radix select lives at
   `@/components/ui/Select` and is re-exported here as `RadixSelect`. */
export { Input, Textarea, Select, Select as NativeSelect } from './Input'
export { Label } from './Label'
export { Checkbox } from './Checkbox'
export { Switch } from './Switch'
export {
  Select as RadixSelect,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from './Select'

/* Overlays */
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog'
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './Sheet'
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './dropdown-menu'
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverClose } from './Popover'
export { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger, InfoTooltip } from './Tooltip'

/* Navigation & data display */
export { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'
export { Avatar, AvatarImage, AvatarFallback, initials } from './Avatar'
export { ScrollArea, ScrollBar } from './ScrollArea'
export { Progress } from './Progress'
export type { ProgressProps, ProgressTone } from './Progress'
export { StatusBadge } from './StatusBadge'
export { PageHeader } from './page-header'
export { Stat } from './stat'
export { DataTable } from './data-table'
export { FilterTabs } from './filter-tabs'
export { Sidebar } from './sidebar'
export { Modal } from './Modal'
export { ToastMessage } from './Toast'
export { ToastProvider, useToast } from './ToastProvider'

/* Marketing / public-site blocks (unchanged public API) */
export { Section, Eyebrow } from './Section'
export { PhotoHero } from './PhotoHero'
export { Flag } from './Flag'
export { FeatureShowcase } from './FeatureShowcase'
export { WhatsAppWidget } from './WhatsAppWidget'
export { MobileCtaBar } from './MobileCtaBar'
export { ExitIntentModal } from './ExitIntentModal'
export { QuizShell, ProgressBar, QuizBackButton, QuizOptionButton } from './QuizShell'
export { GateForm } from './GateForm'
export { ResultCard } from './ResultCard'
export { ResultGate } from './ResultGate'
export { MarkedText } from './MarkedText'
export { CountUp } from './CountUp'
export { StatBand } from './StatBand'
export type { StatBandItem } from './StatBand'
export { EditorialBreak } from './EditorialBreak'
export { BentoGrid } from './BentoGrid'
export type { BentoItem } from './BentoGrid'
export { AvatarRow } from './AvatarRow'
export { QuotePhotoCard } from './QuotePhotoCard'
export { RevealObserver } from './RevealObserver'
export { UtmCapture } from './UtmCapture'
