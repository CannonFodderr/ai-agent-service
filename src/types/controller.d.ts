type ControllerName = 'health' | 'llm'
type ControllersList = { name: ControllerName, init: Function, config: ControllerConfig }[]


type ControllerConfig = {
    baseApi: string,
    
}