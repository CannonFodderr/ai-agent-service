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
    it(`Should get response from llm`, async () => {
        const payload: UserPromptData = {
            messages: [],
            system: "",
            input: "Hello from user",
            config: {
                streaming: false,
                model 
            }
        }

        const { data } = await ollamaService.llmGenerate(payload) || {}
        assert.notEqual(data, undefined)
        console.log({ isStream: isStream(data) })
        assert.equal(isStream(data), true)
        const str = await bufferStreamToString(data)
        console.log({ str })
        assert.notEqual(str, null)
    })
})