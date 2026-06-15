"use client"

import { Button } from "@/components/ui/button"
import type {
  PermissionDefinition,
  PermissionGroup,
  PermissionRouteSection,
} from "@/types/permissions"

type PermissionGroupCardProps = {
  group: PermissionGroup
  selectedKeys: Set<string>
  routeNameByKey: Map<string, string>
  searchTerm: string
  onToggleKey: (key: string, checked: boolean) => void
  onToggleGroup: (group: PermissionGroup, checked: boolean) => void
  onToggleSection: (section: PermissionRouteSection, checked: boolean) => void
}

function getGroupKeys(group: PermissionGroup) {
  return [
    ...group.routeSections.flatMap(section =>
      section.routes.map(route => route.key)
    ),
    ...group.actions.map(action => action.key),
  ]
}

function getSectionKeys(section: PermissionRouteSection) {
  return section.routes.map(route => route.key)
}

function matchesSearch(
  permission: PermissionDefinition,
  searchTerm: string
) {
  if (!searchTerm) return true

  const query = searchTerm.toLowerCase()
  return (
    permission.name.toLowerCase().includes(query) ||
    permission.key.toLowerCase().includes(query) ||
    (permission.href?.toLowerCase().includes(query) ?? false)
  )
}

function PermissionCheckbox({
  permission,
  selectedKeys,
  routeNameByKey,
  onToggleKey,
}: {
  permission: PermissionDefinition
  selectedKeys: Set<string>
  routeNameByKey: Map<string, string>
  onToggleKey: (key: string, checked: boolean) => void
}) {
  const relatedRouteName = permission.relatedRouteKey
    ? routeNameByKey.get(permission.relatedRouteKey)
    : undefined

  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-md border border-dashed border-[#d0d5dd] px-3 py-2 text-sm hover:bg-[#f8f9fa]">
      <input
        type="checkbox"
        className="mt-0.5 size-4 rounded border-[#d0d5dd] accent-[#4DC591]"
        checked={selectedKeys.has(permission.key)}
        onChange={event => onToggleKey(permission.key, event.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-[#373B44]">{permission.name}</span>
        {relatedRouteName && (
          <span className="mt-0.5 block text-xs text-[#8b95a5]">
            Related route: {relatedRouteName}
          </span>
        )}
      </span>
    </label>
  )
}

function RouteCheckbox({
  permission,
  selectedKeys,
  onToggleKey,
}: {
  permission: PermissionDefinition
  selectedKeys: Set<string>
  onToggleKey: (key: string, checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-md border border-[#e8eaed] px-3 py-2 text-sm hover:bg-[#f8f9fa]">
      <input
        type="checkbox"
        className="mt-0.5 size-4 rounded border-[#d0d5dd] accent-[#4DC591]"
        checked={selectedKeys.has(permission.key)}
        onChange={event => onToggleKey(permission.key, event.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-[#373B44]">{permission.name}</span>
        {permission.href && (
          <span className="mt-0.5 block text-xs text-[#8b95a5]">
            {permission.href}
          </span>
        )}
      </span>
    </label>
  )
}

export function PermissionGroupCard({
  group,
  selectedKeys,
  routeNameByKey,
  searchTerm,
  onToggleKey,
  onToggleGroup,
  onToggleSection,
}: PermissionGroupCardProps) {
  const groupKeys = getGroupKeys(group)
  const selectedInGroup = groupKeys.filter(key => selectedKeys.has(key)).length

  const visibleSections = group.routeSections
    .map(section => ({
      ...section,
      routes: section.routes.filter(route => matchesSearch(route, searchTerm)),
    }))
    .filter(section => section.routes.length > 0)

  const visibleActions = group.actions.filter(action =>
    matchesSearch(action, searchTerm)
  )

  if (visibleSections.length === 0 && visibleActions.length === 0) {
    return null
  }

  const isGroupFullySelected =
    groupKeys.length > 0 && groupKeys.every(key => selectedKeys.has(key))

  return (
    <div className="rounded-lg border border-[#e8eaed] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8eaed] px-5 py-4">
        <div>
          <h3 className="font-semibold text-[#373B44]">{group.group}</h3>
          <p className="text-xs text-[#8b95a5]">
            {selectedInGroup} of {groupKeys.length} selected
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onToggleGroup(group, true)}
            disabled={isGroupFullySelected}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onToggleGroup(group, false)}
            disabled={selectedInGroup === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {visibleSections.map(section => {
          const sectionKeys = getSectionKeys(section)
          const selectedInSection = sectionKeys.filter(key =>
            selectedKeys.has(key)
          ).length
          const isSectionFullySelected =
            sectionKeys.length > 0 &&
            sectionKeys.every(key => selectedKeys.has(key))

          return (
            <div key={`${group.group}-${section.section}`} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8b95a5]">
                  {section.section}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8b95a5]">
                    {selectedInSection} of {sectionKeys.length}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleSection(section, true)}
                    disabled={isSectionFullySelected}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleSection(section, false)}
                    disabled={selectedInSection === 0}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {section.routes.map(route => (
                  <RouteCheckbox
                    key={route.key}
                    permission={route}
                    selectedKeys={selectedKeys}
                    onToggleKey={onToggleKey}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {visibleActions.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8b95a5]">
              Actions
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {visibleActions.map(action => (
                <PermissionCheckbox
                  key={action.key}
                  permission={action}
                  selectedKeys={selectedKeys}
                  routeNameByKey={routeNameByKey}
                  onToggleKey={onToggleKey}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function getPermissionGroupKeys(group: PermissionGroup) {
  return getGroupKeys(group)
}

export function getPermissionSectionKeys(section: PermissionRouteSection) {
  return getSectionKeys(section)
}
