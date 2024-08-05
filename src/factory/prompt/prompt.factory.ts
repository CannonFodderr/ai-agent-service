import createLogger from "fodderlogger"
import createOllamaPromptFactory, { LLM_FUNCTION } from "./prompt.ollama3.factory"
import { OllamaModelConfig } from "../../types/ollama.types"
import { UserPromptData } from "../../types/prompt.types"
import fs from 'fs'
import createToolsModule, { ToolList } from "../../modules/tools.module"
import path from 'path'

const logger = createLogger('prompt.factory')
const PROMPT_PATHS = {
    TEST: path.resolve(__dirname, '../../prompts/test.prompt'),
    GENERAL: path.resolve(__dirname, '../../prompts/general.prompt'),
    TOOLS: path.resolve(__dirname, '../../prompts/tool-detection.prompt'),
    // intent: path.resolve(__dirname, '../../../prompts/intent-detection.prompt'),
}
type PromptTemplate = "text" | "json" | "xml" | "markdown"
type PromptKeys = { [key: string]: string }
export class PromptFactory {
    private toolsList: ToolList
    constructor () {
        const toolsModule = createToolsModule()
        this.toolsList = toolsModule.getToolsList()
    }

    inputsToStrings (userPromptData: UserPromptData): PromptKeys | null {
        const { input, messages, context = "", system = "" } = userPromptData
        if(!input) {
            logger.error("No input provided")
            return null
        }
        const messagesString = messages && messages.length ? messages.map((m, i) => {
            if(i === messages.length - 1) {
                return `${m.role}: ${m.message}`
            }
            return `${m.role}: ${m.message},`
        }).join('\n') : ''
        const contextStr = typeof context === "string" ? context : JSON.stringify(context).trim()
        const systemStr = typeof system === "string" ? system : ""
        return { input, history: messagesString, context: contextStr, system: systemStr }
    }
    replaceVariablesInPromptFile(userData: UserPromptData, llmFunction?: LLM_FUNCTION): string | null {
        const promptPath = this.getPromptPathByLLMFunction(llmFunction)
        if(!promptPath) {
            logger.error("No prompt path")
            return null
        }
        let fileContent = fs.readFileSync(promptPath, 'utf8')
        const stringifiedValues = this.inputsToStrings(userData)
        if(!stringifiedValues) {
            logger.error("No stringified values")
            return null
        }
        if(llmFunction === LLM_FUNCTION.TOOLS_DETECTION) {
            stringifiedValues['tools'] = JSON.stringify(this.toolsList)
        }
        let content = fileContent

        // Find all variables in the content, remove the triple curly braces
        const variables = fileContent.match(/\{\{\{\s*([\w]+)\s*\}\}\}/g)?.map(match => match.replace(/\{\{\{\s*([\w]+)\s*\}\}\}/g, '$1'))


        if(!variables) {
            logger.warn(`No variables found in prompt file: ${promptPath}`)
            return content
        }

        const strigifiedKeys = Object.keys(stringifiedValues)

        // Replace each variable in the content
        for (const key of variables) {
            const keyRegexTemplate = new RegExp(`{\\{\\{\\s*${key}\\s*\\}\\}\\}`, 'g')
            if (!strigifiedKeys.includes(key) || !stringifiedValues[key]) {
                content = content.replace(keyRegexTemplate, '')
                continue
            }
            const value: string = stringifiedValues[key]
            const templateType = key === 'tools' ? "xml" : "text"
            content = content.replace(keyRegexTemplate, this.keyValueTemplates(key, value, templateType))
        }
        // Replace the system prompt if it exists
        if(stringifiedValues['system']) {
            const systemPromptRegex = /<system>([\s\S]*?)<\/system>/
            content = content.replace(systemPromptRegex, `<system>${stringifiedValues['system']}</system>`)
        }
        return content.trim().replace(/\n{2,}/g, '\n')
    }
    keyValueTemplates (key: string, value: string, template: PromptTemplate = "text"): string {
        if(key === 'tools') {
            return `<tools>${value.trim()}</tools>`
        }
        if(template === "markdown") {
            return `**${key}**: ${value.trim()}`
        }
        if(template === "xml") {
            return `<${key}>${value.trim()}</${key}>`
        }

        return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value.trim()}`
    }
    getPromptPathByLLMFunction (llmFunction?: LLM_FUNCTION): string {
        if(!llmFunction) return PROMPT_PATHS.GENERAL
        switch(llmFunction) {
            case LLM_FUNCTION.TOOLS_DETECTION: return PROMPT_PATHS.TOOLS
            // case LLM_FUNCTION.INTENT_DETECTION: return PROMPT_PATHS.INTENT
            default: return PROMPT_PATHS.GENERAL
        }
    }
    generatePrompt (userConfig: UserPromptData, modelConfig: OllamaModelConfig, llmFunction?: LLM_FUNCTION): string {
        const prompt = this.replaceVariablesInPromptFile(userConfig, llmFunction)
        console.log({ prompt })
        return prompt || ''
        // switch(modelConfig.model) {
        //     case "llama3": return createOllamaPromptFactory().generatePrompt(userConfig, llmFunction)
        //     default: return createOllamaPromptFactory().generatePrompt(userConfig, llmFunction)
        // }
    }
}

export default function createPromptFactory () {
    return new PromptFactory()
}
