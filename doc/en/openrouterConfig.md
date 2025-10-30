# 🌐 OpenRouter Configuration Guide

> 💡 **What is OpenRouter?** A powerful AI model aggregation platform that provides unified API access to multiple top-tier AI models!

OpenRouter brings together excellent AI models like GPT-4, Claude, Gemini, and many others, allowing you to experience the unique features of different models on a single platform. It also supports domestic payment methods like WeChat Pay and Alipay, making it very convenient!

---

## 🎯 Why Choose OpenRouter?

🌟 **Rich Model Selection**: Integrates almost all mainstream AI models on the market  
💰 **Transparent Pricing**: Pay-per-use billing with multiple payment options  
🔧 **Unified Interface**: One API Key to access all models  
🚀 **Fast Response**: Global CDN acceleration for quick access  
💳 **Convenient Payment**: Supports WeChat Pay, Alipay, and other domestic payment methods  

---

## 💰 Step 1: Account Recharge

### Register and Login to OpenRouter

1. 🔗 [Visit OpenRouter Official Website](https://openrouter.ai/)
2. Register an account and complete email verification
3. Login and enter the console

### Recharge Account Balance

**Step 1**: Enter the recharge page
- 🔗 [Direct link to recharge page](https://openrouter.ai/settings/credits)
- Or click the "Credits" tab in the console

![OpenRouter Recharge Page](../img/openrouter/openrouter-add-credit.png)

**Step 2**: Select recharge amount
- Recommended first-time recharge of $5-10 for testing
- Choose appropriate amount based on usage needs

**Step 3**: Select payment method
- 🎉 **Good News**: Supports WeChat Pay and Alipay!
- Domestic users can directly use familiar payment methods

![WeChat Pay and Alipay Recharge](../img/openrouter/openrouter-add-credit-wx.png)

> 💡 **Recharge Tips**: OpenRouter billing is calculated based on token usage. $5 can typically support quite a long period of use. It's recommended to start with a small recharge for testing, then add more as needed after confirming effectiveness.

---

## 🔑 Step 2: Create API Key

### Generate API Key

**Step 1**: Enter API Key management page
- 🔗 [Direct link to API Key page](https://openrouter.ai/settings/keys)
- Or click the "Keys" tab in the console

**Step 2**: Create new API Key
- Click the "Create Key" button
- Set an easily recognizable name for your API Key (e.g., "VoidMuse-Dev")

![Create API Key](../img/openrouter/openrouter-add-apikey.png)

**Step 3**: Set usage limits (recommended)
- **Monthly Limit**: Set maximum monthly usage amount to avoid unexpected overspending
- **Model Restrictions**: Can limit to use only specific models

> 🛡️ **Security Reminder**:
> - API Key is only displayed once after creation, please copy and save it immediately
> - Recommend setting reasonable usage limits to avoid unexpected high costs
> - Never expose API Keys in public code

---

## ⚙️ Step 3: Configure in VoidMuse

### Configure OpenRouter Model

**Step 1**: Open VoidMuse settings
- Open VoidMuse plugin settings in the IDE
- Find the "Model Configuration" section

**Step 2**: Add OpenRouter configuration
- **Provider**: Select "OpenRouter"
- **API Key**: Paste the API Key created earlier
- **Base URL**: `https://openrouter.ai/api/v1` (usually auto-filled)
- **Model ID**: Select the model you want to use (e.g., `anthropic/claude-3.5-sonnet`)

![VoidMuse OpenRouter Configuration](../img/openrouter/openrouter-VoidMuse.png)

**Step 3**: Test connection
- After saving configuration, send a test message
- Confirm that AI responds normally

---

## 🎉 Configuration Complete! Start Experiencing

### Verify Configuration

**Test Basic Conversation**:
```
Hello, please introduce yourself
```

**Test Coding Ability**:
```
Help me write a Python quicksort algorithm
```

**Test Analysis Ability**:
```
Analyze the time complexity of this code
```

---

## 💡 Usage Tips

### Cost Control

**1. Choose Models Wisely**
- Use cheaper models for simple tasks
- Use premium models only for complex tasks

**2. Set Usage Limits**
- Set monthly limits in API Key settings
- Regularly check usage statistics

**3. Optimize Prompts**
- Clear and concise prompts reduce token consumption
- Avoid repetitive or redundant conversations

### Model Switching

**Quick Switching**:
- Create multiple configurations for different models
- Quickly switch models based on task type

**A/B Testing**:
- Try different models for the same question
- Find the model that best suits your usage habits

---

## 🆘 Frequently Asked Questions

### Recharge Related

**Q: What payment methods are supported?**  
A: Supports credit cards, PayPal, WeChat Pay, Alipay, and other payment methods

**Q: Is there a minimum recharge amount?**  
A: Usually minimum $5, specific amounts as shown on the page

**Q: What to do when balance runs out?**  
A: Can recharge anytime, available immediately after recharge

### API Usage Related

**Q: Do API Keys have expiration dates?**  
A: No fixed expiration, but regular rotation is recommended for security

**Q: Can multiple models be used simultaneously?**  
A: Yes, one API Key can access all available models

**Q: How to check usage?**  
A: View detailed usage statistics on the "Usage" page in OpenRouter console

### Configuration Related

**Q: VoidMuse can't connect to OpenRouter?**  
A: Check if API Key is correct, network is normal, and Base URL is correctly filled

**Q: Model response is slow?**  
A: May be network issues or high model load, try switching to other models

---

## 🔗 Related Links

- 🌐 [OpenRouter Official Website](https://openrouter.ai/)
- 💰 [Recharge Page](https://openrouter.ai/settings/credits)
- 🔑 [API Key Management](https://openrouter.ai/settings/keys)
- 📚 [API Documentation](https://openrouter.ai/docs)
- 💬 [Community Discord](https://discord.gg/openrouter)

---

## 🔧 Advanced Configuration

### Environment Variables
For enhanced security, consider using environment variables:
```bash
export OPENROUTER_API_KEY="your-api-key-here"
```

### Rate Limiting
- Implement proper rate limiting in your applications
- Respect model-specific rate limits
- Use exponential backoff for retries

### Model Selection Strategy
- **Fast Models**: For quick responses and simple tasks
- **Balanced Models**: For general-purpose usage
- **Premium Models**: For complex reasoning and analysis

### Monitoring and Analytics
- Track token usage patterns
- Monitor response times and quality
- Set up alerts for unusual usage spikes

---

> 🎯 **Pro Tip**: OpenRouter is a very flexible platform supporting almost all mainstream AI models. With proper configuration and usage, it can greatly enhance your AI programming experience!

*For the latest features and updates, please visit the official OpenRouter documentation.*