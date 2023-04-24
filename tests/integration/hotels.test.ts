import httpStatus from 'http-status';
import faker from '@faker-js/faker';
import * as jwt from 'jsonwebtoken';
import { TicketStatus } from '@prisma/client';
import supertest from 'supertest';
import { cleanDb, generateValidToken } from '../helpers';
import {
  createEnrollmentWithAddress,
  createUser,
  createTicketType,
  createTicket,
  createTicketTypeWithHotel,
  createTicketTypeWithoutHotel,
  createRemoteTicketType,
  createHotel,
  createHotelRoom,
} from '../factories';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const api = supertest(app);

describe('GET: /hotels', () => {
  it('should respond with status 401 if no token is given', async () => {
    const result = await api.get('/hotels');
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();
    const result = await api.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithNoSession = await createUser();
    const token = jwt.sign({ userId: userWithNoSession.id }, process.env.JWT_SECRET);
    const result = await api.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });
});

describe('GET: /hotels with valid token', () => {
  it('should respond with 404 if user has no enrollment', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const result = await api.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(httpStatus.NOT_FOUND);
  });

  it('should respond with 404 if user has no ticket', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    await createEnrollmentWithAddress(user);
    const result = await api.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(httpStatus.NOT_FOUND);
  });

  it('should respond with 402 if ticket is not paid', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType();
    await createTicket(enrollment.id, ticketType.id, 'RESERVED');
    const result = await api.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(httpStatus.PAYMENT_REQUIRED);
  });

  it('should respond with 402 if ticket is remote', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createRemoteTicketType();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const result = await api.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(httpStatus.PAYMENT_REQUIRED);
  });

  it('should respond with 402 if ticket does not include hotel', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithoutHotel();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const result = await api.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(httpStatus.PAYMENT_REQUIRED);
  });

  it('should respond with 404 if there are no hotels', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const result = await api.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(result.status).toBe(httpStatus.NOT_FOUND);
  });

  it('should respond with status 200 and an hotels array if there are hotels', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const hotel = await createHotel();
    const result = await api.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(result.status).toBe(httpStatus.OK);
    expect(result.body).toEqual([
      {
        id: hotel.id,
        name: hotel.name,
        image: hotel.image,
        createdAt: hotel.createdAt.toISOString(),
        updatedAt: hotel.updatedAt.toISOString(),
      },
    ]);
  });
});

describe('GET: /hotels:hotelId', () => {
  it('should respond with status 401 if no token is given', async () => {
    const result = await api.get('/hotels/1');
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word;
    const result = await api.get('/hotels/1').set('Authorization', `Bearer ${token}`);
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithNoSession = await createUser();
    const token = jwt.sign({ userId: userWithNoSession.id }, process.env.JWT_SECRET);
    const result = await api.get('/hotels/1').set('Authorization', `Bearer ${token}`);
    expect(result.status).toBe(httpStatus.UNAUTHORIZED);
  });
});

describe('GET /hotels/:hotelId when token is valid', () => {
  it('should respond with 404 if user has no enrollment', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const hotel = await createHotel();
    const result = await api.get(`/hotels/${hotel.id}`).set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(httpStatus.NOT_FOUND);
  });

  it('should respond with 404 if user has no ticket', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    await createEnrollmentWithAddress(user);
    const hotel = await createHotel();
    const result = await api.get(`/hotels/${hotel.id}`).set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(httpStatus.NOT_FOUND);
  });

  it('should respond with 404 if hotel does not exist', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const result = await api.get('/hotels/1234').set('Authorization', `Bearer ${token}`);
    expect(result.status).toBe(httpStatus.NOT_FOUND);
  });

  it('should respond with 402 if ticket is not paid', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType();
    await createTicket(enrollment.id, ticketType.id, 'RESERVED');
    const hotel = await createHotel();
    const result = await api.get(`/hotels/${hotel.id}`).set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(httpStatus.PAYMENT_REQUIRED);
  });

  it('should respond with 402 if ticket does not includes hotel', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithoutHotel();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const hotel = await createHotel();
    const result = await api.get(`/hotels/${hotel.id}`).set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(httpStatus.PAYMENT_REQUIRED);
  });

  it('should respond with 402 if ticket is remote', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createRemoteTicketType();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const hotel = await createHotel();
    const result = await api.get(`/hotels/${hotel.id}`).set('Authorization', `Bearer ${token}`);
    expect(result.status).toEqual(httpStatus.PAYMENT_REQUIRED);
  });

  it('should respond with status 200 and an hotels array if there are hotels', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const hotel = await createHotel();
    const room = await createHotelRoom(hotel.id);
    const result = await api.get(`/hotels/${hotel.id}`).set('Authorization', `Bearer ${token}`);
    expect(result.status).toBe(httpStatus.OK);
    expect(result.body).toEqual({
      id: hotel.id,
      name: hotel.name,
      image: hotel.image,
      createdAt: hotel.createdAt.toISOString(),
      updatedAt: hotel.updatedAt.toISOString(),
      Rooms: [
        {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          hotelId: room.hotelId,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        },
      ],
    });
  });
});
