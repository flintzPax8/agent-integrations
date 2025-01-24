import { JiraCommandHandler } from './handlers/jira.handler';

async function main(args: string[]) {
  const handler = new JiraCommandHandler();

  if (args.length === 0) {
    console.error('Please provide a Jira command. Example: ticket QUOTE-123');
    process.exit(1);
  }

  try {
    const command = args.join(' ');
    const result = await handler.handleCommand(command);
    console.log(result);
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// Node.js passes script name and path as first two args, so slice them off
main(process.argv.slice(2));
