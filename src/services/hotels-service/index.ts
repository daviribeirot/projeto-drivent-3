import { notFoundError, paymentRequired } from '@/errors';
import enrollmentRepository from '@/repositories/enrollment-repository';
import ticketsRepository from '@/repositories/tickets-repository';
import hotelsRepository from '@/repositories/hotels-repository';

async function verifyTicketAndEnrollment(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

  if (!enrollment) throw notFoundError();

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);

  if (!ticket || ticket.status !== 'PAID' || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel)
    throw paymentRequired();
}
async function getAllHotels(userId: number) {
  await verifyTicketAndEnrollment(userId);

  const hotels = await hotelsRepository.getAllHotels();

  return hotels;
}

async function getHotelByHotelId(userId: number, hotelId: number) {
  await verifyTicketAndEnrollment(userId);

  const hotel = await hotelsRepository.getHotelByHotelId(hotelId);

  if (!hotel) throw notFoundError();

  return hotel;
}

export const hotelsService = { getAllHotels, getHotelByHotelId };
