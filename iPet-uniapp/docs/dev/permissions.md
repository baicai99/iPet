# Permissions Matrix (Admin UI)

## Background
Permissions must be explicit, traceable, and enforced consistently across routes
and UI actions. This doc defines the capability matrix used by the admin UI.

## Scope
- Backend admin UI (`backend-ui`)
- Role-based capabilities for pages and actions

## Rules
- Use `core/auth/permissions.ts` as the source of truth.
- Route guards do coarse filtering (role-level).
- Component-level actions use `usePermission().can('capability')`.
- Do not hardcode `isSuperAdmin = true` or similar shortcuts.

## Capability Examples
- `user:ban` / `user:unban`: ban or unban a user
- `user:delete`: delete a user (soft delete)
- `article:delete`: delete an article

## Example
```ts
const { can } = usePermission();

if (can('article:delete')) {
  // show delete button
}
```
