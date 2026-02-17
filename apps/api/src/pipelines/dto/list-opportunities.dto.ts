import { IsOptional, IsString } from 'class-validator';

export class ListOpportunitiesDto {
  @IsOptional()
  @IsString()
  pipelineId?: string;
}
