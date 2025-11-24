#!/bin/bash
# Deploy Claude Code workflows to a repository
# Usage: ./deploy-to-repo.sh /path/to/your/repo

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 /path/to/repository"
    echo "Example: $0 ~/projects/my-repo"
    exit 1
fi

REPO_PATH="$1"
TEMPLATE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Check if repository exists
if [ ! -d "$REPO_PATH" ]; then
    echo "❌ Error: Repository path does not exist: $REPO_PATH"
    exit 1
fi

# Check if it's a git repository
if [ ! -d "$REPO_PATH/.git" ]; then
    echo "❌ Error: Not a git repository: $REPO_PATH"
    exit 1
fi

echo "📦 Deploying Claude Code workflows to: $REPO_PATH"
echo ""

# Create .github directories if they don't exist
mkdir -p "$REPO_PATH/.github/workflows"

# Copy workflow files
echo "✅ Copying workflow files..."
cp "$TEMPLATE_DIR/.github/workflows/claude-fix.yml" "$REPO_PATH/.github/workflows/"
cp "$TEMPLATE_DIR/.github/workflows/claude-review.yml" "$REPO_PATH/.github/workflows/"

# Copy prompt templates
echo "✅ Copying prompt templates..."
cp "$TEMPLATE_DIR/.github/issue_fix_prompt.md" "$REPO_PATH/.github/"
cp "$TEMPLATE_DIR/.github/pr_review_prompt.md" "$REPO_PATH/.github/"
cp "$TEMPLATE_DIR/.github/pull_request_template.md" "$REPO_PATH/.github/"

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add GitHub secret 'CLAUDE_CODE_OAUTH_TOKEN' to your repository"
echo "   https://github.com/jnalv414/YOUR_REPO/settings/secrets/actions"
echo ""
echo "2. Commit and push the workflow files:"
echo "   cd $REPO_PATH"
echo "   git add .github/"
echo "   git commit -m 'Add Claude Code workflows'"
echo "   git push"
echo ""
echo "3. Use @claude-review or @claude-fix in issues/PRs!"
