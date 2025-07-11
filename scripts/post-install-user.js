#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const targetDir = path.join(os.homedir(), '.gem-cli');
const sourceTemplatePath = path.join(__dirname, '..', '.env.template');
const targetTemplatePath = path.join(targetDir, '.env.template');

try {
  // 如果目标目录不存在，则创建它
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 只有当模板文件不存在时，才进行复制，避免覆盖用户自己的设置
  if (!fs.existsSync(targetTemplatePath)) {
    fs.copyFileSync(sourceTemplatePath, targetTemplatePath);
    console.log('A .env.template file has been created in ~/.gem-cli/');
    console.log('You can copy it to .env and add your configurations.');
  }
} catch (error) {
  // 在 postinstall 脚本中，最好不要因为失败而中断整个安装过程
  // 只在控制台打印错误即可
  console.error('Failed to copy .env.template:', error);
}
