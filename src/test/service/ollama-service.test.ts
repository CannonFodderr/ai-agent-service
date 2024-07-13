import assert from 'node:assert'
import { describe, it} from 'node:test'
import { OllamaService } from '../../service/ollama-service'
import { UserPromptData } from '../../types/prompt.types'
import { bufferStreamToString, isStream } from '../../utils/stream.utils'


let ollamaService: OllamaService | undefined =  new OllamaService()
let model = 'llama3:latest'
describe(`llm service test suite`, async () => {
    it(`Should create ollama service`, async () => {
        assert.notEqual(ollamaService, undefined)
    })
    it(`Should get list of available models`, async () => {
        const modelsList = await ollamaService.getModelsList()
        console.log({ modelsList: modelsList.map(m => {
            return {
                name: m.name, family: m.details.family
            }
        }) })
        assert.equal(modelsList.length > 0, true)
    })
    it(`Should fail to get response - bad payload`, async () => {
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
    it(`Should get response from llm`, async () => {
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
        console.log({ str })
        assert.notEqual(str, null)
        assert.equal(str && str.length > 0, true)
    })
    it(`Should get current date with tool`, async () => {
        const payload: UserPromptData = {
            input: "What date is today ?",
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
    it (`Should detect usage of tool 'date'`, async () => {
        const payload: UserPromptData = {
            input: "What time is it ?",
            config: {
                streaming: false,
                model 
            }
        }
        const { data } = await ollamaService.llmCheckTools(payload) || {}
        assert.notEqual(data, undefined)
        assert(data.response)
        const jsonData = JSON.parse(data.response)
        assert.equal(jsonData.tool, "time_tool")
        assert.equal(jsonData.canAnswer, true)
    })
    it(`Should detect usage of tool 'os'`, async () => {
        const payload: UserPromptData = {
            input: "What is my system info ?",
            config: {
                streaming: false,
                model 
            }
        }
        const { data } = await ollamaService.llmCheckTools(payload) || {}
        assert.notEqual(data, undefined)
        assert(data.response)
        const jsonData = JSON.parse(data.response)
        assert.equal(jsonData.tool, "os_info")
        assert.equal(jsonData.canAnswer, true)
    })
    it(`Should get current time in ms with tool`, async () => {
        const payload: UserPromptData = {
            input: "How much time until new years eve ?",
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
    it(`Should use the os tool to get system info`, async () => {
        const payload: UserPromptData = {
            input: "What is my system info ?",
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
        // assert.equal(str && str.includes("GB"), true)
    })
    it(`Should respond according to injected message history`, async () => {
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
    it(`Should alter behaivour if system prompt is sent in the request`, async () => {
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
})