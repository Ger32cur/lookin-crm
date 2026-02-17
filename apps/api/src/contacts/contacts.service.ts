import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  create(organizationId: string, data: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        organizationId,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim(),
        notes: data.notes?.trim(),
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.contact.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(organizationId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async update(organizationId: string, id: string, data: UpdateContactDto) {
    await this.findOne(organizationId, id);

    return this.prisma.contact.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        email: data.email?.trim().toLowerCase(),
        phone: data.phone?.trim(),
        notes: data.notes?.trim(),
      },
    });
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.contact.delete({
      where: { id },
    });
  }
}
