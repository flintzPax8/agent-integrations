# Jira Integration for Cursor

This integration allows you to interact with Jira directly from Cursor using simple commands.

## Setup

### 1. Jira API Token Setup
1. Log in to your Atlassian account at https://id.atlassian.com/manage-profile/security
2. Under "Security" navigate to "API tokens"
3. Click "Create API token"
4. Give it a meaningful label (e.g., "Cursor Integration")
5. Copy the generated token (you won't be able to see it again!)

### 2. Environment Configuration
1. Copy `.env.example` to `.env` and fill in your Jira credentials:
   ```
   JIRA_PROTOCOL=https
   JIRA_HOST=your-domain.atlassian.net  # e.g., pax8.atlassian.net
   JIRA_USERNAME=your-email@company.com  # Your Atlassian account email
   JIRA_API_TOKEN=your-api-token        # The token generated in step 1
   ```

2. Verify `.gitignore`:
   The project includes a `.gitignore` file to prevent sensitive information from being committed. Make sure the following files are listed:
   - `.env` (contains your API token)
   - `node_modules/` (dependencies)
   - `dist/` (build output)
   - Various IDE and log files

### 3. Project Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

### 4. Cursor Custom Command Setup (Optional)
To use the `/jira` shorthand command in Cursor, add the following to your `cursor.settings.json` or `cursor.config.json`:

```json
{
  "commands": {
    "/jira": {
      "description": "Jira Integrator",
      "script": "cd PATH_TO_REPO/agent-integrations && npm run jira $*",
      "type": "terminal",
      "autoRun": true,
      "requireApproval": false,
      "safe": true,
      "shell": "/bin/bash",
      "examples": [
        "/jira TICKET-123",
        "/jira search \"search text\"",
        "/jira sprint PROJECT-KEY",
        "/jira create PROJECT-KEY \"Title\" \"Description\" [EPIC-KEY] [--type TYPE]"
      ]
    }
  }
}
```

Replace `PATH_TO_REPO` with the absolute path to where you cloned this repository (e.g., `~/Development` or `/Users/username/Development`).

Note: After adding the command, you may need to restart Cursor for the changes to take effect.

## Usage

There are two ways to use this integration:

### A. Using Cursor Custom Command (Recommended)
If you have this configured as a Cursor custom command, you can use the shorthand:
```bash
/jira COMMAND
```

### B. Using as Standalone NPM Package
If you're using this as a standalone package, prefix commands with `npm run jira`:
```bash
npm run jira "COMMAND"
```

### Available Commands

1. Fetch a specific ticket (multiple formats supported):
   ```bash
   # Cursor Command
   /jira TICKET-123
   /jira ticket TICKET-123
   /jira fetch ticket TICKET-123

   # Standalone NPM
   npm run jira "TICKET-123"
   npm run jira "ticket TICKET-123"
   npm run jira "fetch ticket TICKET-123"
   ```

2. Search for tickets:
   ```bash
   # Cursor Command
   /jira search "search text"

   # Standalone NPM
   npm run jira 'search "search text"'
   ```

3. Get tickets from current sprint:
   ```bash
   # Cursor Command
   /jira sprint PROJECT-KEY                           # All tickets in current sprint
   /jira sprint PROJECT-KEY assignee "John Doe"       # Current sprint tickets for assignee

   # Standalone NPM
   npm run jira "sprint PROJECT-KEY"
   npm run jira 'sprint PROJECT-KEY assignee "John Doe"'
   ```

4. Get tickets from a specific sprint:
   ```bash
   # Cursor Command
   /jira sprint tickets PROJECT-KEY SPRINT-ID

   # Standalone NPM
   npm run jira "sprint tickets PROJECT-KEY SPRINT-ID"
   ```

5. Create new tickets:
   ```bash
   # Create a ticket using JSON configuration
   # Cursor Command
   /jira create -- create --json ticket.json # Using a JSON config file

   # Standalone NPM
   npm run jira -- create --json ticket.json
   ```

   Example ticket.json structure:
   ```json
   {
     "project": "PROJECT-KEY",
     "title": "Ticket Title",
     "description": "Detailed ticket description",
     "epic": "EPIC-123",           # Optional: Link to epic
     "type": "Story"               # Optional: Issue type (defaults to Story)
   }
   ```

   Available issue types (must match your Jira configuration):
   - Story (default)
   - Bug
   - Task
   - Epic
   - Subtask

Note: When using commands with spaces or special characters in your JSON file, make sure they are properly escaped according to JSON standards.

## Development

The integration is built with TypeScript and uses the following structure:

- `src/types/` - Type definitions
- `src/services/` - Core services (Jira API interaction)
- `src/handlers/` - Command handlers


## Security Notes
- Never commit your `.env` file or expose your API token
- The API token has the same permissions as your user account
- Rotate your API token periodically for better security
- Consider setting up IP allowlisting in Atlassian security settings
