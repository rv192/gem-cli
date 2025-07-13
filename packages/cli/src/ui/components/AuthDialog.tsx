/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { Colors } from '../colors.js';
import { RadioButtonSelect } from './shared/RadioButtonSelect.js';
import { LoadedSettings, SettingScope } from '../../config/settings.js';
import { AuthType } from '@rv192/gem-cli-core';
import { validateAuthMethod } from '../../config/auth.js';
import { loadEnvironment } from '../../config/settings.js';

interface AuthDialogProps {
  onSelect: (authMethod: AuthType | undefined, scope: SettingScope) => void;
  settings: LoadedSettings;
  initialErrorMessage?: string | null;
}

// Helper function to extract service name from URL
function getServiceNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Extract the main domain name
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      // For domains like "api.openai.com", return "openai"
      // For domains like "gemini.72live.com", return "72live"
      const mainPart = parts[parts.length - 2];
      return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
    }
    return hostname;
  } catch {
    return 'Custom API';
  }
}

export function AuthDialog({
  onSelect,
  settings,
  initialErrorMessage,
}: AuthDialogProps): React.JSX.Element {
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialErrorMessage || null,
  );

  // Load environment variables
  loadEnvironment();

  // Build dynamic items list
  const items = useMemo(() => {
    const itemsList: Array<{ label: string; value: AuthType; disabled?: boolean }> = [];

    // Check if OPENAI_API_KEY is configured
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    const openAIBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com';
    const serviceName = getServiceNameFromUrl(openAIBaseUrl);



    // OpenAI渠道作为第一行
    if (hasOpenAIKey) {
      // 如果配置了KEY，则显示BaseURL名
      itemsList.push({
        label: `${serviceName} API`,
        value: AuthType.USE_OPENAI_COMPATIBLE,
      });
    } else {
      // 否则显示OpenAI Comp...API(待配置)
      itemsList.push({
        label: 'OpenAI Compatible API (待配置)',
        value: AuthType.USE_OPENAI_COMPATIBLE,
        disabled: true,
      });
    }

    // SiliconFlow作为第二行
    itemsList.push({
      label: 'SiliconFlow API (默认渠道和模型)',
      value: AuthType.USE_SILICONFLOW,
    });



    return itemsList;
  }, [process.env.OPENAI_API_KEY, process.env.OPENAI_BASE_URL]);

  // Always default to the first item since we arrange items by preference
  // Don't use saved selectedAuthType to avoid confusion
  let initialAuthIndex = 0;



  const handleAuthSelect = (authMethod: AuthType) => {
    // Find the selected item to check if it's disabled
    const selectedItem = items.find(item => item.value === authMethod);
    if (selectedItem?.disabled) {
      setErrorMessage('此选项需要先配置相应的环境变量');
      return;
    }

    const error = validateAuthMethod(authMethod);
    if (error) {
      setErrorMessage(error);
    } else {
      setErrorMessage(null);
      onSelect(authMethod, SettingScope.User);
    }
  };

  useInput((_input, key) => {
    if (key.escape) {
      if (settings.merged.selectedAuthType === undefined) {
        // Prevent exiting if no auth method is set
        setErrorMessage(
          'You must select an auth method to proceed. Press Ctrl+C twice to exit.',
        );
        return;
      }
      onSelect(undefined, SettingScope.User);
    }
  });

  return (
    <Box
      borderStyle="round"
      borderColor={Colors.Gray}
      flexDirection="column"
      padding={1}
      width="100%"
    >
      <Text bold>Select Auth Method</Text>
      <RadioButtonSelect
        items={items}
        initialIndex={initialAuthIndex}
        onSelect={handleAuthSelect}
        isFocused={true}
      />
      {errorMessage && (
        <Box marginTop={1}>
          <Text color={Colors.AccentRed}>{errorMessage}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text color={Colors.Gray}>(Use Enter to select)</Text>
      </Box>
      <Box marginTop={1}>
        <Text>Terms of Services and Privacy Notice</Text>
      </Box>
      <Box marginTop={1}>
        <Text color={Colors.AccentBlue}>
          https://docs.siliconflow.cn/cn/legals/terms-of-service
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color={Colors.AccentBlue}>
          https://docs.siliconflow.cn/cn/legals/privacy-policy
        </Text>
      </Box>
    </Box>
  );
}
