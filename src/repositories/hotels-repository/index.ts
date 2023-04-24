import { prisma } from '@/config';

async function getAllHotels() {
  const hotels = prisma.hotel.findMany();
  return hotels;
}

async function getHotelByHotelId(hotelId: number) {
  const hotel = await prisma.hotel.findFirst({
    where: {
      id: hotelId,
    },
    include: {
      Rooms: true,
    },
  });
  return hotel;
}

const hotelRepository = {
  getAllHotels,
  getHotelByHotelId,
};

export default hotelRepository;
