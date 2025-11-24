#!/bin/bash
# Add CLAUDE_CODE_OAUTH_TOKEN to multiple repositories
# Usage: ./setup-secrets.sh repo1 repo2 repo3

set -e

CLAUDE_TOKEN="${CLAUDE_TOKEN:-}"
GITHUB_USER="jnalv414"

if [ -z "$CLAUDE_TOKEN" ]; then
    echo "❌ Error: CLAUDE_TOKEN environment variable not set"
    echo "Usage: export CLAUDE_TOKEN='your_token' && ./setup-secrets.sh repo1 repo2"
    exit 1
fi

if [ $# -eq 0 ]; then
    echo "Usage: $0 repo1 repo2 repo3 ..."
    echo "Example: $0 my-app my-website my-tool"
    echo ""
    echo "This will add CLAUDE_CODE_OAUTH_TOKEN to:"
    echo "  - jnalv414/repo1"
    echo "  - jnalv414/repo2"
    echo "  - etc."
    exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ Error: GitHub CLI (gh) is not installed"
    echo "Install it with: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Error: Not authenticated with GitHub CLI"
    echo "Run: gh auth login"
    exit 1
fi

echo "🔐 Adding CLAUDE_CODE_OAUTH_TOKEN to repositories..."
echo ""

for repo in "$@"; do
    FULL_REPO="$GITHUB_USER/$repo"
    echo "📦 Processing: $FULL_REPO"

    if gh secret set CLAUDE_CODE_OAUTH_TOKEN --body "$CLAUDE_TOKEN" --repo "$FULL_REPO" 2>/dev/null; then
        echo "   ✅ Secret added successfully"
    else
        echo "   ❌ Failed (check if repo exists or you have access)"
    fi
    echo ""
done

echo "🎉 Done! Secrets added to ${#@} repositories"
echo ""
echo "📋 Next steps:"
echo "1. Deploy workflows with: ./deploy-to-repo.sh /path/to/repo"
echo "2. Commit and push the workflow files"
echo "3. Use @claude-review or @claude-fix in issues/PRs"
