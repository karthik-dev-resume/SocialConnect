"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
} | null>(null)

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
}

function Select({ value, onValueChange, children, disabled }: SelectProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            if (child.type === SelectTrigger) {
              return React.cloneElement(child, { disabled } as any)
            }
            if (child.type === SelectContent) {
              return React.cloneElement(child, {
                onSelect: (newValue: string) => {
                  onValueChange(newValue)
                  setOpen(false)
                },
              } as any)
            }
          }
          return child
        })}
      </DropdownMenuPrimitive.Root>
    </SelectContext.Provider>
  )
}

interface SelectTriggerProps extends React.ComponentProps<typeof DropdownMenuPrimitive.Trigger> {
  children: React.ReactNode
}

function SelectTrigger({ children, className, disabled, ...props }: SelectTriggerProps) {
  return (
    <DropdownMenuPrimitive.Trigger
      asChild
      disabled={disabled}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:outline-none focus:ring-1 focus:ring-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <button type="button" disabled={disabled}>
        {children}
        <ChevronDownIcon className="h-4 w-4 opacity-50 ml-2" />
      </button>
    </DropdownMenuPrimitive.Trigger>
  )
}

interface SelectContentProps extends React.ComponentProps<typeof DropdownMenuPrimitive.Content> {
  children: React.ReactNode
  onSelect?: (value: string) => void
}

function SelectContent({
  children,
  className,
  onSelect,
  ...props
}: SelectContentProps) {
  const context = React.useContext(SelectContext)

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md",
          className
        )}
        align="start"
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === SelectItem) {
            return React.cloneElement(child, {
              currentValue: context?.value,
              onSelect,
            } as any)
          }
          return child
        })}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

interface SelectItemProps extends React.ComponentProps<typeof DropdownMenuPrimitive.Item> {
  value: string
  children: React.ReactNode
  currentValue?: string
  onSelect?: (value: string) => void
}

function SelectItem({
  value,
  children,
  currentValue,
  onSelect,
  className,
  ...props
}: SelectItemProps) {
  const isSelected = currentValue === value

  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onSelect={() => onSelect?.(value)}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <CheckIcon className="h-4 w-4" />}
      </span>
      {children}
    </DropdownMenuPrimitive.Item>
  )
}

export { Select, SelectTrigger, SelectContent, SelectItem }

