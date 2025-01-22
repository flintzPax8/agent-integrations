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

## Usage

You can run Jira commands directly from the command line using either:
```bash
npm run jira "/jira TICKET-123"
# or
npm start "/jira TICKET-123"
```

### Available Commands

1. Fetch a specific ticket (multiple formats supported):
   ```bash
   npm run jira "/jira TICKET-123"
   npm run jira "/jira fetch TICKET-123"
   npm run jira "/jira fetch ticket TICKET-123"
   ```

2. Search for tickets:
   ```bash
   npm run jira '/jira search "search text"'
   ```

3. Get tickets from a sprint:
   ```bash
   npm run jira "/jira sprint tickets PROJECT-KEY SPRINT-ID"
   ```

Note: When using commands with spaces or special characters, make sure to properly quote them:
```bash
# Good ✅
npm run jira '/jira search "my search term"'

# Bad ❌
npm run jira /jira search "my search term"
```

## Development

The integration is built with TypeScript and uses the following structure:

- `src/types/` - Type definitions
- `src/services/` - Core services (Jira API interaction)
- `src/handlers/` - Command handlers

### Project Structure
```
agent-integrations/
├── src/
│   ├── types/
│   │   └── jira.types.ts    # Type definitions
│   ├── services/
│   │   └── jira.service.ts  # Jira API service
│   ├── handlers/
│   │   └── jira.handler.ts  # Command handling
│   └── index.ts            # Entry point
├── .env                    # Configuration
├── .gitignore             # Git ignore patterns
└── package.json           # Dependencies
```

To build:
```bash
npm run build
```

To test:
```bash
npm test
```

## Security Notes
- Never commit your `.env` file or expose your API token
- The API token has the same permissions as your user account
- Rotate your API token periodically for better security
- Consider setting up IP allowlisting in Atlassian security settings
