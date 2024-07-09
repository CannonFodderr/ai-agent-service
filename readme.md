# AI Agent

This is a repository for an AI agent that uses language models for various tasks.

## Description

The AI agent is designed to provide a range of services using language models. It can generate text, answer questions, and perform other tasks based on the input it receives.

## Features

- Generate text using language models
- Answer questions based on the input
- Perform other tasks based on the input

## Getting Started

To get started with the AI agent, follow these steps:

1. Clone the repository
2. Install the required dependencies
3. Configure the environment variables
4. Run the application

### Prerequisites

- Node.js (version 14.17.0 or higher)
- npm (version 6.14.15 or higher)

### Installation
#### Docker
```
docker build -t ai-server .
```
```
docker run --name ai-server --env OLLAMA_HOST=http://host.docker.internal --env OLLAMA_PORT=11434 --env SERVER_HTTP_PORT=9000 -p9000:9000 ai-server
```
#### Manual
1. Clone the repository:

   ```shell
   git clone https://github.com/CannonFodderr/ai-agent.git
2. Install the required dependencies:
    ```shell
    cd ai-agent
    npm install // (or yarn)
3. Configure the environment variables:
    Create a .env file in the root directory of the project.
    Set the required environment variables according to your configuration.

### Configuration
create a .env file containing these keys

    ENV="development"

    # SERVER CONFIG
    SERVER_HTTP_PORT=9000 // will default to 9000

    #LLM CONFIG
    OLLAMA_HOST="http://localhost" // or your own host for Ollama
    OLLAMA_PORT=11434 

## API Endpoints

* /api/v1/llm/generate: Generate text using language models

### Request Body

The request body should contain the following fields:

* input: The input text or question for the AI agent to process
* system: (optional) The system information for the AI agent to use
* messages: (optional) list of history messages
    ```json
    {
        role: "user", // user | assistant
        message: "Your message here..."
    }
* config: (optional)
    ```json
    {
        streaming: boolean // service can either get the stream back from LLM or parse into JSON format
    }
### Response
The response will contain the generated text or answer from the AI agent.

**Response can be a stream or JSON**

    {
        response: string // llm response
    }


### Contributing
Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

### License
This project is licensed under the MIT License. See the LICENSE file for more information.