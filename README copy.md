# Claude Code Workflows - Global Template

This template allows you to easily deploy Claude Code GitHub Actions to any repository.

## 🎯 What This Includes

- **claude-fix.yml** - Auto-fix issues with write access
- **claude-review.yml** - Code reviews with read-only access
- **Prompt templates** - Customizable instructions for Claude

## 🚀 Quick Deploy to Any Repo

### Option 1: Using the Deploy Script

```bash
# Deploy to a specific repository
cd ~/.claude/github-workflow-template
./deploy-to-repo.sh /path/to/your/repo
```

### Option 2: Manual Copy

```bash
# Copy workflows to your repo
cp -r ~/.claude/github-workflow-template/.github /path/to/your/repo/
```

## 🔐 Setting Up Secrets

### For a Single Repository

1. Go to: `https://github.com/jnalv414/YOUR_REPO/settings/secrets/actions`
2. Add secret: `CLAUDE_CODE_OAUTH_TOKEN`
3. Paste your token value

### For All Repositories (Organization)

If you have a GitHub Organization:

1. Go to: `https://github.com/organizations/YOUR_ORG/settings/secrets/actions`
2. Add organization secret: `CLAUDE_CODE_OAUTH_TOKEN`
3. Select "All repositories" or choose specific ones
4. All repos can now use the same token

### Using GitHub CLI (Automated)

Add the secret to multiple repos at once:

```bash
# Set your token as an environment variable
export CLAUDE_TOKEN="sk-ant-oat01-..."

# Add to multiple repos
gh secret set CLAUDE_CODE_OAUTH_TOKEN --body "$CLAUDE_TOKEN" --repo jnalv414/repo1
gh secret set CLAUDE_CODE_OAUTH_TOKEN --body "$CLAUDE_TOKEN" --repo jnalv414/repo2
gh secret set CLAUDE_CODE_OAUTH_TOKEN --body "$CLAUDE_TOKEN" --repo jnalv414/repo3
```

## 📝 Usage

Once deployed to a repository:

**For Code Reviews:**
Comment `@claude-review` on any issue or PR

**For Fixes:**
Comment `@claude-fix` on any issue or PR

## ⚙️ Customization

### Change Authorized Users

Edit both workflow files and update line 18:

```yaml
contains(fromJSON('["jnalv414","other-user"]'), github.event.comment.user.login)
```

### Customize Prompts

Edit these files in your repo's `.github/` directory:
- `issue_fix_prompt.md` - Instructions for fixes
- `pr_review_prompt.md` - Instructions for reviews

## 📦 Repositories Using This Template

Keep track of where you've deployed:

- [ ] obsidian-ai-agent
- [ ] your-repo-2
- [ ] your-repo-3

## 🔄 Updating All Repos

When you update the template, redeploy to all repos:

```bash
for repo in repo1 repo2 repo3; do
  ./deploy-to-repo.sh ~/projects/$repo
  cd ~/projects/$repo
  git add .github/
  git commit -m "Update Claude workflows"
  git push
done
```
