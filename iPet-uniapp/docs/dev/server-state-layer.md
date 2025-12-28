# Server State Layer (Query)

## Background
The admin UI now uses a dedicated server state layer to reduce duplicate requests,
centralize loading/error handling, and make data caches explicit.

## Scope
- Backend admin UI (`backend-ui`)
- Data fetching for dashboard and user management

## Rules
- Use TanStack Query for list/detail data; avoid ad-hoc `useEffect + try/catch` in pages.
- Prefer query keys with a stable prefix (e.g. `['users', params]`).
- Provide `staleTime` and `gcTime` to balance freshness and cache reuse.
- Mutations must invalidate related list/detail queries.

## Example
```ts
const userDetailQuery = useQuery({
  queryKey: ['user', userId],
  queryFn: () => getUserById(userId),
  enabled: Boolean(userId),
  staleTime: 2 * 60 * 1000,
});

const banMutation = useMutation({
  mutationFn: () => banUser(userId, { reason }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
  },
});
```
