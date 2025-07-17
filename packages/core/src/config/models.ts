/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Support environment variable override for default models
export const DEFAULT_GEMINI_MODEL = process.env.DEFAULT_MODEL || process.env.OPENAI_MODEL || 'gemini-1.5-pro';
export const DEFAULT_GEMINI_FLASH_MODEL = process.env.DEFAULT_MODEL || process.env.OPENAI_MODEL || 'gemini-1.5-flash';
export const DEFAULT_GEMINI_EMBEDDING_MODEL = process.env.DEFAULT_EMBEDDING_MODEL || 'Qwen/Qwen3-Embedding-8B';
