# Function Call in Practice: Implementing Deep Search

> About [VoidMuse](https://github.com/voidmuse-dev/voidmuse): An open-source AI IDE plugin focused on learning, supporting IntelliJ IDEA and VS Code. By integrating 20+ excellent open-source components, it helps you master AI engineering technologies in actual development. It not only provides tools but, more importantly, helps you truly apply AI knowledge through practice. This article will help you deeply understand Function Call technology through VoidMuse's deep search functionality.

## 1. Difference Between Deep Search and Traditional Search

Traditional search modes typically perform only one query. After users input keywords, search engines return results matching those keywords. However, in reality, when we search for content, it's difficult to find satisfactory content in one go. We need to iteratively search based on already acquired information to get satisfactory results.

For example, when searching for "React performance optimization," traditional search only returns results directly related to this keyword, without automatically diving deeper into more specific areas like "React virtual DOM optimization" or "React component lazy loading."

Deep search breaks through the limitations of traditional search by implementing more comprehensive and in-depth information acquisition through multi-round iterative searching:
- After the first search, the system analyzes search results
- Based on acquired information, automatically generates new, more precise search terms
- Uses new search terms for the next round of searching
- Continues iterating until comprehensive information is acquired or preset search depth is reached

This approach simulates the search behavior of professional researchers, where each round of searching builds on knowledge acquired from the previous round, gradually deepening and expanding the information scope.

Deep search effect is shown below:
![Deep Search Effect](../img/tutorial/深度搜索/深度搜索效果.png)

## 2. Function Call and Deep Search
To implement deep search, we need to utilize Function Call capabilities, where LLM calls search tools through function calls and iteratively searches.

### 2.1 Basic Concepts of Function Call

Function Call is a key capability of Large Language Models (LLM) that allows models to call predefined functions or tools during conversations. In deep search, Function Call plays a core role:

- Models can decide when to call search tools
- Models can generate appropriate search keywords
- Models can analyze search results and decide on next actions

### 2.2 Sequence Diagram of Deep Search

Deep search implementation involves complex interactions between LLM, applications, and search engines:
![Deep Search Sequence Diagram](../img/tutorial/深度搜索/深度搜索时序图.png)

Key to deep search implementation: Loop calling the large model until the model no longer requests search tools or reaches maximum search count.

#### 2.2.1 LLM Decision Process
1. Receive user query
2. Analyze query content, determine if external information search is needed
3. If search is needed, generate appropriate search keywords
4. Analyze search results, decide if further search is needed
5. If further search is needed, generate new search keywords
6. When sufficient information is acquired, synthesize all results to answer user

#### 2.2.2 Tool Call Process
1. Application sends request with tool definitions to LLM
2. LLM returns tool call request (including search keywords)
3. Application executes search and gets results
4. Application returns search results to LLM
5. Repeat steps 2-4 until LLM no longer requests search or reaches maximum search count

### 2.3 Search Tool Declaration and Usage

#### 2.3.1 Pseudo Code Implementation - Direct LLM API Integration
Pseudo code implementation of deep search: Connecting to LLM API
```javascript
while(result.toolCall exists || maxStepCount not reached) {
  // Call search tool
  const searchResult = await callSearchTool(toolCall);
  
  // Call large model: Need to pass historical data to the model
  result = await callLLM(history, searchResult);
}
```

Data parameters for calling LLM can refer to the image: Contains two tool calls
![Deep Search - Data Structure Sent to LLM](../img/tutorial/深度搜索/深度搜索-发送给LLM的数据结构.png)

Complete parameter structure for calling LLM: Must carry complete historical context each time, including tools returned by previous LLM calls
![Deep Search - First LLM Call](../img/tutorial/深度搜索/深度搜索-首次调用llm.png)
![Deep Search - Second LLM Call](../img/tutorial/深度搜索/深度搜索-第二次调用llm.png)

When making the 3rd search tool call, the complete parameters passed when calling LLM after the 3rd local search completion are shown below:
![Deep Search - Complete LLM Call Parameters](../img/tutorial/深度搜索/深度搜索-完整调用llm传递的参数.png)

#### 2.3.2 Implementation Using Vercel AI SDK
Vercel AI SDK: Encapsulates multi-round tool calls. After understanding the principles, using well-encapsulated SDKs is more efficient without reinventing the wheel.

When implementing deep search, we need to provide search tool definitions to the LLM. Here's a typical search tool definition example:

```javascript
const searchTool = {
  name: "webSearch",
  description: "Search the internet for latest information",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search keywords"
      }
    },
    required: ["query"]
  }
};
```

In Vercel AI SDK, tools are used as follows:

```typescript
const result = streamText({
    model: model,
    messages: messages,
    system: systemPrompt,
    tools: [searchTool],  // Provide search tool definition
    stopWhen: stepCountIs(5),  // Limit maximum search count
    abortSignal: abortController.current?.signal,
    onError: handleError
});
```

## 3. Control Mechanisms for Deep Search

### 3.1 LLM Autonomous Judgment of End Conditions

A key characteristic of deep search is that LLM can autonomously judge when to end searching:

- When LLM believes sufficient information has been acquired, it no longer returns tool call requests
- When LLM finds that subsequent searches may not provide new information, it stops searching
- When LLM determines the question has been completely answered, it ends the search process

This autonomous judgment mechanism allows deep search to both acquire comprehensive information and avoid ineffective searches, improving efficiency.

### 3.2 Maximum Tool Call Limit (stopWhen: stepCountIs(5))

Although LLM can autonomously judge search end conditions, setting a maximum tool call limit is necessary to prevent potential infinite loops or excessive searching:

```typescript
stopWhen: stepCountIs(5)  // Limit to maximum 5 tool calls
```

This parameter ensures that even if LLM continues requesting more searches, the system will forcibly end the search process after reaching the preset count.

### 3.3 Necessity of Defensive Design

When implementing deep search, defensive design is crucial:

- **Prevent infinite loops**: LLM might fall into continuous search loops, must set maximum call count
- **Control resource consumption**: Each search consumes API calls and computational resources, needs reasonable limits
- **Avoid information overload**: Too many search results might cause information overload, actually reducing answer quality

## 4. Practical Application Cases

### 4.1 Code Example Analysis

Here's the core code for implementing deep search using Vercel AI SDK:

```typescript
const result = streamText({
    model: model,
    messages: MessageConverter.getInstance().convertToApiFormat(historyList.map(msg => msg.message), promptContent),
    system: PromptService.getSystemPrompt({
        modelName: modelRef.current?.name || '',
        projectInfo: projectInfo,
        tools: tools
    }),
    tools: tools,
    stopWhen: stepCountIs(5),
    abortSignal: abortController.current?.signal,
    onError: (error) => {
        handleApiError(error, onUpdate, onSuccess, selectedModel);
    }
});
```

```typescript
export const webSearchTool = tool({
  description: 'Search the web for information based on keywords to obtain the latest relevant materials and data',
  inputSchema: z.object({
    keyword: z.string().describe('Search keyword should be specific and relevant. Please automatically determine based on the nature of the search content: use English keywords for international content like technical documentation, international news, academic materials; use Chinese keywords for Chinese information, localized content, Chinese community discussions. Choose the language that will yield the most accurate search results.'),
    searchIntent: z.string().describe('Search intent explanation, describe why you need to search for this keyword')
  }),
  execute: async ({ keyword, searchIntent }) => {
    try {
      const result = await searchService.onlineSearch(keyword);
      
      if (result.success) {
        return {
          success: true,
          keyword,
          searchIntent,
          results: result.results.map(item => ({
            title: item.title || '',
            url: item.url,
            snippet: item.description,
            favicon: item.favicon || '',
          }))
        };
      } else {
        return {
          success: false,
          error: result.msg || 'Search failed',
          keyword,
          searchIntent
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Search service error',
        keyword,
        searchIntent
      };
    }
  }
});
```

### 4.2 Key Implementation Details

#### 4.2.1 Tool Definition Structure
- **Description**: Clear description of tool functionality
- **Input Schema**: Structured parameter definition using Zod
- **Execute Function**: Actual search logic implementation

#### 4.2.2 Error Handling
- **Network errors**: Graceful handling of connection failures
- **API errors**: Proper error message formatting
- **Timeout handling**: Preventing hanging requests

#### 4.2.3 Result Processing
- **Data normalization**: Consistent result format
- **Content filtering**: Removing irrelevant or low-quality results
- **Metadata preservation**: Keeping source information for transparency

## 5. Advanced Optimization Strategies

### 5.1 Intelligent Search Strategy
- **Query expansion**: Automatically expanding search terms based on context
- **Result clustering**: Grouping similar results to avoid redundancy
- **Source diversification**: Ensuring results come from varied, reliable sources

### 5.2 Performance Optimization
- **Caching mechanisms**: Storing frequently accessed search results
- **Parallel processing**: Running multiple searches concurrently when appropriate
- **Rate limiting**: Respecting API limits and preventing abuse

### 5.3 Quality Assurance
- **Result validation**: Checking search result quality and relevance
- **Bias detection**: Identifying and mitigating search bias
- **Fact checking**: Cross-referencing information across multiple sources

## 6. Real-world Use Cases

### 6.1 Technical Documentation Search
When developers ask about specific APIs or frameworks:
1. Initial search for official documentation
2. Follow-up searches for community examples
3. Additional searches for troubleshooting guides
4. Final synthesis of comprehensive answer

### 6.2 Market Research
For business intelligence queries:
1. Search for industry reports
2. Look for competitor analysis
3. Find market trend data
4. Compile comprehensive market overview

### 6.3 Academic Research
For research-oriented questions:
1. Search for peer-reviewed papers
2. Look for recent developments
3. Find related work and citations
4. Provide comprehensive literature review

## 7. Best Practices and Guidelines

### 7.1 Search Query Optimization
- **Specificity**: Use specific terms rather than generic ones
- **Context awareness**: Include relevant context in search queries
- **Language selection**: Choose appropriate language for target content

### 7.2 Result Processing
- **Relevance filtering**: Remove irrelevant or low-quality results
- **Deduplication**: Eliminate duplicate information
- **Source credibility**: Prioritize authoritative sources

### 7.3 User Experience
- **Transparency**: Show users what searches are being performed
- **Progress indication**: Provide feedback on search progress
- **Result attribution**: Clearly cite sources for all information

## Conclusion

Deep search represents a significant advancement in AI-powered information retrieval. By leveraging Function Call capabilities, we can create systems that think and search like human researchers, iteratively building knowledge and providing comprehensive answers.

The implementation in VoidMuse demonstrates how these concepts can be applied in practical development tools, making complex information more accessible to developers. As AI continues to evolve, deep search capabilities will become increasingly important for creating truly intelligent assistants.

The key to successful deep search implementation lies in balancing thoroughness with efficiency, ensuring that the system can find comprehensive information while respecting resource constraints and user expectations.

---

*This tutorial is part of the VoidMuse educational series. For more hands-on examples and technical deep dives, visit our [GitHub repository](https://github.com/voidmuse-dev/voidmuse).*