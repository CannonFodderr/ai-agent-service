import createToolsModule, { ToolList } from "../../modules/tools.module"
import { PromptMessage, UserPromptData } from "../../types/prompt"


let factory: undefined | Ollama3PromptFactory
export enum LLM_FUNCTION  {
    GENERAL = "general",
    INTENT_DETECTION = "intent",
    TOOLS_DETECTION = "tools"
}

class Ollama3PromptFactory {
    private toolsList: ToolList
    constructor () {
        const toolsModule = createToolsModule()
        this.toolsList = toolsModule.getToolsList()
    }
    private getDefaultSystemConfig (llmFunction?: LLM_FUNCTION, context?: any): string {
        let systemPrompt = "You are a a helpful assistant, If you don't know the answer say you don't know."
        if(llmFunction === LLM_FUNCTION.INTENT_DETECTION) {
            return "Detect the topic of the user input and set how confident you are with the detection, answer ONLY with JSON object { 'intent': string, confidence: number }. if you are unable to detect set intent to none."
        } else if (llmFunction === LLM_FUNCTION.TOOLS_DETECTION) {
            systemPrompt = `Answer with a VALID JSON (REMOVE LINE BREAKS) only. Check if any of these tools (${JSON.stringify(this.toolsList)}) might help. if a tool is required set its name to the JSON tool property and canAnswer should be false. if you unable to answer but if you are unable to answer set canAnswer to false and tool to empty string to none. answer ONLY with JSON object { 'canAnswer': boolean, 'tool': string }"`
        }
        if(context) {
            const contextStr = typeof context !== "string" ? JSON.stringify(context).trim() : context
            systemPrompt = `If needed, use this context: ${contextStr} to try and answer. ${systemPrompt}`
        }
        return systemPrompt
        
    }
    private generateMessageHistoryFromUserData (messages: PromptMessage[]): string {
        let historyString = ""
        for (let i = 0; i < messages.length; i++) {
            const mData = messages[i]
            if(!["user", "assistant"].includes(mData.role)) continue
            const newMessage = `<|start_header_id|>${mData.role.toLowerCase()}<|end_header_id|>
            ${mData.message.trim()}<|eot_id|>`

            historyString += newMessage
        }
        return historyString
    }
    private generateUserInputMessage (userInput: string) {
        return `<|start_header_id|>user<|end_header_id|>${userInput}<|eot_id|>`
    }
    
    generatePrompt (promptConfig: UserPromptData, llmFunction?: LLM_FUNCTION) {
        const context = promptConfig.context || ""
        const system = llmFunction || !promptConfig.system ? this.getDefaultSystemConfig(llmFunction, context) : promptConfig.system
        const userInput = this.generateUserInputMessage(promptConfig.input)
        const messageHistory = promptConfig.messages || []
        const historyMessages = messageHistory.length ? this.generateMessageHistoryFromUserData(messageHistory): ""
        return `
            <|begin_of_text|>
            <|start_header_id|>system<|end_header_id|>
                ${system}<|eot_id|>
            ${historyMessages}
            ${userInput}

            <|start_header_id|>assistant<|end_header_id|>
        `
    }
}

export default function createOllamaPromptFactory () {
    if(!factory) {
        factory = new Ollama3PromptFactory
    }
    return factory
}