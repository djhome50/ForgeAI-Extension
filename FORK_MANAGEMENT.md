# Git Fork Management Strategy

## Remote Configuration

The repository is configured with two remotes:

```bash
git remote -v
# origin    https://github.com/YOUR_USERNAME/ForgeAI-Extension.git (push)
# upstream  https://github.com/RooCodeInc/Roo-Code.git (fetch)
```

## Branch Strategy

```
upstream/main        ← Original Roo Code (read-only)
      │
      ▼
forgeai-main         ← Our main development branch
      │
      ├── forgeai-provider    ← ForgeAI provider integration
      ├── forgeai-settings   ← Settings UI changes
      └── forgeai-tools      ← Custom tools
```

## Workflow

### 1. Syncing Upstream Changes

```bash
# Fetch latest from Roo Code
git fetch upstream

# Merge into our branch
git checkout forgeai-main
git merge upstream/main

# Resolve conflicts, preferring our changes for ForgeAI-specific files
```

### 2. Daily Development

```bash
# Create feature branch from forgeai-main
git checkout forgeai-main
git checkout -b forgeai-feature-name

# Make changes and commit
git add .
git commit -m "feat: add ForgeAI feature"

# Push to your fork
git push origin forgeai-feature-name
```

### 3. Keeping Changes Isolated

**Files we modify (safe to merge):**

- `packages/types/src/providers/forgeai.ts` (new file)
- `packages/core/src/forgeai-client.ts` (new file)
- `packages/types/src/provider-settings.ts` (additions only)
- `packages/types/src/providers/index.ts` (additions only)

**Files that may conflict:**

- `packages/types/src/mode.ts` - Mode definitions
- `packages/core/src/api/index.ts` - API handler factory

**Strategy for conflicting files:**

1. Keep our changes in a separate section with clear comments
2. Use `git merge -X ours` for ForgeAI-specific conflicts
3. Document all modifications in this file

### 4. Releasing Updates

```bash
# Tag releases
git tag -a v0.1.0-forgeai -m "ForgeAI Extension v0.1.0"
git push origin v0.1.0-forgeai
```

## Conflict Resolution Guide

### When upstream adds a new provider:

1. Accept their changes
2. Re-add `forgeai` to the provider list
3. Re-export in `providers/index.ts`

### When upstream modifies mode system:

1. Review their changes carefully
2. Merge mode definitions
3. Re-add ForgeAI mode mappings if needed

### When upstream updates dependencies:

1. Accept their `package.json` changes
2. Run `pnpm install`
3. Verify ForgeAI client still works

## Files Never Modified

These files remain pristine from upstream:

- `webview-ui/` - UI components (use settings injection)
- `packages/vscode-shim/` - VS Code abstraction
- `packages/telemetry/` - Analytics
- `.github/` - GitHub workflows

## Attribution

As per Apache 2.0 license, maintain original copyright notices:

```
Copyright 2025 Roo Code, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
```

Add ForgeAI attribution in modified files:

```
Modified by ForgeAI Team, 2024-2025
Original: https://github.com/RooCodeInc/Roo-Code
```

## Quick Reference

| Action                   | Command                                           |
| ------------------------ | ------------------------------------------------- |
| Sync upstream            | `git fetch upstream && git merge upstream/main`   |
| Push to fork             | `git push origin forgeai-main`                    |
| View differences         | `git diff upstream/main forgeai-main`             |
| Cherry-pick upstream fix | `git cherry-pick <commit-hash>`                   |
| Reset to upstream        | `git reset --hard upstream/main` (⚠️ destructive) |
