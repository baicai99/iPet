import { MockMethod } from 'vite-plugin-mock'
import { MockDefinition } from './types/common'

// Import all handler modules
import * as metricHandlers from './handlers/metricHandlers'
import * as petHandlers from './handlers/petHandlers'
import * as authHandlers from './handlers/authHandlers'
import * as userHandlers from './handlers/userHandlers'
import * as healthReportHandlers from './handlers/healthReportHandlers'
import * as insightHandlers from './handlers/insightHandlers'
import * as notificationHandlers from './handlers/notificationHandlers'
import * as syncHandlers from './handlers/syncHandlers'

// Helper to check if an item is a MockDefinition
const isMockDefinition = (item: any): item is MockDefinition => {
    return item && typeof item === 'object' && 'url' in item && 'method' in item && 'handler' in item
}

// Adapter to convert our MockDefinition to vite-plugin-mock MockMethod
const adaptMock = (def: MockDefinition): MockMethod => {
    return {
        url: def.url,
        method: def.method.toLowerCase() as any, // vite-plugin-mock uses lowercase
        response: (opt: { body: any, query: any, headers: any, url: string }) => {
            const config = {
                url: opt.url,
                method: def.method as any,
                data: opt.body,
                header: opt.headers,
                params: opt.query
            }
            return def.handler(config)
        }
    }
}

// Auto-discover all mocks
const discoverMocks = (...modules: any[]): MockMethod[] => {
    const mocks: MockMethod[] = []

    modules.forEach(mod => {
        Object.values(mod).forEach(exportItem => {
            if (isMockDefinition(exportItem)) {
                mocks.push(adaptMock(exportItem))
            }
        })
    })

    return mocks
}

// Export aggregated mocks
export default discoverMocks(
    metricHandlers,
    petHandlers,
    authHandlers,
    userHandlers,
    healthReportHandlers,
    insightHandlers,
    notificationHandlers,
    syncHandlers
) as MockMethod[]
