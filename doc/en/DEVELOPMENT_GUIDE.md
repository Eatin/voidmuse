# VoidMuse Development Guide

## Project Structure

VoidMuse adopts an independent development mode, where each component has its own development and build scripts:

```
voidmuse/
├── gui/                    # React Web GUI Interface
├── extensions/
│   ├── vscode/            # VSCode Extension
│   └── intellij/          # IntelliJ IDEA Plugin
├── doc/                   # Project Documentation
```

## Environment Requirements

- **Node.js** >= 16.0.0
- **Java** >= 17 (for IntelliJ plugin development)
- **Gradle** (for IntelliJ plugin build, automatically managed via Gradle Wrapper)
- **VSCode** (for VSCode extension development)

## Quick Start

### Install Dependencies
```bash
# GUI project dependencies
cd gui && npm install

# VSCode extension dependencies
cd extensions/vscode && npm install

# IntelliJ plugin uses Gradle to manage dependencies, no manual installation needed
```

## Development Environment Setup

### 🎨 GUI Development

```bash
cd gui
npm run dev          # Start development server (http://localhost:3002)
npm run build:test   # Build static file version
npm run preview      # Preview production build
npm run lint         # Run code linting
```

### 📝 VSCode Extension Development

```bash
cd extensions/vscode
npm run dev          # Start development mode
npm run build        # Build extension
npm run package      # Package extension (.vsix file)
```

**Debug in VSCode:**
1. Open `extensions/vscode` folder in VSCode
2. Press `F5` to launch Extension Development Host
3. Test extension features in the new window

### ☕ IntelliJ Plugin Development

```bash
cd extensions/intellij
./gradlew runIde     # Launch IntelliJ with plugin for testing
./gradlew build      # Build plugin
./gradlew buildPlugin # Package plugin (.zip file)
```

**Debug in IntelliJ:**
1. Open `extensions/intellij` folder in IntelliJ IDEA
2. Run `runIde` Gradle task
3. Test plugin features in the launched IDE instance

## Development Workflow

### 🔄 Hot Reload Development

**GUI Hot Reload:**
- Modify files in `gui/src/`
- Browser automatically refreshes
- Real-time preview of changes

**Extension Hot Reload:**
- VSCode: Use `Developer: Reload Window` command
- IntelliJ: Restart the development IDE instance

### 🧪 Testing

```bash
# GUI testing
cd gui
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests

# VSCode extension testing
cd extensions/vscode
npm run test         # Run extension tests

# IntelliJ plugin testing
cd extensions/intellij
./gradlew test       # Run plugin tests
```

### 📦 Building for Production

```bash
# Build GUI
cd gui
npm run build        # Production build

# Package VSCode extension
cd extensions/vscode
npm run package      # Generate .vsix file

# Package IntelliJ plugin
cd extensions/intellij
./gradlew buildPlugin # Generate .zip file
```

## Architecture Overview

### Frontend Architecture (gui/)
- **React 18** + **TypeScript** + **Vite**
- **Ant Design 5.x** for UI components
- **TipTap** for rich text editing
- **Vercel AI SDK** for AI model integration

### VSCode Extension (extensions/vscode/)
- **TypeScript** + **VSCode Extension API**
- **Webpack** for bundling
- **ESLint** + **Prettier** for code quality

### IntelliJ Plugin (extensions/intellij/)
- **Java/Kotlin** + **IntelliJ Platform SDK**
- **Gradle** for build management
- **JUnit** for testing

## Key Development Concepts

### 🔌 Plugin Communication
- Extensions communicate with GUI via local HTTP server
- RESTful API design for cross-platform compatibility
- WebSocket for real-time features

### 🧠 AI Integration
- Unified AI service layer in GUI
- Support for multiple AI providers (OpenAI, Anthropic, etc.)
- Token usage tracking and cost management

### 💾 Data Storage
- Local storage for user preferences
- Vector database for code embeddings
- Secure API key management

## Debugging Tips

### Common Issues

**Port Conflicts:**
- GUI default port: 3002
- Change in `gui/vite.config.ts` if needed

**Extension Not Loading:**
- Check console for error messages
- Verify manifest.json/plugin.xml syntax
- Ensure all dependencies are installed

**Build Failures:**
- Clear node_modules and reinstall
- Check Node.js/Java version compatibility
- Verify environment variables

### Development Tools

**Recommended VSCode Extensions:**
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Thunder Client (for API testing)

**Recommended IntelliJ Plugins:**
- Gradle
- Kotlin (if using Kotlin)
- Plugin DevKit

## Contributing Guidelines

### Code Style
- Follow existing code conventions
- Use TypeScript for new JavaScript code
- Add JSDoc comments for public APIs
- Write unit tests for new features

### Git Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Documentation
- Update README for new features
- Add inline code comments
- Create tutorial docs for complex features
- Update API documentation

## Performance Optimization

### GUI Performance
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Optimize bundle size with code splitting
- Use service workers for caching

### Extension Performance
- Minimize extension activation time
- Use lazy loading for heavy operations
- Implement efficient file watching
- Cache computation results

## Security Considerations

### API Key Management
- Never commit API keys to repository
- Use secure storage mechanisms
- Implement key rotation capabilities
- Validate API responses

### Data Privacy
- Minimize data collection
- Implement local-first architecture
- Provide clear privacy controls
- Follow GDPR compliance guidelines

## Deployment

### Development Deployment
- GUI: Deploy to Vercel/Netlify
- Extensions: Use development channels

### Production Deployment
- VSCode: Publish to Visual Studio Marketplace
- IntelliJ: Publish to JetBrains Marketplace
- GUI: Deploy to production hosting

## Support and Resources

### Documentation
- [Architecture Overview](architecture.md)
- API Reference (coming soon)
- [Tutorial Series](tutorial/)

### Community
- GitHub Discussions for questions
- Discord/Slack for real-time chat
- Regular community calls

### Getting Help
- Check existing GitHub issues
- Search documentation
- Ask in community channels
- Create detailed bug reports

---

Happy coding! 🚀 If you encounter any issues during development, don't hesitate to reach out to our community.