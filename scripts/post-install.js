#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';

// --- Configuration ---
const CONFIG_DIR_NAME = '.gem-cli';
const TEMPLATE_FILE_NAME = '.env.template';
const CONFIG_FILE_NAME = '.env';

const HOME_DIR = os.homedir();
const CONFIG_DIR = path.join(HOME_DIR, CONFIG_DIR_NAME);
const TARGET_ENV_PATH = path.join(CONFIG_DIR, CONFIG_FILE_NAME);
// The script runs from the project root, so the source is right here.
const SOURCE_TEMPLATE_PATH = path.resolve(process.cwd(), TEMPLATE_FILE_NAME);

// ANSI colors for better output
const colors = {
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  cyan: '\u001b[36m',
  reset: '\u001b[39m',
};

function log(message) {
  console.log(message);
}

function main() {
  log(`\n${colors.cyan}gem-cli post-install setup...${colors.reset}`);

  // 1. Create the configuration directory if it doesn't exist
  if (!fs.existsSync(CONFIG_DIR)) {
    try {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
      log(`- Created configuration directory at: ${CONFIG_DIR}`);
    } catch (error) {
      log(`${colors.yellow}Warning: Could not create configuration directory: ${error.message}${colors.reset}`);
      return; // Exit if we can't create the directory
    }
  } else {
    log(`- Configuration directory already exists: ${CONFIG_DIR}`);
  }

  // 2. Check if the target .env file already exists
  if (fs.existsSync(TARGET_ENV_PATH)) {
    log(`- ${colors.yellow}Configuration file already exists at:${colors.reset}`);
    log(`  ${TARGET_ENV_PATH}`);
    log(`- Skipping creation to avoid overwriting your settings.`);
  } else {
    // 3. If not, copy the template file
    try {
      if (!fs.existsSync(SOURCE_TEMPLATE_PATH)) {
          log(`\n${colors.yellow}Warning: ${TEMPLATE_FILE_NAME} not found in the project root. Cannot create a default .env file.${colors.reset}`);
          log(`${colors.yellow}Please create the configuration file manually at:${colors.reset} ${TARGET_ENV_PATH}`);
          return;
      }
      
      fs.copyFileSync(SOURCE_TEMPLATE_PATH, TARGET_ENV_PATH);
      log(`\n${colors.green}✅ Success! A new configuration file has been created.${colors.reset}`);
      log(`- Please edit the file to add your API keys and settings:`);
      log(`  ${colors.cyan}${TARGET_ENV_PATH}${colors.reset}`);
    } catch (error) {
      log(`\n${colors.yellow}Warning: Failed to copy .env.template to ${TARGET_ENV_PATH}.${colors.reset}`);
      log(`- Error: ${error.message}`);
    }
  }
  log(`\n${colors.cyan}Setup complete. Enjoy using gem-cli!${colors.reset}\n`);
}

main();
