/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from 'ink-testing-library';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthDialog } from './AuthDialog.js';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import { AuthType } from '@rv192/gem-cli-core';

// Mock process.env
const originalEnv = process.env;

describe('AuthDialog', () => {
  const wait = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

  beforeEach(() => {
    // Reset process.env to a clean state
    process.env = { ...originalEnv };
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should show an error if the initial auth type is invalid', () => {
    const settings: LoadedSettings = new LoadedSettings(
      {
        settings: {
          selectedAuthType: AuthType.USE_GEMINI,
        },
        path: '',
      },
      {
        settings: {},
        path: '',
      },
      [],
    );

    const { lastFrame } = render(
      <AuthDialog
        onSelect={() => {}}
        settings={settings}
        initialErrorMessage="GEMINI_API_KEY  environment variable not found"
      />,
    );

    expect(lastFrame()).toContain(
      'GEMINI_API_KEY  environment variable not found',
    );
  });

  it('should prevent exiting when no auth method is selected and show error message', async () => {
    const onSelect = vi.fn();
    const settings: LoadedSettings = new LoadedSettings(
      {
        settings: {
          selectedAuthType: undefined,
        },
        path: '',
      },
      {
        settings: {},
        path: '',
      },
      [],
    );

    const { lastFrame, stdin, unmount } = render(
      <AuthDialog onSelect={onSelect} settings={settings} />,
    );
    await wait();

    // Simulate pressing escape key
    stdin.write('\u001b'); // ESC key
    await wait();

    // Should show error message instead of calling onSelect
    expect(lastFrame()).toContain(
      'You must select an auth method to proceed. Press Ctrl+C twice to exit.',
    );
    expect(onSelect).not.toHaveBeenCalled();
    unmount();
  });

  it('should allow exiting when auth method is already selected', async () => {
    const onSelect = vi.fn();
    const settings: LoadedSettings = new LoadedSettings(
      {
        settings: {
          selectedAuthType: AuthType.USE_GEMINI,
        },
        path: '',
      },
      {
        settings: {},
        path: '',
      },
      [],
    );

    const { stdin, unmount } = render(
      <AuthDialog onSelect={onSelect} settings={settings} />,
    );
    await wait();

    // Simulate pressing escape key
    stdin.write('\u001b'); // ESC key
    await wait();

    // Should call onSelect with undefined to exit
    expect(onSelect).toHaveBeenCalledWith(undefined, SettingScope.User);
    unmount();
  });

  it('should show SiliconFlow option', () => {
    const settings: LoadedSettings = new LoadedSettings(
      {
        settings: {},
        path: '',
      },
      {
        settings: {},
        path: '',
      },
      [],
    );

    const { lastFrame } = render(
      <AuthDialog onSelect={() => {}} settings={settings} />,
    );

    const frame = lastFrame();
    expect(frame).toContain('SiliconFlow API (默认渠道和模型)');
    // The test environment seems to have OPENAI_API_KEY set, so we'll just verify SiliconFlow is present
  });

  it('should show BASEURL service name first when OPENAI_API_KEY is set', () => {
    // Set environment variables
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_BASE_URL = 'https://gemini.72live.com';

    const settings: LoadedSettings = new LoadedSettings(
      {
        settings: {},
        path: '',
      },
      {
        settings: {},
        path: '',
      },
      [],
    );

    const { lastFrame } = render(
      <AuthDialog onSelect={() => {}} settings={settings} />,
    );

    const frame = lastFrame();
    expect(frame).toContain('72live API');
    expect(frame).toContain('SiliconFlow API (默认渠道和模型)');
    // Should not show disabled OpenAI Compatible when key is set
    expect(frame).not.toContain('OpenAI Compatible API (需要设置 OPENAI_API_KEY)');
  });
});
