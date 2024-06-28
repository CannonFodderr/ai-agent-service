import getConfig from "./config"
import createLogger from "fodderlogger/dist"
import { panic } from "./utils/process.utils"
import createServer from "./server/server"

const logger = createLogger('index')


function init () {
    try {
        const loadedConfig = getConfig()
        if(!loadedConfig) return panic(0, "Failed to load configuration")
        
        
        const server = createServer(loadedConfig)
        server.listen()
    } catch (error) {
        logger.error(`Error initializing application: ${error}`)
    }
    
}


init()