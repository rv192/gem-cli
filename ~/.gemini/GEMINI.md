# 个人 Gemini 配置

## 快速设置
- 使用标准 OPENAI_API_KEY 配置
- 支持环境变量配置默认模型
- 连接到自定义 OpenAI 兼容 API 服务
- 优化性能，减少文件扫描

## 常用命令
```bash
# 快速问答
gen --prompt "你的问题"

# 代码相关问题
gen --prompt "解释这段代码" --all_files

# 调试模式
gen --debug --prompt "你的问题"
```

## 性能优化
- 已配置 .genignore 排除不必要的文件
- 使用环境变量配置 API
- 减少重试次数提高响应速度
