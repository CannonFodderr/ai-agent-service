import assert from 'node:assert'
import { describe, it} from 'node:test'
import { OllamaService } from '../../service/ollama-service'
import { UserPromptData } from '../../types/prompt.types'
import { bufferStreamToString, isStream } from '../../utils/stream.utils'
import { OllamaEmbeddingRequestPayload } from '../../types/ollama.types'

const model = 'llama3'
const embedModel = "nomic-embed-text"
const toolModel = 'llama3-groq-tool-use'
let ollamaService: OllamaService | undefined =  new OllamaService()
describe(`llm service test suite`, async () => {
    it(`@health - Should create ollama service`, async () => {
        assert.notEqual(ollamaService, undefined)
    })
    it(`@health - Should get list of available models`, async () => {
        const modelsList = await ollamaService.getModelsList()
        console.log({ modelsList: modelsList.map(m => {
            return {
                name: m.name, family: m.details.family
            }
        }) })
        assert.equal(modelsList.length > 0, true)
    })
    it(`@payload - Should fail to get response - bad payload`, async () => {
        const payload: UserPromptData = {
            input: "",
            config: {
                streaming: false,
                model
            }
        }
        const res = await ollamaService.llmGenerate(payload)
        assert.equal(res, null)
    })
    it(`@health Should get response from llm`, async () => {
        const payload: UserPromptData = {
            input: "Hello from user...",
            config: {
                streaming: false,
                model 
            }
        }

        const { data } = await ollamaService.llmGenerate(payload) || {}
        assert.notEqual(data, undefined)
        assert.equal(isStream(data), true)
        const str = await bufferStreamToString(data)
        assert.notEqual(str, null)
        assert.equal(str && str.length > 0, true)
    })
    it(`@health - should get response with version included`, async () => {
        const version = 'latest'
        const payload: UserPromptData = {
            input: "Hello from user...",
            config: {
                streaming: false,
                model: `${model}:${version}`
            }
        }
        const { data } = await ollamaService.llmGenerate(payload) || {}
        assert.notEqual(data, undefined)
        assert.equal(isStream(data), true)
        const str = await bufferStreamToString(data)
        assert.notEqual(str, null)
        assert.equal(str && str.length > 0, true)
    })
    it(`@tools - Should get current date with tool`, async () => {
        const payload: UserPromptData = {
            input: "What date is today ?",
            config: {
                streaming: false,
                model,
                toolModel
            }
        }
        const { data } = await ollamaService.llmGenerate(payload) || {}
        assert.notEqual(data, undefined)
        assert.equal(isStream(data), true)
        const str = await bufferStreamToString(data)
        assert.notEqual(str, null)
        assert.equal(str && str.length > 0, true)
    })
    it (`@tools - Should detect usage of tool 'date'`, async () => {
        const payload: UserPromptData = {
            input: "What time is it ?",
            config: {
                streaming: false,
                model,
                toolModel
            }
        }
        const validTools = await ollamaService.llmCheckTools(payload)
        console.log({ validTools })
        assert.notEqual(validTools, undefined)
        assert(validTools)
        assert.equal(validTools[0].name, "time_tool")
        assert.equal(typeof validTools[0].arguments === "object", true)
    })
    it(`@tools - Should detect usage of tool 'os'`, async () => {
        const payload: UserPromptData = {
            input: "Get system info",
            config: {
                streaming: false,
                model,
                toolModel
            }
        }
        const validTools = await ollamaService.llmCheckTools(payload)
        console.log({ validTools })
        assert.notEqual(validTools, undefined)
        assert(validTools)
        assert.equal(validTools[0].name, "os_info")
        assert.equal(typeof validTools[0].arguments === "object", true)
    })
    it(`@tools - Should get current time in ms with tool`, async () => {
        const payload: UserPromptData = {
            input: "How much time until new years eve ?",
            config: {
                streaming: false,
                model,
                toolModel
            }
        }
        const { data } = await ollamaService.llmGenerate(payload) || {}
        assert.notEqual(data, undefined)
        assert.equal(isStream(data), true)
        const str = await bufferStreamToString(data)
        assert.notEqual(str, null)
        assert.equal(str && str.length > 0, true)
    })
    it(`@tools - Should use the os tool to get system info`, async () => {
        const payload: UserPromptData = {
            input: "What is my system info ?",
            config: {
                streaming: false,
                model,
                toolModel
            }
        }
        const { data } = await ollamaService.llmGenerate(payload) || {}
        assert.notEqual(data, undefined)
        assert.equal(isStream(data), true)
        const str = await bufferStreamToString(data)
        assert.notEqual(str, null)
        assert.equal(str && str.length > 0, true)
        // assert.equal(str && str.includes("GB"), true)
    })
    it(`@history - Should respond according to injected message history`, async () => {
        const payload: UserPromptData = {
            input: "What is my name?",
            config: {
                streaming: false,
                model 
            },
            messages: [
                {
                    role: "user",
                    message: "My name is Inigo Montoya you killed my mother prepare to die"
                }
            ]
        }
        const { data } = await ollamaService.llmGenerate(payload) || {}
        assert.notEqual(data, undefined)
        assert.equal(isStream(data), true)
        const str = await bufferStreamToString(data)
        assert.notEqual(str, null)
        console.log({ str })
        assert.equal(str && str.length > 0, true)
        assert.equal(str && str.includes("Inigo Montoya"), true)
    })
    it(`@system - Should alter behaivour if system prompt is sent in the request`, async () => {
        const payload: UserPromptData = {
            input: "What is my name?",
            config: {
                streaming: false,
                model 
            },
            system: "You can only respond with one word which is 'OK' "
        }
        const { data } = await ollamaService.llmGenerate(payload) || {}
        assert.notEqual(data, undefined)
        assert.equal(isStream(data), true)
        const str = await bufferStreamToString(data)
        assert.notEqual(str, null)
        console.log({ str })
        assert.equal(str && str.length > 0, true)
        assert.equal(str && str.includes("OK"), true)
    })
    it(`@embed - Should generate new embeddings`, async () => {
        const payload: OllamaEmbeddingRequestPayload = {
            prompt: "What is my name?",
            model: embedModel
        }
        const embeddings = await ollamaService.generateEmbeddings(payload)
        console.log({ embeddings })
        assert(embeddings)
        assert(Array.isArray(embeddings) && embeddings.length > 0)
    })
})