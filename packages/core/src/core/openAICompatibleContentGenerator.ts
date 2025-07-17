import {
  CountTokensResponse,
  GenerateContentResponse,
  GenerateContentParameters,
  CountTokensParameters,
  EmbedContentResponse,
  EmbedContentParameters,
  Content,
  Part,
  ContentListUnion,
  PartUnion,
} from '@google/genai';
import OpenAI from 'openai';
import { ContentGenerator, AuthType } from './contentGenerator.js';
import { jsonrepair } from 'jsonrepair';
import { reportError } from '../utils/errorReporting.js';

/**
 * Helper function to convert ContentListUnion to Content[]
 */
function toContents(contents: ContentListUnion): Content[] {
  if (Array.isArray(contents)) {
    // it's a Content[] or a PartUnion[]
    return contents.map(toContent);
  }
  // it's a Content or a PartUnion
  return [toContent(contents)];
}

function toContent(content: Content | PartUnion): Content {
  if (Array.isArray(content)) {
    // This shouldn't happen in our context, but handle it
    throw new Error('Array content not supported in this context');
  }
  if (typeof content === 'string') {
    // it's a string
    return {
      role: 'user',
      parts: [{ text: content }],
    };
  }
  if (typeof content === 'object' && content !== null && 'parts' in content) {
    // it's a Content
    return content;
  }
  // it's a Part
  return {
    role: 'user',
    parts: [content as Part],
  };
}

export class OpenAICompatibleContentGenerator implements ContentGenerator {
  private openai: OpenAI;
  private fallbackModels: string[];
  private defaultModel: string; // 存储确定的默认模型

