import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Ticket } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { DatabaseService, QueryParams } from 'stefaninigo';
import { v4 as uuidv4 } from 'uuid';
import { StatesHistory } from 'src/states_history/dto/create-states-history.dto';
import { Utils } from 'src/utils/utils';
import { Evidence } from 'src/evidence/dto/create-evidence.dto';
import { Comment } from 'src/comment/dto/create-comment.dto';
import { Device } from 'src/device/dto/create-device.dto';

@Injectable()
export class TicketService {
  private collectionName: string = 'tickets';
  constructor(
    @Inject('mongodb') private readonly databaseService: DatabaseService,
  ) { }

  async create(tickets: Ticket | Ticket[]) {
    const createdAt = new Date().toISOString();
    if (Array.isArray(tickets)) {
      const ticketWithIds = tickets.map((ticket) => ({
        id: uuidv4().toString(),
        ...ticket,
        createdAt
      }))
      await this.databaseService.create(ticketWithIds, this.collectionName);
      return ticketWithIds.map((ticket) => ticket.id);
    } else {
      const id = uuidv4().toString()
      await this.databaseService.create({
        id,
        ...tickets,
        createdAt
      }, this.collectionName)
      return [id]
    }
  }

  async get(id: string) {
    const ticket = await this.databaseService.get(id, this.collectionName);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async delete(id: string) {
    const ticket = await this.databaseService.get(id, this.collectionName);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    await this.databaseService.delete(id, this.collectionName);

    return 'Ticket deleted successfully';
  }

  async list(page: number, limit: number, queryParams: QueryParams) {
    page = page <= 0 ? 1 : page;
    const start = (page - 1) * limit;
    const total = await this.databaseService.count(queryParams, this.collectionName);
    const records = await this.databaseService.list(start, limit, queryParams, this.collectionName);

    return {
      total,
      page,
      limit,
      records,
    };
  }

  async update(id: string, ticket: UpdateTicketDto) {
    const updatedAt = new Date().toISOString();
    ticket["updatedAt"] = updatedAt;
    return (
      (await this.databaseService.update(id, ticket, this.collectionName)) && 'Update successful'
    );
  }

  async flows(id: string) {
    const ticket = await this.databaseService.get(id, this.collectionName);
    const commercePromise = this.databaseService.get(ticket.commerceId, "commerces");
    const branchPromise = this.databaseService.get(ticket.branchId, "branches");
    const categoryPromise = this.databaseService.get(ticket.categoryId, "categories");
    const subcategoryPromise = this.databaseService.get(ticket.subcategoryId, "subcategories");

    const contactsPromise = ticket.contactsId.length > 0
      ? Promise.all(ticket.contactsId.map((contact) => this.databaseService.get(contact.id, "contacts")))
      : Promise.resolve([]);

    const coordinatorsPromise = ticket.coordinators.length > 0
      ? Promise.all(ticket.coordinators.map((coordinator) => this.databaseService.get(coordinator.id, "employees")))
      : Promise.resolve([]);

    const technicalsPromise = ticket.technicals.length > 0
      ? Promise.all(ticket.technicals.map((technical) => this.databaseService.get(technical.id, "employees")))
      : Promise.resolve([]);

    const commentsPromise = this.databaseService.list(0, 100, {
        filters: { ticketId: ticket.id },
      }, "comments");

    const statesHistoryPromise = this.databaseService.list(0, 100, {
      filters: { ticketId: ticket.id },
    }, "states_history");

    const evidencesPromise = this.databaseService.list(0, 100, {
      filters: { ticketId: ticket.id }
    }, "evidences");

    const devicesPromise = this.databaseService.list(0, 100, {
      filters: { ticketId: ticket.id }
    }, "devices");

    const [commerce, branch, contacts, coordinators, technicals, statesHistory, comments, evidences, devices, category, subcategory] = await Promise.all([
      commercePromise,
      branchPromise,
      contactsPromise,
      coordinatorsPromise,
      technicalsPromise,
      statesHistoryPromise,
      commentsPromise,
      evidencesPromise,
      devicesPromise,
      categoryPromise,
      subcategoryPromise
    ]);
    return this.mapSuperTicket(ticket, commerce, branch, contacts, coordinators, technicals, statesHistory, comments, evidences, devices, category, subcategory);
  }

  mapSuperTicket(ticket, commerce, branch, contacts, coordinators, technicals, statesHistory, _comments, _evidences, _devices, category, subcategory) {
    const evidences = Utils.mapRecord(Evidence, _evidences);
    const devices = Utils.mapRecord(Device, _devices);
    evidences.forEach(evidence => {
        evidence["devices"] = devices.filter(device => device.evidenceId === evidence["id"]);
    });
    delete category?._id;
    delete subcategory?._id;

    const allEmployees = [...coordinators, ...technicals];

    const comments = Utils.mapRecord(Comment, _comments);
    
    const commentsWithEmployeeNames = comments.map((comment) => {
      const employee = allEmployees.find(emp => emp?.id === comment?.employeeId);
      return {
        ...comment,
        employeeName: employee ? `${employee.firstName} ${employee.secondName} ${employee.firstSurname} ${employee.secondSurname}` : 'Nombre no encontrado',
      };
    });
    return {
      ticket: {
        id: ticket?.id,
        ticket_number: ticket?.ticket_number,
        description: ticket?.description,
        createAt: ticket?.createAt,
        updateAt: ticket?.updateAt,
        plannedDate: ticket?.plannedDate,
        sla: ticket?.sla,
        attentionType: ticket?.attentionType,
        category,
        subcategory,
        priority: ticket?.priority,
        currentState: ticket?.currentState,
      },
      commerce: {
        id: commerce?.id,
        rut: commerce?.rut,
        name: commerce?.name,
        observation: commerce?.observation,
        services: commerce?.services,
        logo: commerce?.logo,
      },
      branch: {
        id: branch?.id,
        rut: branch?.rut,
        location: {
          address: branch?.location?.address,
          city: branch?.location?.city,
          region: branch?.location?.region,
          commune: branch?.location?.commune,
          coords: {
            latitude: branch?.location?.coords?.latitude,
            longitude: branch?.location?.coords?.longitude,
          },
        },
        name: branch?.name,
        observation: branch?.observation,
        contacts: contacts?.map((contact) => ({
          id: contact?.id,
          names: contact?.names,
          phoneNumber: contact?.phoneNumber,
          email: contact?.email,
        })),
      },
      coordinators: coordinators?.map((coordinator) => ({
        id: coordinator?.id,
        role: coordinator?.role,
        rut: coordinator?.rut,
        fullName: coordinator?.fullName,
        phone: coordinator?.phone,
        email: coordinator?.email,
      })),
      technicals: technicals?.map((technical) => ({
        id: technical?.id,
        role: technical?.role,
        phone: technical?.phone,
        email: technical?.email,
        enabled: technical?.enabled,
        assignmentDate: technical?.assignmentDate,
      })),
      history: Utils.mapRecord(StatesHistory, statesHistory),
      comments: commentsWithEmployeeNames,
      evidences
    };
  }


}
