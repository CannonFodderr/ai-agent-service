import createLogger from 'fodderlogger/dist'
import { getTime, getDate } from '../tools/date-time.tool'
import { getOsInfo } from '../tools/os.tool'

let toolsmodule: undefined | ToolsModule

type ToolsMap = { [key: string]: { executor:  (...args: any) => any, description?: string }}
export type ToolList = { name: string, description?: string }[]
const logger = createLogger('tools.module')
export type ExecutorResponse = {
    toolUsed: string,
    data: any
}
export class ToolsModule {
    private tools: ToolsMap
    constructor () {
        this.tools = { 
            "date_tool":  { executor: getDate, description: "Returns the current date" },
            "time_tool": { executor: getTime, description: "Returns the current time" },
            "os_info": { executor: getOsInfo, description: "Returns operating system (OS) information" },
            "tools_info": { executor: () => this.getToolsList, description: "Returns a list of tools available for the AI to answer with to use as context" }
        }
    }
    getToolsList (): ToolList {
        return Object.keys(this.tools).map(name => { 
            return {
                name,
                description: this.tools[name].description
            }
         })
    }
    async executeTool (toolName: string, ...args: any[]): Promise<ExecutorResponse | null> {
        const toolIndex = Object.keys(this.tools).indexOf(toolName)
        try {
            if(toolIndex === -1) {
                logger.error(`Tool ${toolName} not found`)
                return null
            }
            const toolExecutor = this.tools[toolName].executor
            const toolResponse = await toolExecutor(...args)
            return { toolUsed: toolName, data: toolResponse }
        } catch (error) {
            logger.error(error)            
            return null
        }
    }
}


export default function createToolsModule () {
    if(!toolsmodule) {
        toolsmodule = new ToolsModule()
    }
    return toolsmodule
}