import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type * as React from 'react'
import { DropdownMenu, Select as SelectPrimitive } from 'radix-ui'

import { cn } from '#/lib/utils'

const EMPTY_VALUE = '__verabloom_empty__'

type SelectProps = React.ComponentProps<typeof SelectPrimitive.Root> & {
  id?: string
  name?: string
  required?: boolean
  className?: string
  placeholder?: string
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

type MultiSelectOption = {
  value: string
  label: React.ReactNode
}

type MultiSelectProps = {
  id?: string
  value?: readonly string[]
  defaultValue?: readonly string[]
  onValueChange?: (value: string[]) => void
  options: readonly MultiSelectOption[]
  className?: string
  placeholder?: React.ReactNode
  disabled?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

function Select({
  id,
  name,
  required,
  className,
  placeholder,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  value,
  defaultValue,
  onValueChange,
  children,
  ...props
}: SelectProps) {
  const [internalValue, setInternalValue] = useState(
    value ?? defaultValue ?? '',
  )
  const selectedValue = value ?? internalValue

  function handleValueChange(nextValue: string) {
    const actualValue = nextValue === EMPTY_VALUE ? '' : nextValue
    setInternalValue(actualValue)
    onValueChange?.(actualValue)
  }

  return (
    <SelectPrimitive.Root
      {...props}
      data-slot="select"
      value={selectedValue || EMPTY_VALUE}
      onValueChange={handleValueChange}
    >
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 disabled:pointer-events-none disabled:opacity-50 [&>span]:truncate',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 opacity-60"
        />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="relative z-50 max-h-72 min-w-[8rem] overflow-hidden rounded-md border bg-card text-card-foreground shadow-lg"
        >
          <SelectPrimitive.Viewport className="p-1">
            {children}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={selectedValue}
          required={required}
        />
      ) : null}
    </SelectPrimitive.Root>
  )
}

function SelectItem({
  className,
  children,
  value,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-2 pr-8 pl-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      value={value || EMPTY_VALUE}
      {...props}
    >
      <span className="absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check aria-hidden="true" className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function MultiSelect({ className, ...props }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(
    props.value ?? props.defaultValue ?? [],
  )
  const selectedValues = props.value ?? internalValue
  const selectedOptions = props.options.filter((option) =>
    selectedValues.includes(option.value),
  )

  function handleCheckedChange(optionValue: string, checked: boolean) {
    const nextValue = checked
      ? [...selectedValues, optionValue]
      : selectedValues.filter((value) => value !== optionValue)
    setInternalValue(nextValue)
    props.onValueChange?.(nextValue)
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          aria-describedby={props['aria-describedby']}
          aria-invalid={props['aria-invalid']}
          aria-label={props['aria-label']}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-ring/50 disabled:pointer-events-none disabled:opacity-50',
            className,
          )}
          disabled={props.disabled}
          id={props.id}
          type="button"
        >
          <span className="truncate">
            {selectedOptions.length > 0
              ? selectedOptions.map((option, index) => (
                  <span key={option.value}>
                    {index > 0 ? ', ' : null}
                    {option.label}
                  </span>
                ))
              : props.placeholder}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 opacity-60"
          />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          className="relative z-50 min-w-48 overflow-hidden rounded-md border bg-card p-1 text-card-foreground shadow-lg"
          sideOffset={6}
        >
          {props.options.map((option) => (
            <DropdownMenu.CheckboxItem
              checked={selectedValues.includes(option.value)}
              className="relative flex w-full cursor-default select-none items-center rounded-sm py-2 pr-8 pl-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              key={option.value}
              onCheckedChange={(checked) =>
                handleCheckedChange(option.value, checked)
              }
              onSelect={(event) => event.preventDefault()}
            >
              <span className="absolute left-2 flex size-4 items-center justify-center">
                <DropdownMenu.ItemIndicator>
                  <Check aria-hidden="true" className="size-4" />
                </DropdownMenu.ItemIndicator>
              </span>
              {option.label}
            </DropdownMenu.CheckboxItem>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export { MultiSelect, Select, SelectItem }
