import { Router } from 'express';
import { authenticateToken } from '@/middlewares';
import { getHotelByHotelId, getAllHotels } from '@/controllers';

const hotelsRouter = Router();

hotelsRouter.all('/*', authenticateToken).get('/', getAllHotels).get('/:hotelId', getHotelByHotelId);

export { hotelsRouter };
