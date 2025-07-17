# 环境变量加载问题解决方案

## 问题描述

在全局安装 gem-cli 后，如果在包含 `.env` 文件的其他项目目录下执行命令，gem-cli 可能会意外读取该项目的环境变量配置，导致配置混乱。

## 解决方案

重新设计了环境变量加载逻辑，使用命令行参数控制是否允许读取本地环境变量文件，避免了环境变量控制环境变量加载的循环依赖问题。

## 新的加载逻辑

### 默认行为 (推荐)

```bash
gem-cli
```

加载顺序：
1. `~/.gem-cli/.env` - 用户的 gem-cli 专用配置 (最高优先级)
2. `~/.env` - 用户主目录的通用环境变量文件

### 兼容模式

```bash
gem-cli --allow-local-env
```

加载顺序：
1. 当前目录及父目录搜索 (最高优先级)：
   - `当前目录/.gem-cli/.env`
   - `当前目录/.env`
   - 向上级目录重复搜索
2. `~/.gem-cli/.env` - 用户的 gem-cli 专用配置
3. `~/.env` - 用户主目录的通用环境变量文件

## 技术实现

### 修改的文件

1. **packages/cli/src/config/config.ts**
   - 添加 `--allow-local-env` 命令行参数
   - 更新 `CliArgs` 接口

2. **packages/cli/src/config/settings.ts**
   - 重构 `findEnvFile()` 函数，接受 `allowLocalEnv` 参数
   - 更新 `loadEnvironment()` 和 `loadSettings()` 函数

3. **packages/cli/src/gemini.tsx**
   - 在 `main()` 函数中解析 `--allow-local-env` 参数
   - 传递参数给 `loadSettings()`

4. **.env.template**
   - 移除了之前的环境变量配置说明

## 使用指南

### 标准用户 (推荐)

1. 在 `~/.gem-cli/.env` 中配置所有 gem-cli 相关设置
2. 直接运行 `gem-cli`，无论在哪个目录都使用相同配置
3. 避免意外读取其他项目的环境变量

### 高级用户

1. 需要在不同项目中使用不同配置时
2. 使用 `gem-cli --allow-local-env`
3. 在项目目录中创建 `.gem-cli/.env` 或 `.env` 文件

## 优势

1. **避免循环依赖**：不再使用环境变量控制环境变量加载
2. **明确的控制**：通过命令行参数明确表达意图
3. **符合用户期望**：`--allow-local-env` 模式下本地配置优先，符合用户使用该参数的意图
4. **向后兼容**：默认行为更安全，兼容模式保留灵活性
5. **简单易懂**：逻辑清晰，易于理解和维护

## 测试验证

所有测试场景都已通过验证：
- ✅ 只有用户配置时的默认行为
- ✅ 用户配置优先于本地配置
- ✅ 默认模式不读取本地配置
- ✅ 兼容模式正确读取本地配置
- ✅ 子目录中的配置隔离

## 命令行帮助

```bash
gem-cli --help
```

可以看到新增的参数：
```
--allow-local-env    Allow reading .env files from current directory and parent directories
                     [布尔] [默认值: false]
```

这个解决方案彻底解决了环境变量加载的优先级问题，提供了清晰、可控的配置管理机制。
