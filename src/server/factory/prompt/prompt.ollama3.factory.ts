let factory: undefined | Ollama3PromptFactory
export enum LLM_FUNCTION  {
    GENERAL = "general",
    INTENT_DETECTION = "intent",
    TOOLS_DETECTION = "tools"
}
const tools = ['chat_history', 'weather_api', 'stockmarket_api', 'calculator']
const systemMessages = {
    general: "You are a a helpful assistant, If you don't know the answer say you don't know",
    intent: "Detect the topic of the user input and set how confident you are with the detection, answer ONLY with JSON object { 'intent': string, confidence: number }. if you are unable to detect set intent to none.",
    tools: `using the chat history assess if you can answer the user input if you are not check if any of these tools: ${tools} might help. answer ONLY with JSON object { 'canAnswer': boolean, 'tool': string } if a tool is required set its name to the JSON tool property and canAnswer should be false. if you unable to answer but if you are unable to answer set canAnswer to false and tool to empty string to none."`
}

class Ollama3PromptFactory {
    private getDefaultSystemConfig (llmFunction?: LLM_FUNCTION): string {
        if(llmFunction === LLM_FUNCTION.INTENT_DETECTION) {
            return systemMessages.intent
        } else if (llmFunction === LLM_FUNCTION.TOOLS_DETECTION) {
            return systemMessages.tools
        }

        return systemMessages.general
        
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
    
    generatePrompt (userConfig: UserPromptData, llmFunction?: LLM_FUNCTION) {
        const system = llmFunction || !userConfig.system ? this.getDefaultSystemConfig(llmFunction) : userConfig.system
        const userInput = this.generateUserInputMessage(userConfig.input)
        const messageHistory = userConfig.messages || []
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