import { apiJsonRequest } from '@/lib/api-client';

export type PipelineStage = {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  createdAt: string;
};

export type Pipeline = {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
  stages: PipelineStage[];
};

export type OpportunityContact = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
};

export type OpportunityStage = {
  id: string;
  name: string;
  order: number;
};

export type Opportunity = {
  id: string;
  organizationId: string;
  contactId: string;
  pipelineId: string;
  stageId: string;
  title: string;
  value: number | null;
  createdAt: string;
  updatedAt: string;
  contact: OpportunityContact;
  stage: OpportunityStage;
};

export type CreateOpportunityInput = {
  contactId: string;
  pipelineId: string;
  title?: string;
  value?: number;
};

export type UpdateOpportunityInput = {
  stageId?: string;
  title?: string;
  value?: number;
};

export async function getPipelines(token: string) {
  return apiJsonRequest<Pipeline[]>({
    token,
    path: '/api/pipelines',
    fallbackMessage: 'Unable to fetch pipelines',
  });
}

export async function getOpportunities(token: string, pipelineId: string) {
  const query = new URLSearchParams();
  query.set('pipelineId', pipelineId);

  return apiJsonRequest<Opportunity[]>({
    token,
    path: '/api/opportunities',
    query,
    fallbackMessage: 'Unable to fetch opportunities',
  });
}

export async function createOpportunity(token: string, input: CreateOpportunityInput) {
  return apiJsonRequest<Opportunity>({
    token,
    path: '/api/opportunities',
    method: 'POST',
    body: input,
    fallbackMessage: 'Unable to create opportunity',
  });
}

export async function updateOpportunity(token: string, id: string, input: UpdateOpportunityInput) {
  return apiJsonRequest<Opportunity>({
    token,
    path: `/api/opportunities/${id}`,
    method: 'PATCH',
    body: input,
    fallbackMessage: 'Unable to update opportunity',
  });
}
