import httpStatus from 'http-status';

import ApiError from '../../../errors/ApiError';
import {
  StockMovementItemStatus,
  StockMovementStatus,
} from './stock-movements.interface';

export const resolveLineQuantity = (
  requestedQuantity: number,
  currentQuantity: number,
  inputQuantity?: number | null,
  label = 'Quantity'
) => {
  const remaining = Math.max(0, requestedQuantity - currentQuantity);

  if (remaining <= 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Item has already been fully processed for this step'
    );
  }

  const quantityThisOperation =
    inputQuantity !== undefined && inputQuantity !== null
      ? Number(inputQuantity)
      : remaining;

  if (Number.isNaN(quantityThisOperation) || quantityThisOperation <= 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `${label} must be greater than zero`
    );
  }

  if (quantityThisOperation > remaining) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `${label} cannot exceed remaining quantity (${remaining})`
    );
  }

  return quantityThisOperation;
};

export const resolveItemStatus = (
  requestedQuantity: number,
  readyQuantity: number,
  transferredQuantity: number,
  confirmedQuantity: number
): StockMovementItemStatus => {
  if (confirmedQuantity >= requestedQuantity) return 'completed';
  if (confirmedQuantity > 0) return 'partial_confirmed';
  if (transferredQuantity >= requestedQuantity) return 'in_transit';
  if (transferredQuantity > 0) return 'partial_transit';
  if (readyQuantity >= requestedQuantity) return 'ready';
  if (readyQuantity > 0) return 'partial_ready';
  return 'pending';
};

export const resolveHeaderStatus = (
  items: Array<{
    requested_quantity: number;
    ready_quantity: number;
    transferred_quantity: number;
    confirmed_quantity: number;
  }>,
  current: StockMovementStatus
): StockMovementStatus => {
  if (current === 'cancelled' || current === 'completed') return current;

  const allConfirmed = items.every(
    i => Number(i.confirmed_quantity) >= Number(i.requested_quantity)
  );
  if (allConfirmed) return 'completed';

  const anyTransferred = items.some(i => Number(i.transferred_quantity) > 0);
  if (anyTransferred || current === 'in_transit') return 'in_transit';

  const allReady = items.every(
    i => Number(i.ready_quantity) >= Number(i.requested_quantity)
  );
  if (allReady) return 'ready';

  if (current === 'approved' || current === 'ready') return current;
  return current;
};
