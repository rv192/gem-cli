# Gen CLI

[![Gemini CLI CI](https://github.com/google-gemini/gemini-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/google-gemini/gemini-cli/actions/workflows/ci.yml)

![Gemini CLI Screenshot](./docs/assets/gemini-screenshot.png)

An enhanced command-line AI workflow tool forked from [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) with improved reliability, model fallback mechanisms, and flexible configuration options.

## 🚀 Key Features

### Enhanced Reliability
- **🔄 Automatic Model Fallback**: When your primary model is unavailable (quota exhausted, streaming errors), automatically switches to backup models
- **⚙️ Flexible Configuration**: Easy-to-use `.env` file configuration with environment variable support
- **🔑 Multiple Auth Methods**: Support for both OpenAI-compatible APIs and Google Gemini API
- **🛡️ Intelligent Error Handling**: Recognizes and handles model exhaustion, rate limits, and streaming failures

### Core Capabilities
- Query and edit large codebases in and beyond Gemini's 1M token context window
- Generate new apps from PDFs or sketches using multimodal capabilities
- Automate operational tasks like querying pull requests or handling complex rebases
- Use tools and MCP servers to connect new capabilities
- Ground your queries with Google Search integration

## 🚀 Quick Start

### Prerequisites
- [Node.js version 18+](https://nodejs.org/en/download) installed

### Installation

**Option 1: Install globally**
```bash
npm install -g @gen-cli/gen-cli
gen
```

**Option 2: Run directly**
```bash
npx https://github.com/rv192/gen-cli
```

### Configuration

Create a `.env` file in your project root or home directory:

```bash
# OpenAI-compatible API (Recommended)
OPENAI_BASE_URL=https://your-api-endpoint.com
OPENAI_API_KEY=your-api-key
DEFAULT_MODEL=gemini-2.5-pro
FALLBACK_MODELS=gemini-2.5-flash,gemini-1.5-pro,gemini-2.0-flash

# Or use Google Gemini API directly
GEMINI_API_KEY=your-gemini-api-key
```

### Authentication Options

#### OpenAI-Compatible APIs (Recommended)
Perfect for using with SiliconFlow, OpenRouter, or other OpenAI-compatible services:

```bash
export OPENAI_BASE_URL="https://api.siliconflow.cn/v1"
export OPENAI_API_KEY="your-api-key"
```

#### Google Gemini API
For direct Google Gemini API access:

1. Generate a key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Set the environment variable:
   ```bash
   export GEMINI_API_KEY="your-api-key"
   ```

## 💡 Usage Examples

Once configured, start the CLI and begin interacting:

<<<<<<< HEAD
```bash
gen
```
=======
3. **Pick a color theme**
4. **Authenticate:** When prompted, sign in with your personal Google account. This will grant you up to 60 model requests per minute and 1,000 model requests per day using Gemini.

You are now ready to use the Gemini CLI!

### Use a Gemini API key:

The Gemini API provides a free tier with [100 requests per day](https://ai.google.dev/gemini-api/docs/rate-limits#free-tier) using Gemini 2.5 Pro, control over which model you use, and access to higher rate limits (with a paid plan):

1. Generate a key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Set it as an environment variable in your terminal. Replace `YOUR_API_KEY` with your generated key.

   ```bash
   export GEMINI_API_KEY="YOUR_API_KEY"
   ```

3. (Optionally) Upgrade your Gemini API project to a paid plan on the API key page (will automatically unlock [Tier 1 rate limits](https://ai.google.dev/gemini-api/docs/rate-limits#tier-1))

### Use a Vertex AI API key:

The Vertex AI provides [free tier](https://cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/overview) using express mode for Gemini 2.5 Pro, control over which model you use, and access to higher rate limits with a billing account:

1. Generate a key from [Google Cloud](https://cloud.google.com/vertex-ai/generative-ai/docs/start/api-keys).
2. Set it as an environment variable in your terminal. Replace `YOUR_API_KEY` with your generated key and set GOOGLE_GENAI_USE_VERTEXAI to true

   ```bash
   export GOOGLE_API_KEY="YOUR_API_KEY"
   export GOOGLE_GENAI_USE_VERTEXAI=true
   ```

3. (Optionally) Add a billing account on your project to get access to [higher usage limits](https://cloud.google.com/vertex-ai/generative-ai/docs/quotas)

For other authentication methods, including Google Workspace accounts, see the [authentication](./docs/cli/authentication.md) guide.

## Examples

Once the CLI is running, you can start interacting with Gemini from your shell.

You can start a project from a new directory:
>>>>>>> 12d231e6408f319a1b3af375b8c2eb8ab3ea5b3b

### Start a New Project
```sh
cd new-project/
gen
> Write me a TODO app in React with Tailwind CSS that can track daily tasks
```

### Work with Existing Code
```sh
cd your-project/
gen
> Analyze this codebase and suggest performance improvements
> Implement a new feature based on GitHub issue #123
```

### Model Fallback in Action
When your primary model (e.g., `gemini-2.5-pro`) is unavailable:
```
Trying model: gemini-2.5-pro
Model gemini-2.5-pro failed: Streaming failed after 3 retries, trying next model...
Trying model: gemini-2.5-flash
✅ Successfully connected with gemini-2.5-flash
```

## ⚙️ Advanced Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DEFAULT_MODEL` | Primary model to use | `gemini-2.5-pro` |
| `FALLBACK_MODELS` | Comma-separated backup models | `gemini-2.5-flash,gemini-1.5-pro` |
| `OPENAI_BASE_URL` | API endpoint URL | `https://api.siliconflow.cn/v1` |
| `OPENAI_API_KEY` | API authentication key | `your-api-key` |
| `GEMINI_API_KEY` | Google Gemini API key | `your-gemini-key` |

### Model Priority
The CLI selects models in this order:
1. Command line `--model` parameter
2. `DEFAULT_MODEL` environment variable
3. `GEMINI_MODEL` environment variable (legacy)
4. Built-in default model

### Fallback Mechanism
When a model fails due to:
- Quota exhaustion
- Rate limiting
- Streaming errors
- Server errors

The CLI automatically tries the next available model from your `FALLBACK_MODELS` list.

## 🎯 Popular Use Cases

### Code Analysis & Development
```text
> Describe the main pieces of this system's architecture
> What security mechanisms are in place?
> Implement a first draft for GitHub issue #123
> Help me migrate this codebase to the latest version of Java
```

### Project Automation
```text
> Make me a slide deck showing git history from the last 7 days
> Create a full-screen web app for displaying GitHub issues
> Generate a project status report from recent commits
```

### File & System Operations
```text
> Convert all images in this directory to PNG format
> Organize my PDF invoices by month of expenditure
> Analyze log files and summarize error patterns
```

### Development Workflows
```text
> Review this pull request and suggest improvements
> Generate unit tests for the selected functions
> Create documentation for this API endpoint
```

## 🔧 Troubleshooting

### Common Issues

**Model not responding:**
- Check your API key is valid
- Verify your API endpoint URL
- Ensure you have sufficient quota/credits

**"Streaming failed" errors:**
- The fallback mechanism should handle this automatically
- Check your `FALLBACK_MODELS` configuration
- Verify backup models are available

**Configuration not loading:**
- Ensure `.env` file is in the correct location
- Check environment variable names are correct
- Restart the CLI after configuration changes

For more help, see the [troubleshooting guide](docs/troubleshooting.md).

## 📚 Documentation

- **[CLI Commands](./docs/cli/commands.md)** - Complete command reference
- **[Authentication Guide](./docs/cli/authentication.md)** - Detailed auth setup
- **[Full Documentation](./docs/index.md)** - Comprehensive guides
- **[Contributing](./CONTRIBUTING.md)** - Development and contribution guide

## 🗑️ Uninstall

```bash
npm uninstall -g @gen-cli/gen-cli
```

For detailed uninstallation instructions, see the [Uninstall Guide](docs/Uninstall.md).

## 📄 Legal

This project is forked from [Google Gemini CLI](https://github.com/google-gemini/gemini-cli). For terms of service and privacy notice, see the [Terms of Service and Privacy Notice](./docs/tos-privacy.md).

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guide](./CONTRIBUTING.md) for details on our development process.
