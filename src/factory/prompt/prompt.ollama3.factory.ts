import createToolsModule, { ToolList } from "../../modules/tools.module"
import { PromptMessage, UserPromptData } from "../../types/prompt.types"


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
        let systemPrompt = "You are a a helpful AI assistant, If you don't know the answer say you don't know."
        if(llmFunction === LLM_FUNCTION.INTENT_DETECTION) {
            return "Detect the topic of the user input and set how confident you are with the detection, answer ONLY with JSON object { 'intent': string, confidence: number }. if you are unable to detect set intent to none."
        } else if (llmFunction === LLM_FUNCTION.TOOLS_DETECTION) {
            systemPrompt = `You are provided with function signatures within <tools></tools> XML tags. You may call one or more functions to assist with the user query. Don't make assumptions about what values to plug into functions. Return a list of objects containing the function name and arguments as follows:

                {"name": <function-name>,"arguments": <args-dict>}

                Here are the available tools:
                <tools>${JSON.stringify(this.toolsList)}</tools>

                answer ONLY with the list of JSON objects you populated.`
        }
        if(context) {
            const contextStr = typeof context !== "string" ? JSON.stringify(context).trim() : context
            systemPrompt = `If needed, use this context: ${contextStr} to try and answer, do not include mention of the context in the answer. ${systemPrompt}`
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
