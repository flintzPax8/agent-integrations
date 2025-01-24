import { JiraService } from '../services/jira.service';
import fs from 'fs';

type JiraIssueType = 'Story' | 'Task' | 'Bug' | 'Epic';

interface CreateTicketConfig {
  projectKey: string;
  summary: string;
  description?: string;
  epicKey?: string;
  issueType?: JiraIssueType;
}

export class JiraCommandHandler {
  private jiraService: JiraService;

  constructor() {
    this.jiraService = new JiraService();
  }

  async handleCommand(command: string | string[]): Promise<string> {
    // Handle create command with JSON config
    if (Array.isArray(command) && command[0] === 'create' && command[1] === '--json') {
      const jsonPath = command[2];
      if (!jsonPath) {
        return 'Please provide a JSON file path: create --json <path>';
      }

      try {
        const config = this.readJsonConfig(jsonPath);
        const ticket = await this.jiraService.createTicket(config);
        return ticket.key
          ? `Created ticket ${ticket.key}${ticket.fields?.summary ? `: ${ticket.fields.summary}` : ''}`
          : `Created ticket successfully`;
      } catch (error: any) {
        return `Failed to create ticket: ${error.message}`;
      }
    }

    // Handle string commands
    const cmdStr = Array.isArray(command) ? command.join(' ') : command;

    // Command: TICKET-123 (short format)
    // Command: ticket TICKET-123 (medium format)
    // Command: fetch ticket TICKET-123 (long format)
    if (cmdStr.match(/^(?:(?:fetch )?ticket )?([A-Z]+-\d+)/i)) {
      const ticketId = cmdStr.match(/^(?:(?:fetch )?ticket )?([A-Z]+-\d+)/i)![1];
      const ticket = await this.jiraService.getTicketById(ticketId);
      return this.formatTicketResponse(ticket);
    }

    // Command: search "search text" or search text without quotes
    if (cmdStr.startsWith('search ')) {
      const searchText = cmdStr.slice(7).replace(/^"(.*)"$/, '$1'); // Remove quotes if present
      const tickets = await this.jiraService.searchTickets({ searchText });
      return this.formatTicketsResponse(tickets);
    }

    // Command: sprint PROJECT-KEY
    // Command: sprint PROJECT-KEY assignee "John Doe"
    // Command: sprint PROJECT-KEY assignee John Doe
    const sprintRegex = /^sprint ([A-Z]+)(?:\s+assignee\s+(?:"([^"]+)"|([^\s]+(?:\s+[^\s]+)*)))?$/i;
    if (cmdStr.match(sprintRegex)) {
      const [, projectKey, quotedAssignee, unquotedAssignee] = cmdStr.match(sprintRegex)!;
      const assignee = quotedAssignee || unquotedAssignee;
      const tickets = await this.jiraService.getCurrentSprint(projectKey, assignee);
      return this.formatTicketsResponse(tickets);
    }

    // Command: sprint tickets PROJECT-KEY SPRINT-ID
    if (cmdStr.match(/^sprint tickets ([A-Z]+) (\d+)/i)) {
      const [, projectKey, sprintId] = cmdStr.match(/^sprint tickets ([A-Z]+) (\d+)/i)!;
      const tickets = await this.jiraService.getSprintTickets(projectKey, sprintId);
      return this.formatTicketsResponse(tickets);
    }

    return (
      'Invalid command. Available commands:\n' +
      'TICKET-123\n' +
      'ticket TICKET-123\n' +
      'fetch ticket TICKET-123\n' +
      'search text or search "text with spaces"\n' +
      'sprint PROJECT-KEY (current sprint)\n' +
      'sprint PROJECT-KEY assignee John Doe (current sprint by assignee)\n' +
      'sprint tickets PROJECT-KEY SPRINT-ID\n' +
      'create --json <path>'
    );
  }

  private readJsonConfig(path: string): CreateTicketConfig {
    try {
      if (path === '-') {
        // Read from stdin
        const stdin = fs.readFileSync(0, 'utf-8');
        return JSON.parse(stdin);
      }

      const content = fs.readFileSync(path, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      throw new Error(`Failed to read config: ${error.message}`);
    }
  }

  private formatTicketResponse(ticket: any): string {
    let response =
      `🎫 ${ticket.key}: ${ticket.fields.summary}\n` +
      `Status: ${ticket.fields.status.name}\n` +
      `Type: ${ticket.fields.issuetype.name}\n` +
      `Priority: ${ticket.fields.priority.name}\n` +
      `Assignee: ${ticket.fields.assignee?.displayName || 'Unassigned'}\n` +
      `Description: ${ticket.fields.description || 'No description'}\n`;

    if (ticket.fields.subtasks && ticket.fields.subtasks.length > 0) {
      response +=
        '\nSubtasks:\n' +
        ticket.fields.subtasks
          .map(
            (subtask: any) =>
              `- ${subtask.key}: ${subtask.fields.summary} (${subtask.fields.status.name})`
          )
          .join('\n');
    }

    return response;
  }

  private formatTicketsResponse(tickets: any[]): string {
    if (tickets.length === 0) {
      return 'No tickets found.';
    }

    let response = '';

    // Get sprint name from the first ticket if available
    if (tickets[0]?.fields?.sprint) {
      response += `Sprint: ${tickets[0].fields.sprint.name}\n\n`;
    }

    response += tickets
      .map(ticket => `🎫 ${ticket.key}: ${ticket.fields.summary} (${ticket.fields.status.name})`)
      .join('\n');

    return response;
  }
}
