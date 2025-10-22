const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Logging utility
function log(message, color = 'white') {
    const colors = {
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        reset: '\x1b[0m'
    };
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Execute command with error handling
function execCommand(command, cwd = process.cwd()) {
    log(`Executing: ${command}`, 'cyan');
    try {
        execSync(command, { cwd, stdio: 'inherit', shell: true });
        return true;
    } catch (error) {
        log(`Error executing command: ${command}`, 'red');
        return false;
    }
}

// Check and install dependencies
function checkAndInstallDependencies() {
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    const packageJsonPath = path.join(__dirname, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        log('No package.json found in VSCode extension', 'yellow');
        return true;
    }
    
    if (!fs.existsSync(nodeModulesPath)) {
        log('Installing dependencies for VSCode extension...', 'yellow');
        return execCommand('npm install', __dirname);
    }
    
    log('Dependencies already installed for VSCode extension', 'green');
    return true;
}

// Start VSCode extension development
function startVSCodeDev() {
    log('Starting VSCode Extension Development Environment', 'magenta');
    
    // Check and install dependencies first
    if (!checkAndInstallDependencies()) {
        log('Failed to install VSCode extension dependencies', 'red');
        return null;
    }
    
    log('VSCode extension will auto-compile on changes', 'cyan');
    
    const child = spawn('npm', ['run', 'watch'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });
    
    child.on('error', (error) => {
        log(`Failed to start VSCode extension watch: ${error.message}`, 'red');
    });
    
    child.on('close', (code) => {
        if (code !== 0) {
            log(`VSCode extension watch process exited with code ${code}`, 'red');
        }
    });
    
    return child;
}

// Build GUI and copy to VSCode extension
function buildAndCopyGui() {
    const guiPath = path.join(__dirname, '../../gui');
    const vscodeGuiPath = path.join(__dirname, 'gui');
    
    log('Building GUI project...', 'cyan');
    
    // Check if GUI directory exists
    if (!fs.existsSync(guiPath)) {
        log('GUI directory not found at ../../gui', 'red');
        return false;
    }
    
    // Check and install GUI dependencies
    const guiNodeModules = path.join(guiPath, 'node_modules');
    if (!fs.existsSync(guiNodeModules)) {
        log('Installing GUI dependencies...', 'yellow');
        if (!execCommand('npm install', guiPath)) {
            log('Failed to install GUI dependencies', 'red');
            return false;
        }
    } else {
        log('GUI dependencies already installed', 'green');
    }
    
    // Build GUI project
    if (!execCommand('npm run build:test', guiPath)) {
        log('Failed to build GUI project', 'red');
        return false;
    }
    
    // Remove existing gui directory in VSCode extension
    if (fs.existsSync(vscodeGuiPath)) {
        log('Removing existing GUI assets...', 'yellow');
        fs.rmSync(vscodeGuiPath, { recursive: true, force: true });
    }
    
    // Copy GUI build output to VSCode extension
    const guiBuildPath = path.join(guiPath, 'dist');
    if (!fs.existsSync(guiBuildPath)) {
        log('GUI build output not found at gui/dist', 'red');
        return false;
    }
    
    log('Copying GUI assets to VSCode extension...', 'cyan');
    try {
        fs.cpSync(guiBuildPath, vscodeGuiPath, { recursive: true });
        log('GUI assets copied successfully', 'green');
        return true;
    } catch (error) {
        log(`Failed to copy GUI assets: ${error.message}`, 'red');
        return false;
    }
}

// Start VSCode with extension debugging
function startVSCodeDebug() {
    log('Starting VSCode Extension Debug Environment', 'magenta');
    
    // Check and install dependencies first
    if (!checkAndInstallDependencies()) {
        log('Failed to install VSCode extension dependencies', 'red');
        return null;
    }
    
    // Build and copy GUI assets
    if (!buildAndCopyGui()) {
        log('Failed to build and copy GUI assets', 'red');
        return null;
    }
    
    // Compile the extension
    log('Compiling extension...', 'cyan');
    if (!execCommand('npm run compile', __dirname)) {
        log('Failed to compile extension', 'red');
        return null;
    }
    
    log('Opening VSCode with extension debugging...', 'cyan');
    
    // Start VSCode with extension development
    const child = spawn('code', ['.', '--extensionDevelopmentPath', __dirname], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });
    
    child.on('error', (error) => {
        log(`Failed to start VSCode debug: ${error.message}`, 'red');
        log('Make sure VSCode is installed and "code" command is available in PATH', 'yellow');
    });
    
    child.on('close', (code) => {
        if (code !== 0) {
            log(`VSCode debug process exited with code ${code}`, 'red');
        }
    });
    
    return child;
}

// Build VSCode extension
function buildVSCodeExtension() {
    log('Building VSCode Extension', 'magenta');
    
    // Check and install dependencies first
    if (!checkAndInstallDependencies()) {
        log('Failed to install VSCode extension dependencies', 'red');
        return false;
    }
    
    // Compile TypeScript
    log('Compiling TypeScript...', 'cyan');
    if (!execCommand('npm run compile', __dirname)) {
        log('Failed to compile VSCode extension', 'red');
        return false;
    }
    
    // Package extension
    log('Packaging extension...', 'cyan');
    if (!execCommand('npx vsce package', __dirname)) {
        log('Failed to package VSCode extension', 'red');
        return false;
    }
    
    log('VSCode extension built successfully!', 'green');
    return true;
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'dev';
    
    switch (command) {
        case 'dev':
        case 'watch':
            startVSCodeDev();
            break;
        case 'debug':
            startVSCodeDebug();
            break;
        case 'build':
            buildVSCodeExtension();
            break;
        case 'build-gui':
            buildAndCopyGui();
            break;
        case 'install':
            checkAndInstallDependencies();
            break;
        default:
            log('Usage: node dev.js [dev|debug|build|build-gui|install]', 'yellow');
            log('  dev/watch: Start development environment with auto-compilation', 'white');
            log('  debug: Start VSCode with extension debugging (includes GUI build)', 'white');
            log('  build: Build and package the extension', 'white');
            log('  build-gui: Build GUI and copy assets to extension', 'white');
            log('  install: Install dependencies only', 'white');
            break;
    }
}

// Handle process termination
process.on('SIGINT', () => {
    log('\nShutting down VSCode extension development...', 'yellow');
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('\nShutting down VSCode extension development...', 'yellow');
    process.exit(0);
});

if (require.main === module) {
    main();
}

module.exports = {
    startVSCodeDev,
    buildVSCodeExtension,
    checkAndInstallDependencies
};