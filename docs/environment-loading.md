# 环境变量加载机制

## 问题背景

在全局安装 gem-cli 后，如果在包含 `.env` 文件的其他项目目录下执行命令，gem-cli 可能会意外读取该项目的环境变量配置，导致配置混乱。

## 解决方案

我们重新设计了环境变量加载的优先级，确保用户的 gem-cli 专用配置始终优先。

## 新的加载顺序

### 默认行为 (推荐)

默认情况下，gem-cli 只读取用户配置：

1. **`~/.gem-cli/.env`** - 用户的 gem-cli 专用配置 (最高优先级)
2. **`~/.env`** - 用户主目录的通用环境变量文件

### 兼容模式

使用 `--allow-local-env` 命令行参数时：

1. **当前目录及父目录搜索** (最高优先级)：
   - `当前目录/.gem-cli/.env`
   - `当前目录/.env`
   - 向上级目录重复搜索
2. **`~/.gem-cli/.env`** - 用户的 gem-cli 专用配置
3. **`~/.env`** - 用户主目录的通用环境变量文件

## 使用方法

### 默认使用 (推荐)

直接运行 gem-cli，只使用用户配置：

```bash
gem-cli
```

在 `~/.gem-cli/.env` 中设置您的配置：

```bash
# 您的 gem-cli 配置
OPENAI_BASE_URL=https://your-api-endpoint.com
OPENAI_API_KEY=your-api-key
DEFAULT_MODEL=your-preferred-model
```

### 兼容模式

如果您需要在特定项目中使用不同的配置，可以使用 `--allow-local-env` 参数：

```bash
gem-cli --allow-local-env
```

这样 gem-cli 会搜索当前目录及父目录中的 `.env` 文件。

## 使用场景

### 场景 1: 标准用户 (推荐)

- 在 `~/.gem-cli/.env` 中配置所有 gem-cli 相关设置
- 无论在哪个目录执行 gem-cli，都使用相同的配置
- 避免意外读取其他项目的环境变量

### 场景 2: 高级用户

- 需要在不同项目中使用不同的 API 配置
- 设置 `GEM_CLI_ALLOW_LOCAL_ENV=true`
- 在项目目录中创建 `.gem-cli/.env` 或 `.env` 文件

## 迁移指南

### 从旧版本升级

1. **检查现有配置**：
   ```bash
   ls -la ~/.gem-cli/.env
   ```

2. **如果文件不存在**，复制模板：
   ```bash
   cp ~/.gem-cli/.env.template ~/.gem-cli/.env
   ```

3. **编辑配置文件**：
   ```bash
   nano ~/.gem-cli/.env
   ```

4. **验证配置**：
   ```bash
   gem-cli --version  # 确保能正常启动
   ```

### 处理冲突

如果您在其他项目目录下遇到配置冲突：

1. **推荐解决方案**：
   默认情况下不会读取本地 `.env` 文件，所以不会有冲突

2. **如果使用了 `--allow-local-env` 参数**：
   - 删除/重命名冲突的 `.env` 文件
   - 或者不使用 `--allow-local-env` 参数

## 故障排除

### 检查当前加载的环境变量

```bash
# 查看 gem-cli 实际使用的配置
gem-cli --debug
```

### 常见问题

1. **Q: gem-cli 仍然读取项目的 .env 文件**
   - A: 检查是否使用了 `--allow-local-env` 参数，如果不需要请移除该参数

2. **Q: 配置更改后没有生效**
   - A: 重新启动终端或重新执行命令

3. **Q: 找不到 ~/.gem-cli/.env 文件**
   - A: 运行 `gem-cli` 一次，它会自动创建配置文件

## 技术细节

### 实现位置

- 文件：`packages/cli/src/config/settings.ts`
- 函数：`findEnvFile()`
- 调用：`loadEnvironment()`

### 命令行参数

- `--allow-local-env`: 允许读取当前目录及父目录中的 .env 文件
- 默认值：`false` (不使用该参数时)
- 使用方法：`gem-cli --allow-local-env`

### 测试

运行测试脚本验证行为：

```bash
node test-env-loading.js
```
