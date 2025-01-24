import JiraClient from 'jira-client';
import { JiraConfig, JiraTicketSearchParams, JiraTicketResponse } from '../types/jira.types';
import dotenv from 'dotenv';

dotenv.config();

export class JiraService {
  private client: JiraClient;

  constructor(config?: JiraConfig) {
    this.client = new JiraClient({
      protocol: config?.protocol || process.env.JIRA_PROTOCOL || 'https',
      host: config?.host || process.env.JIRA_HOST || '',
      username: config?.username || process.env.JIRA_USERNAME || '',
      password: config?.password || process.env.JIRA_API_TOKEN || '',
      apiVersion: config?.apiVersion || '2',
      strictSSL: config?.strictSSL || true
    });
  }

  async getTicketById(ticketId: string): Promise<JiraTicketResponse> {
    try {
      const response = await this.client.findIssue(ticketId, 'subtasks,*all');
      return response as unknown as JiraTicketResponse;
    } catch (error: any) {
      throw new Error(`Failed to fetch ticket ${ticketId}: ${error.message}`);
    }
  }

  async searchTickets(params: JiraTicketSearchParams): Promise<JiraTicketResponse[]> {
    try {
      let jql: string;

      // Check if it's a project-specific search
      if (params.searchText?.toLowerCase().startsWith('project=')) {
        const [projectPart, ...searchTerms] = params.searchText.split(' ');
        const searchText = searchTerms.join(' ');
        jql = `${projectPart} AND (summary ~ "${searchText}" OR description ~ "${searchText}" OR "Epic Name" ~ "${searchText}")`;
      }
      // If the search text starts with 'project =', treat it as a direct JQL query
      else if (params.searchText?.toLowerCase().startsWith('project =')) {
        jql = params.searchText;
      } else {
        const jqlParts: string[] = [];
        
        if (params.projectKey) {
          jqlParts.push(`project = ${params.projectKey}`);
        }
        
        if (params.sprintId) {
          jqlParts.push(`sprint = ${params.sprintId}`);
        }
        
        if (params.searchText) {
          jqlParts.push(`(summary ~ "${params.searchText}" OR description ~ "${params.searchText}" OR "Epic Name" ~ "${params.searchText}")`);
        }

        if (params.jql) {
          jqlParts.length = 0; // Clear existing parts
          jqlParts.push(params.jql);
        }

        jql = jqlParts.join(' AND ');
      }

      console.log('JQL Query:', jql); // Debug log

      const response = await this.client.searchJira(jql || 'order by created DESC', {
        maxResults: params.maxResults || 50
      });

      return response.issues as unknown as JiraTicketResponse[];
    } catch (error: any) {
      throw new Error(`Failed to search tickets: ${error.message}`);
    }
  }

  async getSprintTickets(projectKey: string, sprintId: string): Promise<JiraTicketResponse[]> {
    return this.searchTickets({
      projectKey,
      sprintId,
      maxResults: 100
    });
  }

  async getCurrentSprint(projectKey: string, assignee?: string): Promise<JiraTicketResponse[]> {
    let jql = `project = ${projectKey} AND sprint in openSprints()`;
    if (assignee) {
      jql += ` AND assignee = "${assignee}"`;
    }
    const response = await this.client.searchJira(jql, {
      maxResults: 50,
      fields: ['summary', 'status', 'sprint', 'issuetype', 'priority', 'assignee', 'description']
    });
    return response.issues as unknown as JiraTicketResponse[];
  }

  async createTicket(params: {
    projectKey: string;
    summary: string;
    description?: string;
    epicKey?: string;
    issueType?: string;
  }): Promise<JiraTicketResponse> {
    try {
      const issueData = {
        fields: {
          project: { key: params.projectKey },
          summary: params.summary,
          description: params.description || '',
          issuetype: { name: params.issueType || 'Story' }
        }
      };

      const response = await this.client.addNewIssue(issueData);
      
      // If epic key is provided, link the ticket to the epic
      if (params.epicKey) {
        await this.linkTicketToEpic(response.key, params.epicKey);
      }

      return response as unknown as JiraTicketResponse;
    } catch (error: any) {
      throw new Error(`Failed to create ticket: ${error.message}`);
    }
  }

  private async linkTicketToEpic(ticketKey: string, epicKey: string): Promise<void> {
    try {
      // First verify the epic exists
      await this.getTicketById(epicKey);
      
      // Link the ticket to the epic using the "Epic Link" field
      await this.client.updateIssue(ticketKey, {
        fields: {
          customfield_10014: epicKey // Note: Epic Link field ID may vary in your Jira instance
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to link ticket to epic: ${error.message}`);
    }
  }
} 