import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { OrganizationId } from '../auth/decorators/organization-id.decorator';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@OrganizationId() organizationId: string, @Body() body: CreateContactDto) {
    return this.contactsService.create(organizationId, body);
  }

  @Get()
  findAll(@OrganizationId() organizationId: string) {
    return this.contactsService.findAll(organizationId);
  }

  @Get(':id')
  findOne(@OrganizationId() organizationId: string, @Param('id') id: string) {
    return this.contactsService.findOne(organizationId, id);
  }

  @Patch(':id')
  update(@OrganizationId() organizationId: string, @Param('id') id: string, @Body() body: UpdateContactDto) {
    return this.contactsService.update(organizationId, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@OrganizationId() organizationId: string, @Param('id') id: string) {
    await this.contactsService.remove(organizationId, id);
  }
}
