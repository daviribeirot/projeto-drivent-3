import faker from '@faker-js/faker';
import { prisma } from '@/config';

export async function createHotel() {
  const hotel = await prisma.hotel.create({
    data: {
      name: faker.name.findName(),
      image: faker.image.city(),
    },
  });
  return hotel;
}

export async function createHotelRoom(hotelId: number) {
  const hotelRoom = await prisma.room.create({
    data: {
      name: faker.name.findName(),
      capacity: faker.datatype.number(),
      hotelId: hotelId,
    },
  });
  return hotelRoom;
}
