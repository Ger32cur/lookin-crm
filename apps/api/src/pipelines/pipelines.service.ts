import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { ListOpportunitiesDto } from './dto/list-opportunities.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';

@Injectable()
export class PipelinesService {
  constructor(private readonly prisma: PrismaService) {}

  async findPipelines(organizationId: string) {
    return this.prisma.pipeline.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findOpportunities(organizationId: string, query: ListOpportunitiesDto) {
    if (query.pipelineId) {
      await this.findPipelineOrThrow(organizationId, query.pipelineId);
    }

    const where: Prisma.OpportunityWhereInput = {
      organizationId,
      ...(query.pipelineId ? { pipelineId: query.pipelineId } : {}),
    };

    return this.prisma.opportunity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
      },
    });
  }

  async createOpportunity(organizationId: string, data: CreateOpportunityDto) {
    const [pipeline, contact] = await Promise.all([
      this.findPipelineOrThrow(organizationId, data.pipelineId),
      this.findContactOrThrow(organizationId, data.contactId),
    ]);

    const defaultStage = await this.prisma.stage.findFirst({
      where: { pipelineId: pipeline.id },
      orderBy: { order: 'asc' },
    });

    if (!defaultStage) {
      throw new BadRequestException('Pipeline has no stages configured');
    }

    return this.prisma.opportunity.create({
      data: {
        organizationId,
        contactId: contact.id,
        pipelineId: pipeline.id,
        stageId: defaultStage.id,
        title:
          this.normalizeTitle(data.title, 'title') ??
          this.getDefaultOpportunityTitle(contact),
        value: data.value,
      },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
      },
    });
  }

  async updateOpportunity(organizationId: string, id: string, data: UpdateOpportunityDto) {
    const existing = await this.prisma.opportunity.findFirst({
      where: {
        id,
        organizationId,
      },
      select: {
        id: true,
        pipelineId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Opportunity not found');
    }

    const updateData: Prisma.OpportunityUpdateInput = {};

    if (typeof data.stageId !== 'undefined') {
      const nextStage = await this.prisma.stage.findFirst({
        where: {
          id: data.stageId,
          pipelineId: existing.pipelineId,
        },
      });

      if (!nextStage) {
        throw new BadRequestException('Stage does not belong to opportunity pipeline');
      }

      updateData.stage = { connect: { id: data.stageId } };
    }

    if (typeof data.title !== 'undefined') {
      updateData.title = this.normalizeTitle(data.title, 'title');
    }

    if (typeof data.value !== 'undefined') {
      updateData.value = data.value;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No changes provided');
    }

    return this.prisma.opportunity.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        stage: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
      },
    });
  }

  private async findPipelineOrThrow(organizationId: string, pipelineId: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: {
        id: pipelineId,
        organizationId,
      },
    });

    if (!pipeline) {
      throw new NotFoundException('Pipeline not found');
    }

    return pipeline;
  }

  private async findContactOrThrow(organizationId: string, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id: contactId,
        organizationId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  private normalizeTitle(value: string | undefined, fieldName: string) {
    if (typeof value === 'undefined') {
      return undefined;
    }

    const normalized = value.trim();
    if (normalized.length === 0) {
      throw new BadRequestException(`${fieldName} must not be empty`);
    }

    return normalized;
  }

  private getDefaultOpportunityTitle(contact: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  }) {
    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
    if (fullName.length > 0) {
      return `${fullName} Opportunity`;
    }

    if (contact.email) {
      return `${contact.email} Opportunity`;
    }

    return 'New Opportunity';
  }
}
