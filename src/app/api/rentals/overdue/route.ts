import { withAuthAndErrorHandler } from '@/middlewares/errorHandler';
import { rentalService } from '@/services/RentalService';
import { NextResponse } from 'next/server';

export const GET = withAuthAndErrorHandler(async () => {
  const overdueRentals = await rentalService.getOverdueRentals();

  return NextResponse.json({
    success: true,
    data: overdueRentals,
    message: `${overdueRentals.length} locations en retard trouvées`,
  });
});
