import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ListContactsDto } from './dto/list-contacts.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, data: CreateContactDto) {
    try {
      return await this.prisma.contact.create({
        data: {
          organizationId,
          firstName: this.toNullable(data.firstName),
          lastName: this.toNullable(data.lastName),
          email: this.toNullable(data.email)?.toLowerCase() || null,
          phone: this.toNullable(data.phone),
          status: this.toNullable(data.status),
        },
      });
    } catch (error) {
      this.handleUniqueEmailError(error);
      throw error;
    }
  }

  async findAll(organizationId: string, query: ListContactsDto) {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const q = query.q?.trim();

    const where: Prisma.ContactWhereInput = {
      organizationId,
      ...(q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      items,
      total,
      limit,
      offset,
    };
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

    try {
      return await this.prisma.contact.update({
        where: { id },
        data: {
          firstName: this.toNullable(data.firstName),
          lastName: this.toNullable(data.lastName),
          email: this.toNullable(data.email)?.toLowerCase(),
          phone: this.toNullable(data.phone),
          status: this.toNullable(data.status),
        },
      });
    } catch (error) {
      this.handleUniqueEmailError(error);
      throw error;
    }
  }

  async remove(organizationId: string, id: string) {
    await this.findOne(organizationId, id);
    await this.prisma.contact.delete({
      where: { id },
    });
  }

  private handleUniqueEmailError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('A contact with this email already exists in your organization');
    }
  }

  private toNullable(value?: string) {
    if (typeof value === 'undefined') {
      return undefined;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
}
