#!/usr/bin/env node

/**
 * Script to set MCP configuration in IntelliJ plugin storage
 * This directly modifies the plugin's persistent storage
 */

const fs = require('fs');
const path = require('path');

// Configuration to set
const mcpConfig = {
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
};

// Convert to the format expected by the plugin
const configArray = [
  {
    key: Date.now().toString(),
    name: "filesystem",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/Users/eatin-li/Desktop", "/Users/eatin-li/IdeaProjects/voidmuse1"],
    url: "",
    headers: {},
    connected: false,
    enabled: true,
    tools: []
  }
];

const configJson = JSON.stringify(configArray);

console.log('MCP Configuration to set:');
console.log(configJson);
console.log('\nTo set this configuration in the IntelliJ plugin:');
console.log('1. Open IntelliJ IDEA with the VoidMuse plugin installed');
console.log('2. Open the JavaScript Console in the VoidMuse tool window');
console.log('3. Run the following command:');
console.log('');
console.log(`window.callJava({"method":"setPersistentState","args":{"global:mcps":${JSON.stringify(configJson)}}})`);
console.log('');
console.log('This will save the configuration to the plugin storage and reload the MCP service.');