  constructor(authType?: AuthType) {
    let apiKey: string;
    let baseUrl: string;
    let defaultModel: string;
    let fallbackModels: string[];

    // 根据认证类型决定配置
    if (authType === AuthType.USE_SILICONFLOW) {
      // 强制使用 SiliconFlow 配置
      apiKey = process.env.SILICONFLOW_API_KEY || 'sk-ybhnlsuxeobtrbijnowwrvloegnguaihmjvervuhqqzrhzqm';
      baseUrl = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn';
      defaultModel = process.env.SILICONFLOW_DEFAULT_MODEL || 'THUDM/GLM-4-9B-0414';
      fallbackModels = []; // SiliconFlow 不使用回退模型

    } else if (authType === AuthType.USE_OPENAI_COMPATIBLE) {
      // 强制使用 OpenAI 兼容配置
      apiKey = process.env.OPENAI_API_KEY || '';
      baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com';
      defaultModel = process.env.DEFAULT_MODEL || 'gpt-4o';
      const fallbackModelsEnv = process.env.FALLBACK_MODELS;
      fallbackModels = fallbackModelsEnv ? fallbackModelsEnv.split(',').map(m => m.trim()) : [
        'gpt-4-turbo',
        'gpt-3.5-turbo'
      ];
      console.log('使用 OpenAI 兼容 API 配置。');
    } else {
      // 如果没有指定认证类型，抛出错误
      throw new Error(`未知的认证类型: ${authType}。请指定有效的认证类型。`);
    }

    // 确保 baseURL 以 /v1 结尾，以兼容 OpenAI 客户端
    const normalizedBaseUrl = baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`;
    this.openai = new OpenAI({
      apiKey,
      baseURL: normalizedBaseUrl,
    });

    this.fallbackModels = fallbackModels;
    this.defaultModel = defaultModel; // 存储确定的默认模型


  }

  private async tryWithFallbackModels<T>(
    requestedModel: string | undefined, // 用户请求的模型，可能为 undefined
    operation: (model: string) => Promise<T>
  ): Promise<T> {
    // 确定本次操作要使用的初始模型
    const initialModel = requestedModel || this.defaultModel;
    // 尝试的模型列表：首先是初始模型，然后是构造函数中确定的回退模型列表
    const modelsToTry = [initialModel, ...this.fallbackModels];
    let lastError: Error | null = null;



    for (const model of modelsToTry) {
      try {
        console.log(`尝试模型: ${model}`);
        return await operation(model);
      } catch (error) {
        lastError = error as Error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorString = JSON.stringify(error);

        console.log(`模型 ${model} 错误: ${errorMessage}`);
        console.log(`错误详情: ${errorString}`);

        // 检查是否是模型耗尽或流式传输错误，并且只有在配置了回退模型时才尝试回退
        if (this.fallbackModels.length > 0 && (
            errorMessage.includes('Streaming failed') ||
            errorMessage.includes('rate limit') ||
            errorMessage.includes('quota') ||
            errorMessage.includes('exhausted') ||
            errorMessage.includes('Internal server error') ||
            errorMessage.includes('API Error') ||
            errorMessage.includes('Request timed out') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('Connection error') ||
            errorMessage.includes('ECONNREFUSED') ||
            errorMessage.includes('ENOTFOUND') ||
            errorString.includes('Streaming failed'))) {
          console.log(`模型 ${model} 失败: ${errorMessage}, 尝试下一个模型...`);
          continue;
        }

        // 对于其他错误，或者如果没有配置回退模型，则不尝试回退模型
        console.log(`模型 ${model} 失败，原因不可重试或未配置回退: ${errorMessage}`);
        throw error;
      }
    }

    // 如果所有模型都失败了，抛出最后一个错误
    throw lastError || new Error('所有模型都失败了');
  }

  private convertToOpenAIMessages(
    contents: Content[],
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    for (const content of contents) {
      const role =
        content.role === 'model'
          ? 'assistant'
          : (content.role as 'system' | 'user');
      const parts = content.parts || [];
      const textParts = parts.filter(
        (part: Part): part is { text: string } =>
          typeof part === 'object' && part !== null && 'text' in part,
      );
      if (textParts.length > 0) {
        const combinedText = textParts
          .map((part: { text: string }) => {
            // 确保文本正确编码，避免 ByteString 转换错误
            try {
              // 使用 JSON.stringify 和 JSON.parse 来确保 Unicode 字符正确处理
              return JSON.parse(JSON.stringify(part.text));
            } catch {
              // 如果 JSON 处理失败，直接返回原文本
              return part.text;
            }
          })
          .join('\n');
        messages.push({
          role,
          content: combinedText,
        });
      }

      const functionResponseParts = parts.filter(
        (
          part: Part,
        ): part is {
          functionResponse: {
            id: string;
            name: string;
            response: { output?: string; error?: string };
          };
        } =>
          typeof part === 'object' &&
          part !== null &&
          'functionResponse' in part &&
          part.functionResponse !== undefined &&
          typeof part.functionResponse.id === 'string' &&
          typeof part.functionResponse.name === 'string' &&
          part.functionResponse.response !== undefined &&
          (typeof part.functionResponse.response.output === 'string' ||
            typeof part.functionResponse.response.error === 'string'),
      );

      if (functionResponseParts.length > 0) {
        const combinedText = functionResponseParts
          .map((part) =>
            part.functionResponse.response.error
              ? `Error: ${part.functionResponse.response.error}`
              : part.functionResponse.response.output,
          )
          .join('\n');
        const tool_call_id = functionResponseParts[0].functionResponse.id;
        messages.push({
          tool_call_id,
          role: 'tool',
          content: combinedText,
        });
      }
      const functionCallParts = parts.filter(
        (
          part: Part,
        ): part is {
          functionCall: { name: string; args: Record<string, unknown> };
        } =>
          typeof part === 'object' &&
          part !== null &&
          'functionCall' in part &&
          part.functionCall !== undefined &&
          typeof part.functionCall.name === 'string' &&
          part.functionCall.args !== undefined,
      );

      if (functionCallParts.length > 0) {
        if (role === 'user') {
          throw new Error('Function calls cannot come from user role');
        }
        messages.push({
          role: 'assistant', // Force assistant role for tool calls
          content: null,
          tool_calls: functionCallParts.map((part) => ({
            id: `call_${Math.random().toString(36).slice(2)}`,
            type: 'function',
            function: {
              name: part.functionCall.name,
              arguments: JSON.stringify(part.functionCall.args),
            },
          })),
        });
      }

      if (
        textParts.length === 0 &&
        functionCallParts.length === 0 &&
        functionResponseParts.length === 0
      ) {
        throw new Error(
          `Content parts not processed: ${JSON.stringify(content, null, 2)}`,
        );
      }
    }

    return messages;
  }

  private convertToGeminiResponse(
    response: OpenAI.Chat.Completions.ChatCompletion,
  ): GenerateContentResponse {
    const choice = response.choices[0];
    if (!choice || (!choice.message.content && !choice.message.tool_calls)) {
      throw new Error('No valid choices in OpenAI response');
    }

    const geminiResponse = new GenerateContentResponse();

    if (choice.message.content) {
      geminiResponse.candidates = [
        {
          content: {
            parts: [{ text: choice.message.content }],
            role: 'model',
          },
          index: 0,
          safetyRatings: [],
        },
      ];
    } else if (choice.message.tool_calls) {
      geminiResponse.candidates = [
        {
          content: {
            parts: choice.message.tool_calls.map((toolCall) => ({
              functionCall: {
                name: toolCall.function.name,
                args: JSON.parse(jsonrepair(toolCall.function.arguments)),
              },
            })),
            role: 'model',
          },
          index: 0,
          safetyRatings: [],
        },
      ];
    }

    geminiResponse.usageMetadata = {
      promptTokenCount: response.usage?.prompt_tokens || 0,
      candidatesTokenCount: response.usage?.completion_tokens || 0,
      totalTokenCount: response.usage?.total_tokens || 0,
    };

    return geminiResponse;
  }
  async generateContentStream(
    request: GenerateContentParameters,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const contentsArray = toContents(request.contents);
    const messages = this.convertToOpenAIMessages(contentsArray);
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] | undefined =
      request.config?.tools?.flatMap((tool) => {
        if ('functionDeclarations' in tool) {
          return (
            tool.functionDeclarations?.map((func) => {
              if (!func.name) {
                throw new Error('Function declaration must have a name');
              }
              return {
                type: 'function',
                function: {
                  name: func.name,
                  description: func.description || '',
                  parameters:
                    (func.parameters as Record<string, unknown>) || {},
                },
              };
            }) || []
          );
        }
        return [];
      });

    // 使用回退机制进行流式传输
    const stream = await this.tryWithFallbackModels(request.model, async (model) => {
      const params = {
        model,
        messages,
        stream: true,
        temperature: request.config?.temperature,
        max_tokens: request.config?.maxOutputTokens,
        top_p: request.config?.topP,
        tools,
      };

      return await this.openai.chat.completions.create({
        ...params,
        stream: true,
      });
    });

    const toolCallMap = new Map<
      number,
      {
        name: string;
        arguments: string;
      }
    >();
    const generator =
      async function* (): AsyncGenerator<GenerateContentResponse> {
        for await (const chunk of stream) {
          const choice = chunk.choices[0];
          if (choice?.delta?.content) {
            const geminiResponse = new GenerateContentResponse();
            geminiResponse.candidates = [
              {
                content: {
                  parts: [{ text: choice.delta.content }],
                  role: 'model',
                },
                index: 0,
                safetyRatings: [],
              },
            ];
            yield geminiResponse;
          }
          // 处理工具调用增量
          if (choice?.delta?.tool_calls) {
            for (const toolCall of choice.delta.tool_calls) {
              const idx = toolCall.index;
              const current = toolCallMap.get(idx) || {
                name: '',
                arguments: '',
              };

              // 如果提供了名称，则更新名称
              if (toolCall.function?.name) {
                current.name = toolCall.function.name;
              }

              // 累积参数
              if (toolCall.function?.arguments) {
                current.arguments += toolCall.function.arguments;
              }

              toolCallMap.set(idx, current);
            }
          }

          const tryRepair = (str: string) => {
            try {
              return JSON.parse(jsonrepair(str));
            } catch (error) {
              reportError(
                error,
                '与 OpenAI 兼容 API 通信时出错',
                { str },
                'OpenAICompatible.parseToolCallArguments',
              );
              throw error;
            }
          };
          // 在完成时刷新已完成的工具调用
          if (choice.finish_reason === 'tool_calls' && toolCallMap.size > 0) {
            const geminiResponse = new GenerateContentResponse();
            geminiResponse.candidates = [
              {
                content: {
                  parts: Array.from(toolCallMap.entries()).map(
                    ([_index, toolCall]) => ({
                      functionCall: {
                        name: toolCall.name,
                        args: toolCall.arguments
                          ? tryRepair(toolCall.arguments)
                          : {},
                      },
                    }),
                  ),
                  role: 'model',
                },
                index: 0,
                safetyRatings: [],
              },
            ];
            yield geminiResponse;
            toolCallMap.clear(); // 为下一次工具调用重置
          }

          if (choice?.finish_reason) {
            const geminiResponse = new GenerateContentResponse();
            geminiResponse.candidates = [
              {
                content: {
                  parts: [],
                  role: 'model',
                },
                index: 0,
                safetyRatings: [],
              },
            ];
            yield geminiResponse;
            return;
          }
        }
      };

    return generator();
  }

  async generateContent(
    request: GenerateContentParameters,
  ): Promise<GenerateContentResponse> {
    const contentsArray = toContents(request.contents);
    const messages = this.convertToOpenAIMessages(contentsArray);

    const tools = undefined;

    // 使用回退机制进行非流式请求
    const completion = await this.tryWithFallbackModels(request.model, async (model) => {
      return await this.openai.chat.completions.create({
        model,
        messages,
        stream: false,
        temperature: request.config?.temperature,
        max_tokens: request.config?.maxOutputTokens,
        top_p: request.config?.topP,
        tools,
      });
    });

    return this.convertToGeminiResponse(completion);
  }

  async countTokens(
    request: CountTokensParameters,
  ): Promise<CountTokensResponse> {
    const contentsArray = toContents(request.contents);

    // 我们将根据文本长度进行估算（粗略近似：每 4 个字符一个 token）
    const messages = this.convertToOpenAIMessages(contentsArray);
    const totalText = messages.map((m) => m.content).join(' ');
    const estimatedTokens = Math.ceil(totalText.length / 4);

    return {
      totalTokens: estimatedTokens,
    };
  }

  async embedContent(
    _request: EmbedContentParameters,
  ): Promise<EmbedContentResponse> {
    throw new Error('TODO: add support for embedding content');
  }
}