import { notFoundError, paymentRequiredError } from '@/errors';
import enrollmentRepository from '@/repositories/enrollment-repository';
import ticketsRepository from '@/repositories/tickets-repository';
import hotelsRepository from '@/repositories/hotels-repository';

async function verifyTicketAndEnrollment(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

  if (!enrollment) throw notFoundError();

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);

  if (!ticket) throw notFoundError();

  if (!ticket.TicketType.includesHotel || ticket.status === 'RESERVED' || ticket.TicketType.isRemote) {
    throw paymentRequiredError();
  }
}
async function getAllHotels(userId: number) {
  await verifyTicketAndEnrollment(userId);

  const hotels = await hotelsRepository.getAllHotels();

  if (!hotels.length) throw notFoundError();

  return hotels;
}

async function getHotelByHotelId(userId: number, hotelId: number) {
  await verifyTicketAndEnrollment(userId);

  const hotel = await hotelsRepository.getHotelByHotelId(hotelId);

  if (!hotel) throw notFoundError();

  return hotel;
}

export const hotelsService = { getAllHotels, getHotelByHotelId };
