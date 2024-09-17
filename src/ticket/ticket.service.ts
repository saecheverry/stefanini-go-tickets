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
    queryParams.sort = { ...queryParams.sort, createdAt: "desc" };
    const records = await this.databaseService.list(start, limit, queryParams, this.collectionName);

    return {
      total,
      page,
      limit,
      records,
    };
  }

  async listFlows(page: number, limit: number, queryParams: QueryParams) {
    page = Math.max(page, 1);
    const start = (page - 1) * limit;
    const total = await this.databaseService.count(queryParams, this.collectionName);
    queryParams.sort = { ...queryParams.sort, createdAt: "desc" };
    const response = await this.databaseService.list(start, limit, queryParams, this.collectionName);
    const tickets = Array.isArray(response) ? response : [];

    const {
      ticketsId, categoriesId, subcategoriesId, commercesId, branchesId,
      contactsId, coordinatorsId, technicalsId
    } = this.mapFieldsIds(tickets);

    const records = await this.processFlows(tickets, {
      ticketsId, commercesId, branchesId, categoriesId, subcategoriesId,
      contactsId, coordinatorsId, technicalsId
    });

    return {
      total,
      page,
      limit,
      records,
    };
  }

  mapFieldsIds(tickets) {
    return tickets?.reduce((acc, ticket) => {
      acc.ticketsId?.push(ticket.id);
      acc.categoriesId?.push(ticket.categoryId);
      acc.subcategoriesId?.push(ticket.subcategoryId);
      acc.commercesId?.push(ticket.commerceId);
      acc.branchesId?.push(ticket.branchId);
      acc.contactsId?.push(...ticket.contactsId);
      acc.coordinatorsId?.push(...ticket.coordinators.map(coordinator => coordinator.id));
      acc.technicalsId?.push(...ticket.technicals.map(technical => technical.id));
      return acc;
    }, {
      ticketsId: [],
      categoriesId: [],
      subcategoriesId: [],
      commercesId: [],
      branchesId: [],
      contactsId: [],
      coordinatorsId: [],
      technicalsId: []
    });
  }

  async update(id: string, ticket: UpdateTicketDto) {
    const updatedAt = new Date().toISOString();
    ticket["updatedAt"] = updatedAt;
    return (
      (await this.databaseService.update(id, ticket, this.collectionName)) && 'Update successful'
    );
  }

  async flows(ticketId: string) {
    const ticket = await this.databaseService.get(ticketId, this.collectionName);
    
    const {
      ticketsId, categoriesId, subcategoriesId, commercesId, branchesId,
      contactsId, coordinatorsId, technicalsId
    } = this.mapFieldsIds([ticket]);

    const records = await this.processFlows([ticket], {
      ticketsId, commercesId, branchesId, categoriesId, subcategoriesId,
      contactsId, coordinatorsId, technicalsId
    });

    return records[0];
  }

  async processFlows(tickets,  {
    ticketsId, commercesId, branchesId, categoriesId, subcategoriesId,
    contactsId, coordinatorsId, technicalsId
  }) {
    const LIMIT = 100;

    const [
      commercesList, branchesList, categoriesList, subcategoriesList, contactsList, coordinatorsList,
      technicalsList, statesHistoryList, commentsList, evidencesList,
      devicesList, 
    ] = await Promise.all([
      this.databaseService.list(0, LIMIT, { filters: { id: commercesId } }, "commerces"),
      this.databaseService.list(0, LIMIT, { filters: { id: branchesId } }, "branches"),
      this.databaseService.list(0, LIMIT, { filters: { id: categoriesId } }, "categories"),
      this.databaseService.list(0, LIMIT, { filters: { id: subcategoriesId } }, "subcategories"),
      this.databaseService.list(0, LIMIT, { filters: { id: contactsId } }, "contacts"),
      this.databaseService.list(0, LIMIT, { filters: { id: coordinatorsId } }, "employees"),
      this.databaseService.list(0, LIMIT, { filters: { id: technicalsId } }, "employees"),
      this.databaseService.list(0, LIMIT, { filters: { ticketId: ticketsId } }, "states_history"),
      this.databaseService.list(0, LIMIT, { filters: { ticketId: ticketsId } }, "comments"),
      this.databaseService.list(0, LIMIT, { filters: { ticketId: ticketsId } }, "evidences"),
      this.databaseService.list(0, LIMIT, { filters: { ticketId: ticketsId } }, "devices")
    ]);
    const records = [];
    for (const ticket of tickets) {
      const elements = this.getOwnTicketElements(
        ticket, commercesList, branchesList, contactsList, coordinatorsList,
        technicalsList, statesHistoryList, commentsList, evidencesList,
        devicesList, categoriesList, subcategoriesList
      );
      const ticketResult = this.mapSuperTicket(
        elements.ticket, elements.commerce, elements.branch, elements.contacts,
        elements.coordinators, elements.technicals, elements.statesHistory,
        elements.comments, elements.evidences, elements.devices,
        elements.category, elements.subcategory
      );

      records.push(ticketResult);
    }

    return records;
  }

  getOwnTicketElements(ticket,
    commercesList,
    branchesList,
    contactsList,
    coordinatorsList,
    technicalsList,
    statesHistoryList,
    commentsList,
    evidencesList,
    devicesList,
    categoriesList,
    subcategoriesList) {

    const commerce = commercesList.find(commerce => commerce.id === ticket.commerceId);
    const branch = branchesList.find(branch => branch.id === ticket.branchId);
    const category = categoriesList.find(category => category.id === ticket.categoryId);
    const subcategory = subcategoriesList.find(subcategory => subcategory.id === ticket.subcategoryId);

    const contacts = contactsList.filter(contact => contact.commerceId === ticket.commerceId);
    const coordinators = Array.isArray(ticket.coordinators)
      ? coordinatorsList.filter(coordinator => ticket.coordinators.map(c=>c.id)?.includes(coordinator.id))
      : [];
    const technicals = Array.isArray(ticket.technicals)
      ? technicalsList.filter(technical => ticket.technicals.map(t=>t.id)?.includes(technical.id))
      : [];

    const statesHistory = statesHistoryList.filter(history => history.ticketId === ticket.id);
    const comments = commentsList.filter(comment => comment.ticketId === ticket.id);
    const evidences = evidencesList.filter(evidence => evidence.ticketId === ticket.id);
    const devices = devicesList.filter(device => evidences.some(evidence => evidence.id === device.evidenceId));

    return {
      ticket,
      commerce,
      branch,
      contacts,
      coordinators,
      technicals,
      statesHistory,
      comments,
      evidences,
      devices,
      category,
      subcategory
    };
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
        logo: `${process.env["API_DOMAIN"]}/v1/commerces/${commerce?.id}/logos/${commerce?.logoFileName}`,
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
          names: `${contact?.firstName} ${contact?.lastName}`,
          phone: contact?.phone,
          email: contact?.mail,
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
