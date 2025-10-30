# 🤝 Contributing Guide

## 🎯 Ways to Contribute

- 🐛 **Bug Fixes**: Help improve plugin stability
- ✨ **Feature Development**: Add new AI features
- 📖 **Documentation**: Supplement technical documentation
- 🧪 **Test Cases**: Improve code coverage
- 🎓 **Tutorial Writing**: Share learning experiences

## 📚 Learning-Oriented Contributions

We especially welcome the following types of contributions:
- AI concept explanation documents
- In-depth technical analysis
- Best practice case sharing
- Performance optimization solutions
- New model integration tutorials

## 🔧 Development Guide

### Basic Workflow

1. **Fork the project** to your GitHub account
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Environment Setup

#### Frontend Development Environment
```bash
# Clone the project
git clone https://github.com/your-org/voidmuse.git
cd voidmuse

# Install frontend dependencies
cd gui
npm install

# Start development server
npm run dev
```

#### VS Code Extension Development
```bash
# Install VS Code extension dependencies
cd extensions/vscode
npm install

# Compile the extension
npm run compile

# Start debugging (Press F5)
```

#### IntelliJ Plugin Development
```bash
# Build IntelliJ plugin
cd extensions/intellij
./gradlew buildPlugin

# Run the plugin
./gradlew runIde
```

## 📋 Development Standards

### Code Standards
- Development Environment Setup (see above sections)
- Coding Standards (follow existing code style)
- Documentation Writing Standards (clear and comprehensive)
- Testing Guide (add tests for new features)
- Commit Message Standards (see below)

### Commit Standards

We use [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Type Descriptions
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `style`: Code formatting adjustment
- `refactor`: Code refactoring
- `test`: Test-related
- `chore`: Build process or auxiliary tool changes

#### Examples
```
feat(ai-chat): add Claude model support
fix(embedding): resolve vector search timeout issue
docs(readme): update installation instructions
```

### Code Review Guidelines

#### For Contributors
- Ensure code follows project conventions
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Respond to review feedback promptly

#### For Reviewers
- Be constructive and respectful
- Focus on code quality and maintainability
- Check for security vulnerabilities
- Verify test coverage
- Ensure documentation is updated

## 🧪 Testing Guidelines

### Test Types
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **Performance Tests**: Verify performance requirements

### Running Tests
```bash
# Frontend tests
cd gui
npm run test
npm run test:e2e

# VSCode extension tests
cd extensions/vscode
npm run test

# IntelliJ plugin tests
cd extensions/intellij
./gradlew test
```

### Writing Tests
- Write tests for all new features
- Maintain high test coverage (>80%)
- Use descriptive test names
- Mock external dependencies
- Test edge cases and error conditions

## 📖 Documentation Guidelines

### Documentation Types
- **API Documentation**: Function and class documentation
- **User Guides**: How-to guides for end users
- **Developer Guides**: Technical implementation details
- **Tutorials**: Step-by-step learning materials

### Writing Standards
- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep documentation up-to-date
- Follow markdown best practices

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version numbers bumped
- [ ] Release notes prepared
- [ ] Security review completed

## 🏆 Recognition

### Contributor Recognition
- Contributors are listed in project README
- Significant contributions are highlighted in release notes
- Active contributors may be invited to join the core team
- Special recognition for learning-oriented contributions

### Contribution Levels
- **First-time Contributor**: Welcome package and guidance
- **Regular Contributor**: Direct commit access to documentation
- **Core Contributor**: Review privileges and decision-making input
- **Maintainer**: Full project access and responsibility

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different perspectives and experiences
- Report inappropriate behavior to maintainers

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Discord/Slack**: Real-time community chat
- **Email**: Direct contact with maintainers

### Getting Help
1. Check existing documentation
2. Search GitHub issues
3. Ask in community channels
4. Create a detailed issue if needed

## 📊 Project Metrics

### Quality Metrics
- Code coverage percentage
- Test pass rate
- Documentation coverage
- Issue resolution time
- Community engagement

### Contribution Metrics
- Number of contributors
- Contribution frequency
- Feature adoption rate
- User satisfaction scores
- Learning resource usage

## 🎯 Contribution Ideas

### For Beginners
- Fix typos in documentation
- Add code comments
- Write unit tests
- Improve error messages
- Create usage examples

### For Intermediate Contributors
- Implement new features
- Optimize performance
- Add integration tests
- Create tutorials
- Improve UI/UX

### For Advanced Contributors
- Design new architecture components
- Lead feature development
- Mentor new contributors
- Review complex pull requests
- Plan project roadmap

## 📞 Contact Information

### Maintainer Contacts
- **Project Lead**: [Email/GitHub]
- **Technical Lead**: [Email/GitHub]
- **Community Manager**: [Email/GitHub]

### Support Channels
- **Technical Issues**: GitHub Issues
- **General Questions**: GitHub Discussions
- **Security Issues**: security@voidmuse.dev
- **Partnership Inquiries**: partnerships@voidmuse.dev

---

Thank you for contributing to VoidMuse! Your efforts help make AI development more accessible to everyone. 🚀