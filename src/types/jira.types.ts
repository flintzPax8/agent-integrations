export interface JiraConfig {
  protocol: string;
  host: string;
  username: string;
  password: string;
  apiVersion: string;
  strictSSL: boolean;
}

export interface JiraTicketSearchParams {
  searchText?: string;
  projectKey?: string;
  sprintId?: string;
  jql?: string;
  maxResults?: number;
  expand?: string[];
}

export interface JiraTicketResponse {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: string;
    status: {
      name: string;
    };
    issuetype: {
      name: string;
    };
    priority: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    sprint?: {
      id: number;
      name: string;
      state: string;
      startDate?: string;
      endDate?: string;
    };
  };
}
