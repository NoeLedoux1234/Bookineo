import { withAuthAndErrorHandler } from '@/middlewares/errorHandler';
import { rentalService } from '@/services/RentalService';
import { NextResponse } from 'next/server';

export const GET = withAuthAndErrorHandler(async () => {
  const stats = await rentalService.getRentalStats();

  return NextResponse.json({
    success: true,
    data: stats,
  });
});
