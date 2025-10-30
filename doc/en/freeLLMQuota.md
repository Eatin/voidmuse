# Free Quota Summary for Large Model Providers

## Overview

This document summarizes the free quota information provided by mainstream large model providers, helping users quickly understand and utilize free resources from various platforms. All information is collected from the latest sources, and it's recommended to check official platforms regularly for the latest policies.

⚠️ **Important Notice**: Free quota policies may change at any time. Please refer to the actual display on official platforms.

---

## Provider Comparison Overview

| Provider | Free Quota | Official Platform | Base URL | Notes |
|----------|------------|-------------------|----------|-------|
| Alibaba Cloud Bailian | 1M tokens/model | [Console](https://bailian.console.aliyun.com/#/home) | `https://dashscope.aliyuncs.com/compatible-mode/v1` | Independent quota per model |
| Volcano Engine | 500K tokens/model | [Console](https://www.volcengine.com/) | `https://ark.cn-beijing.volces.com/api/v3` | Need to activate models first |
| Baidu Qianfan | ❌ No free quota | [Console](https://console.bce.baidu.com/qianfan/overview) | `https://qianfan.baidubce.com/v2` | Paid usage only |
| SiliconFlow | 🎁 20M tokens | [Website](https://www.siliconflow.cn/) | `https://api.siliconflow.cn/v1` | New user benefit |
| OpenRouter | ⚠️ Some models free | [Website](https://openrouter.ai/) | `https://openrouter.ai/api/v1` | Unstable availability |

---

## Supported Model Comparison

### Text Models

| Provider | Supported Text Models |
|----------|----------------------|
| Alibaba Cloud Bailian | `deepseek-r1`, `deepseek-v3`, `QWEN` series... |
| Volcano Engine | `deepseek-r1-250528`, `deepseek-v3-250324`, `Doubao` series... |
| Baidu Qianfan | `DeepSeek-V3`, `DeepSeek-R1`, `ERNIE 4.5` series... |
| SiliconFlow | `DeepSeek-V3`, `DeepSeek-R1`... |
| OpenRouter | `OpenAI` series, `DeepSeek` series (partially free), `Claude` series, `Gemini` series... |

### Embedding Models

| Provider | Supported Embedding Models | Support |
|----------|----------------------------|---------|
| Alibaba Cloud Bailian | `text-embedding-v4`, `text-embedding-v3` | ✅ |
| Volcano Engine | `doubao-embedding-text-240715` | ✅ |
| Baidu Qianfan | `Tongyi Qianwen 3-Embedding` | ✅ |
| SiliconFlow | `Tongyi Qianwen 3-Embedding` | ✅ |
| OpenRouter | - | ❌ |

---

## API Key Acquisition Links

| Provider | API Key Management Link | Additional Configuration |
|----------|-------------------------|-------------------------|
| Alibaba Cloud Bailian | [API Key Management](https://bailian.console.aliyun.com/?tab=model#/api-key) | [Model Market](https://bailian.console.aliyun.com/?tab=model#/model-market) |
| Volcano Engine | [API Key Management](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey) | [Model Activation](https://console.volcengine.com/ark/region:ark+cn-beijing/openManagement) |
| Baidu Qianfan | [API Key Management](https://console.bce.baidu.com/qianfan/ais/console/apiKey) | - |
| SiliconFlow | Register on official website | - |
| OpenRouter | [API Key Management](https://openrouter.ai/settings/keys) | - |

---

## Usage Recommendations

### Priority Recommendation Table

| Rank | Provider | Recommendation Reason | Use Case |
|------|----------|----------------------|----------|
| 🥇 | SiliconFlow | Largest new user quota (20M tokens) | Initial testing, heavy usage |
| 🥈 | Alibaba Cloud Bailian | Rich model variety, independent quota per model | Multi-model testing, stable usage |
| 🥉 | Volcano Engine | Stable and reliable, good official support | Production environment testing |
| 4️⃣ | OpenRouter | Most model variety, rich international models | Model comparison, special needs |
| 5️⃣ | Baidu Qianfan | No free quota | Paid usage, enterprise applications |

### Considerations Comparison

| Consideration | Alibaba Cloud Bailian | Volcano Engine | Baidu Qianfan | SiliconFlow | OpenRouter |
|---------------|----------------------|----------------|---------------|-------------|------------|
| Real-name verification | ✅ Required | ✅ Required | ✅ Required | ⚠️ Recommended | ❌ Not required |
| Model activation | ❌ Not required | ✅ Required | ❌ Not required | ❌ Not required | ❌ Not required |
| Quota validity | 📅 Long-term | 📅 Long-term | - | 📅 Long-term | ⚠️ Free models unstable |

---

## Detailed Provider Information

### Alibaba Cloud Bailian
**Advantages:**
- 🎁 Generous free quota (1M tokens per model)
- 🚀 Rich model selection including latest DeepSeek models
- ⚡ Fast domestic access speed
- 🔧 Good API compatibility

**Setup Process:**
1. Register Alibaba Cloud account
2. Complete real-name verification
3. Access API Key management page
4. Create and copy API Key
5. Configure in VoidMuse

### SiliconFlow
**Advantages:**
- 🎁 Largest free quota (20M tokens for new users)
- 🌟 Latest model support
- 💰 Cost-effective pricing
- 🔧 Simple setup process

**Setup Process:**
1. Register on SiliconFlow website
2. Verify email address
3. Get API Key from dashboard
4. Configure in VoidMuse

### Volcano Engine
**Advantages:**
- 🏢 Enterprise-grade reliability
- 🔒 Strong security features
- 📞 Good customer support
- 🇨🇳 Optimized for Chinese users

**Setup Process:**
1. Register Volcano Engine account
2. Complete real-name verification
3. Activate required models
4. Create API Key
5. Configure in VoidMuse

### OpenRouter
**Advantages:**
- 🌍 Access to international models (GPT-4, Claude, etc.)
- 🔧 Unified API for multiple providers
- 💳 Flexible payment options
- 🆕 Quick access to new models

**Considerations:**
- ⚠️ Free model availability varies
- 🌐 May require VPN in some regions
- 💰 Paid usage for most advanced models

---

## Cost Optimization Tips

### Token Usage Optimization
- Use appropriate models for different tasks
- Implement response caching
- Optimize prompt length
- Use streaming for better UX

### Multi-Provider Strategy
- Start with free quotas
- Distribute usage across providers
- Monitor usage patterns
- Switch providers based on needs

### Budget Management
- Set usage alerts
- Track token consumption
- Plan for quota exhaustion
- Consider paid plans for production

---

## Troubleshooting

### Common Issues
- **API Key Invalid**: Check key format and permissions
- **Quota Exceeded**: Monitor usage and switch providers
- **Model Not Available**: Verify model activation status
- **Network Issues**: Check firewall and proxy settings

### Support Resources
- Provider documentation
- Community forums
- GitHub issues
- Direct customer support

---

## Update Log

| Date | Update Content |
|------|----------------|
| 2025-01-XX | Initial document creation |
| 2025-01-XX | Added SiliconFlow information |
| 2025-01-XX | Updated quota information |

---

💡 **Tip**: If you find more free quota information or errors in this document, please submit update suggestions.