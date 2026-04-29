import * as React from "react"
import { cn } from "@/lib/utils"

export const Select = ({ value, onValueChange, className, children }: { value?: string, onValueChange: (value: string) => void, className?: string, children: React.ReactNode }) => {
  return (
    <select
      value={value}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {children}
    </select>
  )
}

export const SelectTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const SelectValue = ({ placeholder }: { placeholder?: string }) => placeholder ? <option value="" disabled>{placeholder}</option> : null
export const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const SelectItem = ({ value, children }: { value: string, children: React.ReactNode }) => <option value={value}>{children}</option>
