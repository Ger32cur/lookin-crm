import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { OrganizationId } from '../auth/decorators/organization-id.decorator';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { ListOpportunitiesDto } from './dto/list-opportunities.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { PipelinesService } from './pipelines.service';

@Controller()
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Get('pipelines')
  findPipelines(@OrganizationId() organizationId: string) {
    return this.pipelinesService.findPipelines(organizationId);
  }

  @Get('opportunities')
  findOpportunities(
    @OrganizationId() organizationId: string,
    @Query() query: ListOpportunitiesDto,
  ) {
    return this.pipelinesService.findOpportunities(organizationId, query);
  }

  @Post('opportunities')
  createOpportunity(
    @OrganizationId() organizationId: string,
    @Body() body: CreateOpportunityDto,
  ) {
    return this.pipelinesService.createOpportunity(organizationId, body);
  }

  @Patch('opportunities/:id')
  updateOpportunity(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() body: UpdateOpportunityDto,
  ) {
    return this.pipelinesService.updateOpportunity(organizationId, id, body);
  }
}
