# Google Search Configuration Guide

## Overview

Using Google Custom Search service requires configuring two key parameters:
- **Search Engine ID** (Custom Search Engine ID)
- **API Key** (API Key)

## Prerequisites

Before starting configuration, please ensure you have a Google account and access the following official configuration pages:

📋 **Official Documentation**: https://developers.google.com/custom-search/v1/overview

![Configuration Page](../img/googleSearch/zh/googleSearchIndex_zh.png)

---

## Step 1: Configure Search Engine ID

### 1.1 Access Configuration Page

🔗 **Configuration URL**: https://programmablesearchengine.google.com/controlpanel/all

### 1.2 Create Custom Search Engine

Follow these steps to create your custom search engine:

**Step 1:** Enter the search engine creation page
![Configuration Page](../img/googleSearch/zh/googleSearchEngine_1_zh.png)

**Step 2:** Fill in basic search engine information
![Configuration Page](../img/googleSearch/zh/googleSearchEngine_2_zh.png)

**Step 3:** Complete creation and get Search Engine ID
![Configuration Page](../img/googleSearch/zh/googleSearchEngine_3_zh.png)
![Configuration Page](../img/googleSearch/zh/googleSearchEngine_4_zh.png)

### 1.3 Get Search Engine ID

✅ After configuration is complete, you will get a unique custom search engine ID, which is the required **Search Engine ID**.

---

## Step 2: Configure API Key

### 2.1 Access API Configuration Page

🔗 **Configuration URL**: https://developers.google.com/custom-search/v1/overview

### 2.2 Create API Key

Follow these steps to get your API key:

**Step 1:** Enter API key management page
![Configuration Page](../img/googleSearch/zh/googleSearchAPIKey_zh.png)

**Step 2:** Create and configure API key
![Configuration Page](../img/googleSearch/zh/googleSearchAPIKey_2_zh.png)

### 2.3 Enable Custom Search API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Enable the "Custom Search JSON API"
4. Create credentials (API Key)
5. Copy the generated API key

---

## Step 3: Configure Parameters in VoidMuse

### 3.1 Parameter Configuration

Configure the obtained Google search parameters in VoidMuse:

![Configuration Page](../img/googleSearch/zh/voidMuseSearchConfig_zh.JPG)

### 3.2 Configuration Item Description

| Configuration Item | Description | How to Obtain |
|-------------------|-------------|---------------|
| Search Engine ID | Unique identifier for custom search engine | Obtained in Step 1 |
| API Key | Google API access key | Obtained in Step 2 |

---

## Pricing Information

### Free Quota

🆓 **Custom Search JSON API** provides the following free services:
- **Daily free queries**: 100 search queries
- **Use case**: Personal development, small-scale testing

### Paid Plans

💰 If you need more queries, you can upgrade through the following:

| Quota Type | Query Count | Price | Description |
|------------|-------------|-------|-------------|
| Free Quota | 100/day | Free | No payment required |
| Paid Quota | Additional queries | $5/1000 queries | Need to register billing service in API console |
| Maximum Limit | 10,000/day | - | Daily query limit |

### Billing Information

📊 **Important Information**:
- Billing is based on actual API calls
- Free quota resets daily
- Paid usage is charged monthly
- Set up billing alerts to monitor usage

---

## Configuration Verification

### Test Search Functionality

After configuration, test the search functionality:

1. Open VoidMuse
2. Navigate to search settings
3. Enter test query
4. Verify search results are returned
5. Check for any error messages

### Common Test Queries

- "JavaScript tutorial"
- "Python best practices"
- "React hooks guide"
- "Machine learning basics"

---

## Troubleshooting

### Common Issues

#### API Key Issues
- **Invalid API Key**: Verify key is copied correctly
- **API Not Enabled**: Ensure Custom Search JSON API is enabled
- **Quota Exceeded**: Check daily usage limits
- **Billing Required**: Set up billing for paid usage

#### Search Engine Issues
- **Invalid Search Engine ID**: Verify ID is copied correctly
- **No Results**: Check search engine configuration
- **Access Denied**: Verify API key permissions
- **Rate Limiting**: Respect API rate limits

### Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Invalid API key" | Incorrect or expired API key | Regenerate and update API key |
| "Quota exceeded" | Daily limit reached | Wait for reset or upgrade plan |
| "Search engine not found" | Invalid Search Engine ID | Verify and update Search Engine ID |
| "Access forbidden" | Insufficient permissions | Check API key permissions |

### Debug Steps

1. **Verify Credentials**
   - Check API key format
   - Confirm Search Engine ID
   - Test with Google's API Explorer

2. **Check Configuration**
   - Verify VoidMuse settings
   - Test with curl command
   - Review error logs

3. **Monitor Usage**
   - Check quota consumption
   - Review billing status
   - Set up usage alerts

---

## Advanced Configuration

### Custom Search Settings

#### Search Scope
- **Entire Web**: Search across all websites
- **Specific Sites**: Limit to particular domains
- **Custom Filters**: Apply content filters

#### Result Customization
- **Language Settings**: Specify search language
- **Region Settings**: Target specific regions
- **Safe Search**: Enable content filtering
- **Result Count**: Adjust number of results

### API Optimization

#### Performance Tips
- **Caching**: Implement result caching
- **Batch Requests**: Combine multiple queries
- **Async Calls**: Use asynchronous requests
- **Error Handling**: Implement retry logic

#### Cost Optimization
- **Query Optimization**: Refine search terms
- **Result Filtering**: Filter irrelevant results
- **Usage Monitoring**: Track API consumption
- **Alternative Providers**: Consider backup options

---

## Security Considerations

### API Key Security
- **Environment Variables**: Store keys securely
- **Access Restrictions**: Limit key permissions
- **Regular Rotation**: Update keys periodically
- **Monitoring**: Track key usage

### Data Privacy
- **Query Logging**: Understand data retention
- **User Consent**: Inform users about search
- **Compliance**: Follow privacy regulations
- **Data Minimization**: Limit data collection

---

## Support Resources

### Official Documentation
- [Custom Search JSON API](https://developers.google.com/custom-search/v1/overview)
- [Programmable Search Engine](https://developers.google.com/custom-search/docs/overview)
- [Google Cloud Console](https://console.cloud.google.com/)

### Community Support
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-custom-search)
- [Google Developers Community](https://developers.google.com/community)
- [VoidMuse GitHub Issues](https://github.com/voidmuse-dev/voidmuse/issues)

### Contact Information
- **Technical Issues**: GitHub Issues
- **General Questions**: Community Forums
- **Billing Support**: Google Cloud Support

---

💡 **Tip**: Keep your API credentials secure and monitor usage regularly to avoid unexpected charges.