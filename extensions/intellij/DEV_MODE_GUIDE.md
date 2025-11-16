# 开发模式配置指南

## 方法1：通过IDE启动参数（推荐）

在IntelliJ IDEA的VM参数中添加：
```
-Dvoidmuse.dev.mode=true
```

### 设置步骤：
1. 打开IntelliJ IDEA
2. 点击 **Help** → **Edit Custom VM Options**
3. 添加一行：`-Dvoidmuse.dev.mode=true`
4. 重启IDE

## 方法2：通过环境变量

### macOS/Linux:
```bash
launchctl setenv VOIDMUSE_DEV_MODE true
# 或者
export VOIDMUSE_DEV_MODE=true
```

### Windows:
```cmd
set VOIDMUSE_DEV_MODE=true
```

## 方法3：通过启动脚本

使用项目根目录下的 `idea_dev_mode.sh` 脚本：
```bash
./idea_dev_mode.sh
```

## 验证开发模式

重启IDE后，插件应该显示：
- 标题栏显示 "Mode: Development"
- 显示完整的AI聊天界面（输入框、聊天记录、功能按钮）
- 连接到 http://localhost:3002/

如果仍然显示生产模式，请检查IDE日志中的调试信息。