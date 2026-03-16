# Agent Modes Guide

Agent Modes in ForgeAI define how the AI approaches tasks, with different tradeoffs between speed, cost, and capability. Each mode is optimized for specific types of work and development scenarios.

## 🤖 Understanding Agent Modes

### What are Agent Modes?

Agent modes are behavioral configurations that control:
- **Response speed** - How quickly the agent reacts and executes
- **Cost efficiency** - Token usage and model selection
- **Capability level** - Complexity of tasks the agent can handle
- **Autonomy degree** - How much human intervention is required

### Mode Selection Impact

Choosing the right mode affects:
- **Development velocity** - Faster modes for simple tasks
- **Budget consumption** - Economy modes for cost-sensitive work
- **Quality of output** - Advanced modes for complex problems
- **User experience** - Balance of automation vs control

## 📋 Agent Mode Comparison

| Mode | Speed | Cost | Capability | Autonomy | Best For |
|------|-------|------|------------|----------|----------|
| **Lite** | 🟢 Fast | 🟢 Low | 🟡 Basic | 🔴 Low | Quick fixes, simple questions |
| **Autonomous** | 🟡 Medium | 🟡 Medium | 🟡 Standard | 🟢 Medium | Feature implementation, refactoring |
| **Economy** | 🟡 Medium | 🟢 Low | 🟡 Standard | 🟢 Medium | Documentation, learning |
| **Power** | 🟡 Medium | 🔴 High | 🟢 Advanced | 🟢 High | Complex features, debugging |
| **Max** | 🔴 Slow | 🔴 High | 🟢 Full | 🟢 Full | Full projects, autonomous development |

## 🚀 Detailed Mode Breakdown

### Lite Mode

**Characteristics:**
- **Fast response time** - Optimized for quick interactions
- **Minimal token usage** - Cost-effective for frequent use
- **Basic capabilities** - Handles simple, well-defined tasks
- **Low autonomy** - Requires more user guidance

**When to Use:**
- Quick code fixes and typo corrections
- Simple refactoring (rename variable, extract function)
- Answering specific questions about code
- Small documentation updates
- Format and style improvements

**Example Tasks:**
```typescript
// Lite Mode - Quick Fix
"Fix the typo in the user interface label"

// Lite Mode - Simple Question
"What does this function do?"

// Lite Mode - Format Code
"Format this JavaScript file according to Prettier rules"
```

**Configuration:**
```json
{
  "model": "gpt-3.5-turbo",
  "maxTokens": 1000,
  "temperature": 0.1,
  "autoApproval": false,
  "contextWindow": 4000
}
```

### Autonomous Mode

**Characteristics:**
- **Balanced speed** - Reasonable response times
- **Moderate cost** - Standard pricing models
- **Standard capabilities** - Handles most development tasks
- **Medium autonomy** - Can work independently on defined tasks

**When to Use:**
- Feature implementation with clear requirements
- Standard refactoring and code improvements
- Unit test creation and updates
- API endpoint development
- Database schema modifications

**Example Tasks:**
```typescript
// Autonomous Mode - Feature Implementation
"Implement user authentication with email and password"

// Autonomous Mode - Refactoring
"Refactor this component to use React hooks"

// Autonomous Mode - Testing
"Add unit tests for the payment service"
```

**Configuration:**
```json
{
  "model": "gpt-4",
  "maxTokens": 4000,
  "temperature": 0.3,
  "autoApproval": true,
  "contextWindow": 8000
}
```

### Economy Mode

**Characteristics:**
- **Medium speed** - Acceptable response times
- **Low cost** - Uses cost-effective models
- **Standard capabilities** - Good for most tasks
- **Medium autonomy** - Works independently on straightforward tasks

**When to Use:**
- Documentation writing and updates
- Learning and exploration tasks
- Non-critical feature development
- Code reviews and analysis
- Educational content creation

**Example Tasks:**
```typescript
// Economy Mode - Documentation
"Write API documentation for the user endpoints"

// Economy Mode - Learning
"Explain how React hooks work with examples"

// Economy Mode - Code Review
"Review this pull request and suggest improvements"
```

