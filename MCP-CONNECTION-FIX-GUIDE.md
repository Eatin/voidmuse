# Fix MCP Connection Failed in IntelliJ Plugin

## Problem Summary
When you add MCP configuration through the browser UI (VoidMuse web interface), it only saves to browser localStorage and **does NOT sync with the IntelliJ plugin**. The IntelliJ plugin reads MCP configuration from its own persistent storage (`PluginDataPersistent`) with the key `"global:mcps"`).

## Root Cause
- **Browser UI** and **IntelliJ Plugin** have separate storage systems
- Browser UI saves to `localStorage` via `StorageService.ts`
- IntelliJ Plugin reads from `PluginDataPersistent.getState().getData("global:mcps")`
- No automatic sync between them

## Solution

### Method 1: Use JavaScript Console in IntelliJ Plugin (Recommended)

1. **Open IntelliJ IDEA** with VoidMuse plugin installed
2. **Open the VoidMuse tool window** (usually on the right side)
3. **Open JavaScript Console** in the VoidMuse tool window
4. **Run this command** to set the MCP configuration:

```javascript
window.callJava({"method":"setPersistentState","args":{"global:mcps":"[{"key":"1763139332973","name":"filesystem","command":"npx","args":["-y","@modelcontextprotocol/server-filesystem","/Users/eatin-li/Desktop","/Users/eatin-li/IdeaProjects/voidmuse1"],"url":"","headers":{},"connected":false,"enabled":true,"tools":[]}]"}})
```

### Method 2: Create Custom Configuration UI

The IntelliJ plugin currently lacks MCP configuration UI. You can add it by modifying `VoidMuseConfigurable.java` to include MCP settings.

### Method 3: Use the Fixed Configuration File

Use the corrected configuration that replaces the invalid path:

**File**: `/Users/eatin-li/IdeaProjects/voidmuse1/mcp-config-filesystem-fixed.json`
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y", 
        "@modelcontextprotocol/server-filesystem", 
        "/Users/eatin-li/Desktop",
        "/Users/eatin-li/IdeaProjects/voidmuse1"
      ]
    }
  }
}
```

## Verification

After setting the configuration, you can verify it works by:

1. **Check plugin logs** - Look for MCP connection messages
2. **Test the connection** - The plugin should automatically test connections when enabled
3. **Use the test script**:
   ```bash
   cd /Users/eatin-li/IdeaProjects/voidmuse1
   node test-mcp-connection.js
   ```

## Technical Details

- The IntelliJ plugin loads MCP config from `PluginDataPersistent.getState().getData("global:mcps")`
- When `setPersistentState` is called with `"global:mcps"` key, it automatically calls `McpService.getInstance().reloadConfig()`
- The MCP service then initializes `MCPClient` instances for each configured server
- Connection testing happens automatically when MCP servers are enabled

## Future Improvement

Consider adding MCP configuration UI to the IntelliJ plugin settings panel (`VoidMuseConfigurable.java`) to make this process more user-friendly.