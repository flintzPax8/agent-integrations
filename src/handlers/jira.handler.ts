import { JiraService } from '../services/jira.service';

export class JiraCommandHandler {
  private jiraService: JiraService;

  constructor() {
    this.jiraService = new JiraService();
  }

  async handleCommand(command: string): Promise<string> {
    // Command: TICKET-123 (short format)
    // Command: ticket TICKET-123 (medium format)
    // Command: fetch ticket TICKET-123 (long format)
    if (command.match(/^(?:(?:fetch )?ticket )?([A-Z]+-\d+)/i)) {
      const ticketId = command.match(/^(?:(?:fetch )?ticket )?([A-Z]+-\d+)/i)![1];
      const ticket = await this.jiraService.getTicketById(ticketId);
      return this.formatTicketResponse(ticket);
    }

    // Command: search "search text" or search text without quotes
    if (command.startsWith('search ')) {
      const searchText = command.slice(7).replace(/^"(.*)"$/, '$1'); // Remove quotes if present
      const tickets = await this.jiraService.searchTickets({ searchText });
      return this.formatTicketsResponse(tickets);
    }

    // Command: sprint PROJECT-KEY
    // Command: sprint PROJECT-KEY assignee "John Doe"
    // Command: sprint PROJECT-KEY assignee John Doe
    const sprintRegex = /^sprint ([A-Z]+)(?:\s+assignee\s+(?:"([^"]+)"|([^\s]+(?:\s+[^\s]+)*)))?$/i;
    if (command.match(sprintRegex)) {
      const [, projectKey, quotedAssignee, unquotedAssignee] = command.match(sprintRegex)!;
      const assignee = quotedAssignee || unquotedAssignee;
      const tickets = await this.jiraService.getCurrentSprint(projectKey, assignee);
      return this.formatTicketsResponse(tickets);
    }

    // Command: sprint tickets PROJECT-KEY SPRINT-ID
    if (command.match(/^sprint tickets ([A-Z]+) (\d+)/i)) {
      const [, projectKey, sprintId] = command.match(/^sprint tickets ([A-Z]+) (\d+)/i)!;
      const tickets = await this.jiraService.getSprintTickets(projectKey, sprintId);
      return this.formatTicketsResponse(tickets);
    }

    // Command: create PROJECT-KEY "Title" "Description" [EPIC-KEY] [--type TYPE]
    const createRegex =
      /^create ([A-Z]+) "([^"]+)"(?:\s+"([^"]+)")?(?:\s+([A-Z]+-\d+))?(?:\s+--type\s+([^\s]+))?$/i;
    if (command.match(createRegex)) {
      const [, projectKey, summary, description, epicKey, issueType] = command.match(createRegex)!;
      const ticket = await this.jiraService.createTicket({
        projectKey,
        summary,
        description,
        epicKey,
        issueType,
      });
      return `Created ticket ${ticket.key}: ${ticket.fields.summary}`;
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
      'create PROJECT-KEY "Title" "Description" [EPIC-KEY] [--type TYPE]'
    );
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
