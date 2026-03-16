# ForgeAI Extension Migration Plan

## Overview

This document outlines the migration strategy for adapting Roo Code into ForgeAI Extension, routing LLM requests through the ForgeAI backend API while preserving all existing features.

## Architecture

### Current Roo Code Architecture

```
Extension UI (React Webview)
        │
        ▼
   VS Code Host
        │
        ▼
   Agent Logic (packages/core)
        │
        ▼
   LLM Provider (OpenAI, Anthropic, etc.)
```

### Target ForgeAI Architecture

```
Extension UI (React Webview) ← PRESERVED
        │
        ▼
   VS Code Host ← PRESERVED
        │
        ▼
   Agent Logic (packages/core) ← MODIFIED
        │
        ├─► Local Mode (existing) → Direct LLM calls
        │
        └─► Cloud Mode (new) → ForgeAI Backend
                                    │
                            ┌───────┼───────┐
                            │       │       │
                        Architect  Code   Debug
                         Agent     Agent   Agent
```

## Migration Phases

### Phase 1: Provider Integration ✅ COMPLETE

**Goal**: Add ForgeAI as a new provider type

| Task                       | Status | Files Modified                            |
| -------------------------- | ------ | ----------------------------------------- |
| Add ForgeAI provider type  | ✅     | `packages/types/src/providers/forgeai.ts` |
| Register in provider index | ✅     | `packages/types/src/providers/index.ts`   |
| Add to provider names      | ✅     | `packages/types/src/provider-settings.ts` |
| Create backend client      | ✅     | `packages/core/src/forgeai-client.ts`     |

### Phase 2: API Handler Implementation

**Goal**: Create ForgeAI API handler that routes requests to backend

**Files to Create/Modify:**

1. **`packages/core/src/api/forgeai-handler.ts`** (new)

    - Implements the same interface as existing API handlers
    - Routes chat requests to ForgeAI backend
    - Handles task execution responses
    - Manages checkpoint/rollback operations

2. **`packages/core/src/api/index.ts`** (modify)

    - Add ForgeAI handler to the API factory
    - Route based on provider setting

3. **`packages/types/src/provider-settings.ts`** (modify)
    - Add ForgeAI-specific settings schema:
        ```typescript
        forgeaiBaseUrl?: string
        forgeaiApiKey?: string
        forgeaiMode?: "architect" | "code" | "debug" | "deploy"
        ```

### Phase 3: Mode Mapping

**Goal**: Map Roo Code modes to ForgeAI backend agents

| Roo Code Mode | ForgeAI Agent        | Tool Permissions                |
| ------------- | -------------------- | ------------------------------- |
| Architect     | forgeai-architect    | read, mcp, edit (markdown only) |
| Code          | forgeai-code         | read, edit, command, mcp        |
| Ask           | forgeai-architect    | read, mcp                       |
| Debug         | forgeai-debug        | read, edit, command, mcp        |
| Orchestrator  | forgeai-orchestrator | new_task only                   |

**Implementation:**

- Modify `packages/types/src/mode.ts` to support mode-to-provider mapping
- Add `preferredProvider` field to mode config
- Route mode selection to appropriate ForgeAI model

### Phase 4: File Operation Integration

**Goal**: Connect Roo Code file tools to ForgeAI backend

**Current Roo Code Tools:**

- `read_file` → Direct filesystem access
- `write_to_file` → Direct filesystem access
- `execute_command` → Direct terminal access
- `list_files` → Direct filesystem access

**ForgeAI Integration:**

- Keep local tools for "Local Mode"
- Add cloud tools that route through backend API:
    - `forgeai_read_file` → POST `/api/v1/files/execute`
    - `forgeai_write_file` → POST `/api/v1/files/execute`
    - `forgeai_execute_command` → Handled by backend agent

**Files to Modify:**

- `packages/core/src/tools/index.ts` - Register ForgeAI tools
- `packages/types/src/tool.ts` - Add ForgeAI tool definitions

### Phase 5: Checkpoint Integration

**Goal**: Use ForgeAI Shadow Git system

**Current Roo Code:**

- Local git checkpointing
- Diff viewer UI
- Rollback functionality

**ForgeAI Integration:**

- Route checkpoint creation to backend
- Display backend checkpoint info in UI
- Rollback via backend API

**Files to Modify:**

- `packages/core/src/checkpoint/index.ts` - Add ForgeAI checkpoint provider
- `webview-ui/src/components/CheckpointView.tsx` - Display backend checkpoints

### Phase 6: WebSocket Streaming

**Goal**: Real-time streaming from backend agents

**Implementation:**

1. Create WebSocket connection manager in `forgeai-client.ts` ✅
2. Modify message handler to use WebSocket when available
3. Add connection status indicator to UI
4. Handle reconnection gracefully

**Files to Modify:**

- `packages/core/src/api/forgeai-handler.ts` - WebSocket integration
- `webview-ui/src/components/ChatView.tsx` - Streaming UI updates

### Phase 7: Settings UI

**Goal**: Add ForgeAI configuration to settings panel

**New Settings Fields:**

```
ForgeAI Configuration
├── Backend URL: [http://localhost:8000]
├── API Key: [********************]
├── Default Mode: [Architect ▼]
└── Connection Status: ● Connected
```

**Files to Modify:**

- `webview-ui/src/components/SettingsView.tsx`
- `packages/types/src/global-settings.ts`

## File Changes Summary

### New Files

```
packages/types/src/providers/forgeai.ts        ✅ Created
packages/core/src/forgeai-client.ts            ✅ Created
packages/core/src/api/forgeai-handler.ts       📝 Pending
packages/core/src/tools/forgeai-tools.ts       📝 Pending
```

### Modified Files

```
packages/types/src/providers/index.ts          ✅ Modified
packages/types/src/provider-settings.ts        ✅ Modified
packages/core/src/index.ts                     ✅ Modified
packages/types/src/mode.ts                     📝 Pending
packages/core/src/api/index.ts                 📝 Pending
packages/core/src/tools/index.ts               📝 Pending
webview-ui/src/components/SettingsView.tsx     📝 Pending
```

## Testing Plan

### Unit Tests

1. ForgeAI client HTTP methods
2. Provider routing logic
3. Mode-to-agent mapping

### Integration Tests

1. Chat flow: UI → Backend → Response
2. Task execution: Plan → Execute → Files created
3. Checkpoint: Create → Verify → Rollback

### E2E Tests

1. Full workflow: Prompt → Plan → Execute → Verify files
2. Mode switching: Architect → Code → Debug
3. Error handling: Backend offline, API errors

## Rollback Plan

If issues arise:

1. **Revert provider changes** - Remove forgeai from providerNames
2. **Fallback to local mode** - All existing functionality preserved
3. **Feature flag** - Add `enableForgeAI` setting for gradual rollout

## Timeline Estimate

| Phase   | Duration    | Dependencies |
| ------- | ----------- | ------------ |
| Phase 1 | ✅ Complete | None         |
| Phase 2 | 2-3 days    | Phase 1      |
| Phase 3 | 1-2 days    | Phase 2      |
| Phase 4 | 2-3 days    | Phase 2      |
| Phase 5 | 1-2 days    | Phase 4      |
| Phase 6 | 2-3 days    | Phase 2      |
| Phase 7 | 1-2 days    | Phase 6      |
| Testing | 2-3 days    | All phases   |

**Total: 11-18 days**

## Next Steps

1. Run `pnpm install` in ForgeAI-Extension to resolve dependencies
2. Implement Phase 2: API Handler
3. Add settings UI for ForgeAI configuration
4. Test with running ForgeAI backend
