# VoidMuse 环境配置指南

## 新增功能：环境选择配置

我已经成功为VoidMuse插件增加了环境选择配置功能。现在你可以通过IDEA的设置界面来选择连接哪个环境。

### 配置方法

#### 方法1：通过IDEA设置界面（推荐）
1. 打开 IntelliJ IDEA
2. 进入 `File → Settings` (或 `IntelliJ IDEA → Preferences` on macOS)
3. 找到 `Tools → VoidMuse Settings`
4. 在设置界面中配置以下选项：

**环境模式选项：**
- **auto** (默认)：自动检测，兼容之前的环境变量逻辑
- **development**：开发模式，连接本地开发服务器
- **production**：生产模式，使用静态资源

**自定义URL设置：**
- **开发模式URL**：可自定义开发模式下的连接地址，默认为 `http://localhost:3002/`
- **生产模式URL**：可自定义生产模式下的连接地址，默认为 `http://voidmuse/index.html`

**高级选项：**
- **使用自定义服务器**：启用后将忽略环境模式，直接使用指定的服务器URL
- **自定义服务器URL**：当启用自定义服务器时使用的URL

#### 方法2：通过环境变量（兼容旧版本）
仍然支持之前的环境变量方式：
```bash
export VOIDMUSE_DEV_MODE=true  # 启用开发模式
export VOIDMUSE_DEV_MODE=false # 启用生产模式
```

### 快速开始

#### 选项1：使用开发模式（推荐开发时）
1. 在设置中选择 **development** 模式
2. 启动本地开发服务器：
   ```bash
   ./start_gui_server.sh
   ```
3. 重启IDEA插件

#### 选项2：使用生产模式
1. 在设置中选择 **production** 模式
2. 重启IDEA插件
3. 插件将使用内置的静态资源

#### 选项3：使用自动模式
1. 在设置中选择 **auto** 模式（默认）
2. 设置环境变量：
   ```bash
   source ./enable_dev_mode.sh  # 开发模式
   # 或
   unset VOIDMUSE_DEV_MODE       # 生产模式
   ```
3. 重启IDEA插件

### 新打包文件
最新构建的插件包：`voidmuse-plugin-20251114-2206.tar.gz` (34M)

### 配置界面预览
设置界面包含：
- 环境模式下拉选择
- 自定义URL输入框
- 自定义服务器选项
- 其他插件设置

界面会根据选择自动启用/禁用相关字段，提供直观的用户体验。

### 技术实现
- 在 `<mcsymbol name="ConfigurationSettingsState" filename="ConfigurationSettings.kt" path="/Users/eatin-li/IdeaProjects/voidmuse1/extensions/intellij/src/main/kotlin/com/voidmuse/idea/plugin/setting/ConfigurationSettings.kt" type="class"></mcsymbol> 中新增了环境配置属性
- 更新了 `<mcsymbol name="AdvancedToolWindowFactory" filename="AdvancedToolWindowFactory.java" path="/Users/eatin-li/IdeaProjects/voidmuse1/extensions/intellij/src/main/java/com/voidmuse/idea/plugin/factory/AdvancedToolWindowFactory.java" type="class"></mcsymbol>` 和 `<mcsymbol name="AIToolTabFactory" filename="AIToolTabFactory.java" path="/Users/eatin-li/IdeaProjects/voidmuse1/extensions/intellij/src/main/java/com/voidmuse/idea/plugin/factory/AIToolTabFactory.java" type="class"></mcsymbol>` 的URL加载逻辑
- 创建了新的 `<mcsymbol name="VoidMuseConfigurable" filename="VoidMuseConfigurable.java" path="/Users/eatin-li/IdeaProjects/voidmuse1/extensions/intellij/src/main/java/com/voidmuse/idea/plugin/setting/VoidMuseConfigurable.java" type="class"></mcsymbol>` 配置界面类
- 在 `<mcfile name="plugin.xml" path="/Users/eatin-li/IdeaProjects/voidmuse1/extensions/intellij/src/main/resources/META-INF/plugin.xml"></mcfile>` 中注册了配置界面

现在你可以方便地在IDEA设置中切换不同的环境，无需手动修改环境变量或重新编译插件！