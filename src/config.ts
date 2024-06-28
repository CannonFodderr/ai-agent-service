
import { env } from 'node:process'
import createLogger from 'fodderlogger'

const logger = createLogger('config-loader')

const CONFIG_KEY_TYPES: CONFIG_KEY_TYPE[] = [
    { key: 'ENV', type: 'string' },
    { key: 'SERVER_HTTP_PORT', type: 'number' },
    { key: 'OLLAMA_HOST', type: 'string' },
    { key: 'OLLAMA_PORT', type: 'number' }
]
function getEmptyConfig (): Config {
    return {
        ENV: '',
        SERVER_HTTP_PORT: '',
        OLLAMA_HOST: '',
        OLLAMA_PORT: ''
    }
}
function parseKeyValues (index: number, originalKey: string) {
    const type = CONFIG_KEY_TYPES[index].type
    if(type === "number") {
        return Number(env[originalKey])
    } else {
        return env[originalKey]
    }
}
export function mountConfiguration (): Config | null {
    try {
        const allowedKeys = CONFIG_KEY_TYPES.map(k => k.key)
        const envKeys = Object.keys(env)
        const config: Config = getEmptyConfig()

        envKeys.forEach((k: string) => {
            const typedKey = k as CONFIG_KEY
            const keyIndex = allowedKeys.indexOf(typedKey)
            if (keyIndex > -1) {
                config[typedKey] = parseKeyValues(keyIndex, k)
            }
        })
        // logger.table(config)
        return config
    } catch (error) {
        logger.error(`Error loading configuration: ${error}`)
        return null
    }
}


let config: Config | null
export function initConfig (): Config | null {
    try {
        config = mountConfiguration()
    } catch (error) {
        logger.error(`Error initializing configuration: ${error}`)
    }
    return config
}

export default function getConfig() {
    if(!config) {
        config = initConfig()
        logger.info('Configuration initialized')
    }
    return config
}