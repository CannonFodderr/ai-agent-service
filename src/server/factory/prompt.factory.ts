import createLogger from "fodderlogger"

const logger = createLogger('prompt.factory')

export class PromptFactory {
    private defaultConfig: PromptConfig
    constructor (config?: PromptConfig) {
        this.defaultConfig = config || this.getDefaultConfig()
    }
    getDefaultConfig (): PromptConfig {
        return {
            system: "You are a a helpful assistant",
        }
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
    generatePrompt (userConfig: UserPromptData): string {
        const system = userConfig.system || this.defaultConfig.system
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

export default function createPromptFactory () {
    return new PromptFactory()
}