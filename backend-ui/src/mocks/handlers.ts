import { http } from 'msw';

// Will import fixtures here
import { authHandlers } from './fixtures/auth';
import { dashboardHandlers } from './fixtures/dashboard';
import { usersHandlers } from './fixtures/users';
import { systemHandlers } from './fixtures/system';

import { articleHandlers } from './fixtures/articles';

export const handlers = [
    ...authHandlers,
    ...dashboardHandlers,
    ...usersHandlers,
    ...systemHandlers,
    ...articleHandlers,

    // Fallback for unhandled requests
    http.all('*', () => {
        return;
    }),
];
