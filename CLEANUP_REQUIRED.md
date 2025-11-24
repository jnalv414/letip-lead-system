# Manual Cleanup Required

## Files Requiring Manual Deletion

Due to file permissions, the following directories and files need to be manually removed:

### 1. Telegram Module (BLOCKING BUILD)

**Location:** `App/BackEnd/src/telegram/`

**Files to delete:**
```bash
rm -rf App/BackEnd/src/telegram/telegram.module.ts
rm -rf App/BackEnd/src/telegram/telegram.service.ts
rm -rf App/BackEnd/src/telegram/
```

**Why:** These files reference `getTelegramBotToken()` method that was removed from ConfigService, causing build errors.

**Status:** ❌ CRITICAL - Prevents backend from building

---

### 2. Old Dashboard Directories

**Location:** Root directory

**Directories to delete:**
```bash
rm -rf dashboard/
rm -rf dashboard.old/
```

**Why:** These are leftover directories after restructuring to App/FrontEnd/

**Status:** ⚠️ Non-critical - Just filesystem clutter

---

### 3. Node Modules Cleanup

**Optional:** Remove old Telegram dependencies from node_modules

```bash
cd App/BackEnd
rm -rf node_modules/node-telegram-bot-api
rm -rf node_modules/@types/node-telegram-bot-api
yarn install  # Reinstall to clean up
```

---

## Verification Commands

After manual cleanup, verify:

```bash
# 1. Backend builds successfully
cd App/BackEnd
yarn build

# 2. No telegram references remain
cd ../..
grep -r "telegram" App/BackEnd/src --exclude-dir=node_modules

# 3. No abacus references remain
grep -r "abacus" App/BackEnd/src --exclude-dir=node_modules
```

---

## What Was Completed

✅ Removed Telegram module imports from `app.module.ts`
✅ Removed `getTelegramBotToken()` from `config.service.ts`
✅ Removed `node-telegram-bot-api` from `package.json`
✅ Removed `@types/node-telegram-bot-api` from `package.json`
✅ Removed all Telegram references from CLAUDE.md files
✅ Removed all Abacus.AI code from `outreach.service.ts`
✅ Removed `getAbacusAIApiKey()` from `config.service.ts`
✅ Updated secrets file path from `abacusai_auth_secrets.json` to `letip_api_secrets.json`
✅ Removed Abacus.AI references from all documentation
✅ Updated outreach service to use template-only approach

---

## Current Status

- **Code Changes:** Complete
- **Documentation:** Updated
- **Build Status:** ❌ Fails (requires telegram module deletion)
- **Manual Action:** Required to delete telegram source files
