# Bocha AI Search Configuration Guide

## Overview

Bocha AI is a world knowledge search engine specifically designed for AI applications, providing clean, accurate, and high-quality search results for AI Agents, AI Chatbots, AI Search, and various RAG applications. As the official partner for DeepSeek's internet search functionality, Bocha has significant advantages in the AI search field.

## Prerequisites

Before starting the configuration, please ensure you have:
- Registered a Bocha AI Open Platform account
- Completed account recharge (Bocha uses a prepaid model)

📋 **Official Platform**: https://open.bochaai.com/

---

## Step 1: Obtain API Key

### 1.1 Access API Key Management Page

🔗 **Configuration URL**: https://open.bochaai.com/api-keys

### 1.2 Create API Key

Follow these steps to create your API key:

**Step 1:** Enter the API Key creation page
![Bocha API Key Creation Process](../img/bochaSearch/zh/bochaSearchAPIKey_1.png)

**Step 2:** Complete API Key creation and save it securely

✅ After creation, you will receive a unique API Key. Please keep this key safe.

---

## Step 2: Account Recharge

### 2.1 Recharge Requirements

⚠️ **Important Notice**: Bocha uses a prepaid model, requiring recharge before using API services.

### 2.2 Recharge Process

🔗 **Recharge URL**: https://open.bochaai.com/recharge

Complete account recharge following the page instructions. It's recommended to recharge reasonably based on expected usage.

---

## Step 3: Configure Parameters in VoidMuse

### 3.1 Parameter Configuration

Configure the obtained Bocha API Key in VoidMuse:

![VoidMuse Bocha Configuration](../img/bochaSearch/zh/voidMuseBochaConfig.png)

### 3.2 Configuration Items

| Configuration Item | Description | How to Obtain |
|-------------------|-------------|---------------|
| API Key | Bocha AI search service access key | Obtained in Step 1 |

---

## Pricing Information

### API Service Pricing

📊 **Current Pricing** (For detailed information, please refer to: https://bocha-ai.feishu.cn/wiki/JYSbwzdPIiFnz4kDYPXcHSDrnZb):

| API Service | Price | Description |
|-------------|-------|-------------|
| Web Search API | ¥0.036/call | Core search service |
| Semantic Reranker API | Free for limited time | Semantic reranking service |

### Cost Advantages

💡 **Cost-Effectiveness Analysis**:
- Significant price advantage compared to international similar services
- Better Chinese content search results than Bing, at only 1/3 of the price

## Important Notes

⚠️ **Important Reminders**:
- Keep your API Key secure and avoid leakage
- Bocha uses a prepaid model, ensure sufficient account balance
- Plan API calls reasonably based on actual usage needs
- Monitor API usage to avoid unexpected high costs

## Troubleshooting

If you encounter issues during configuration, please check:
1. Whether the Bocha account is registered and real-name verified
2. Whether the account balance is sufficient
3. Whether the API Key is correctly copied and configured
4. Whether the network connection is normal
5. Whether API call frequency limits are being followed

## Support Resources

- **Official Documentation**: https://open.bochaai.com/docs
- **Technical Support**: Contact through the official platform
- **Community Forum**: Join the Bocha AI developer community

## Security Considerations

- Never expose API keys in public repositories
- Use environment variables to store sensitive configuration
- Regularly rotate API keys for enhanced security
- Monitor usage patterns for unusual activity

## Advanced Configuration

### Rate Limiting
- Implement proper rate limiting in your application
- Respect API quotas and limits
- Use exponential backoff for retry logic

### Error Handling
- Implement robust error handling for API failures
- Log errors appropriately for debugging
- Provide fallback mechanisms when possible

---

*For the latest updates and detailed documentation, please visit the official Bocha AI platform.*