**Configuration:**
```json
{
  "model": "claude-instant",
  "maxTokens": 3000,
  "temperature": 0.2,
  "autoApproval": true,
  "contextWindow": 6000
}
```

### Power Mode

**Characteristics:**
- **Medium speed** - Thoughtful, thorough responses
- **High cost** - Uses advanced models
- **Advanced capabilities** - Handles complex, multi-step tasks
- **High autonomy** - Can solve complex problems independently

**When to Use:**
- Complex feature development
- Architecture design and planning
- Difficult debugging and troubleshooting
- Performance optimization
- Security vulnerability analysis

**Example Tasks:**
```typescript
// Power Mode - Complex Feature
"Implement a real-time collaboration system with conflict resolution"

// Power Mode - Debugging
"Debug and fix the memory leak in the image processing module"

// Power Mode - Architecture
"Design a microservices architecture for the e-commerce platform"
```

**Configuration:**
```json
{
  "model": "gpt-4-turbo",
  "maxTokens": 8000,
  "temperature": 0.4,
  "autoApproval": true,
  "contextWindow": 32000
}
```

### Max Mode

**Characteristics:**
- **Slow speed** - Comprehensive, thorough analysis
- **High cost** - Premium models and extensive processing
- **Full capabilities** - Handles any development task
- **Full autonomy** - Complete project development

**When to Use:**
- Full project development from requirements to deployment
- Complex system design and implementation
- Research and development projects
- Multi-component feature development
- End-to-end application development

**Example Tasks:**
```typescript
// Max Mode - Full Project
"Build a complete task management application with user authentication, real-time updates, and mobile app"

// Max Mode - System Development
"Create a microservices-based e-commerce platform with payment processing, inventory management, and analytics"

// Max Mode - Research Project
"Develop and implement a novel machine learning algorithm for code generation"
```

**Configuration:**
```json
{
  "model": "claude-3-opus",
  "maxTokens": 16000,
  "temperature": 0.5,
  "autoApproval": true,
  "contextWindow": 100000
}
```

## 🎛️ Mode Selection Guidelines

### Decision Framework

Use this flowchart to select the appropriate mode:

```
Start
  ↓
Is this a quick fix or simple question?
  ↓ Yes
→ Lite Mode
  ↓ No
Is cost a primary concern?
  ↓ Yes
→ Economy Mode
  ↓ No
Is this a complex, multi-step task?
  ↓ Yes
→ Max Mode
  ↓ No
Is this a standard development task?
  ↓ Yes
→ Autonomous Mode
  ↓ No
→ Power Mode
```

### Task Complexity Matrix

| Complexity | Urgency | Budget | Recommended Mode |
|-------------|---------|--------|------------------|
| Low | High | Low | Lite |
| Low | Medium | Low | Economy |
| Medium | Medium | Medium | Autonomous |
| High | Low | High | Power |
| High | Low | Unlimited | Max |

## ⚙️ Mode Configuration

### Custom Mode Settings

You can customize modes for your specific needs:

```json
{
  "agentModes": {
    "custom-lite": {
      "model": "gpt-3.5-turbo",
      "maxTokens": 500,
      "temperature": 0.1,
      "autoApproval": false,
      "contextWindow": 2000,
      "description": "Ultra-fast for tiny fixes"
    },
    "custom-power": {
      "model": "claude-3-sonnet",
      "maxTokens": 12000,
      "temperature": 0.3,
      "autoApproval": true,
      "contextWindow": 50000,
      "description": "Enhanced capability mode"
    }
  }
}
```

### Mode Switching

You can change modes during task execution:

1. **Pause current task**
2. **Select new mode**
3. **Resume with new configuration**
4. **Agent adapts approach** based on new mode

## 📊 Performance Metrics

### Mode Performance Comparison

| Metric | Lite | Autonomous | Economy | Power | Max |
|--------|------|------------|---------|-------|-----|
| **Avg Response Time** | 2-5s | 10-30s | 15-45s | 30-60s | 2-5min |
| **Cost per 1K tokens** | $0.001 | $0.03 | $0.002 | $0.06 | $0.15 |
| **Success Rate** | 95% | 85% | 80% | 75% | 70% |
| **User Satisfaction** | 4.2/5 | 4.5/5 | 4.0/5 | 4.7/5 | 4.8/5 |

### Cost Optimization Tips

1. **Start with Lite/Economy** for simple tasks
2. **Upgrade to Power/Max** only when needed
3. **Use Autonomous** for most standard work
4. **Monitor token usage** in real-time
5. **Set cost limits** per project

## 🔄 Mode-Specific Workflows

### Lite Mode Workflow
1. **Quick assessment** - Agent rapidly evaluates task
2. **Immediate execution** - No planning phase
3. **Direct implementation** - Minimal steps
4. **Quick verification** - Basic checks only

### Autonomous Mode Workflow
1. **Task planning** - Break down into steps
2. **Sequential execution** - Step-by-step implementation
3. **Progress updates** - Regular status reports
4. **Quality checks** - Standard validation

### Economy Mode Workflow
1. **Cost analysis** - Evaluate resource needs
2. **Efficient planning** - Minimize expensive operations
3. **Optimized execution** - Use cost-effective approaches
4. **Budget tracking** - Monitor resource usage

### Power Mode Workflow
1. **Deep analysis** - Comprehensive problem understanding
2. **Strategic planning** - Multi-approach consideration
3. **Expert execution** - Advanced techniques
4. **Thorough validation** - Extensive testing

### Max Mode Workflow
1. **Research phase** - Explore options and best practices
2. **Architecture design** - Plan complete solution
3. **Implementation** - Full development cycle
4. **Testing & Deployment** - End-to-end verification

## 🎯 Best Practices

### Mode Selection Best Practices

1. **Start simple** - Begin with lower modes, upgrade if needed
2. **Match complexity** - Use mode appropriate to task difficulty
3. **Consider budget** - Factor in cost constraints
4. **Evaluate urgency** - Balance speed vs quality
5. **Monitor results** - Adjust based on outcomes

### Mode-Specific Tips

**Lite Mode:**
- Use for repetitive, well-defined tasks
- Keep instructions simple and specific
- Expect basic implementations

**Autonomous Mode:**
- Provide clear requirements and constraints
- Allow time for thoughtful execution
- Review progress regularly

**Economy Mode:**
- Focus on cost-effective solutions
- Avoid complex architectural decisions
- Use for learning and exploration

**Power Mode:**
- Provide detailed context and requirements
- Allow for comprehensive analysis
- Expect high-quality, robust solutions

**Max Mode:**
- Define complete project scope
- Provide ample context and constraints
- Expect production-ready implementations

## ⚠️ Common Pitfalls

### Mode Selection Mistakes

1. **Over-engineering** - Using Max mode for simple tasks
2. **Under-estimating** - Using Lite mode for complex problems
3. **Ignoring costs** - Running Power mode on budget constraints
4. **Mode switching too often** - Disrupting agent flow
5. **Not providing context** - Expecting good results with minimal input

### How to Avoid Pitfalls

1. **Assess task complexity** before selecting mode
2. **Set budget limits** for expensive modes
3. **Provide adequate context** for complex tasks
4. **Monitor progress** and adjust as needed
5. **Learn from experience** - refine mode selection over time

## 🔮 Future Enhancements

### Planned Mode Improvements

1. **Adaptive Mode Selection** - AI recommends optimal mode
2. **Dynamic Mode Switching** - Automatic mode changes during execution
3. **Custom Mode Creation** - User-defined mode configurations
4. **Performance Analytics** - Track mode effectiveness
5. **Cost Prediction** - Estimate costs before execution

### Advanced Features

1. **Mode Combinations** - Use multiple modes for complex tasks
2. **Team Mode Assignment** - Different agents use different modes
3. **Project-wide Mode Policies** - Consistent mode usage across projects
4. **Integration with CI/CD** - Mode selection based on pipeline stage

## 📚 Related Documentation

- [Task Board Guide](./task-board.md) - Using modes in task management
- [Skills Library](./skills-library.md) - Mode recommendations per skill
- [API Reference](./api.md) - Mode configuration interfaces
- [Development Guide](./development.md) - Custom mode development
