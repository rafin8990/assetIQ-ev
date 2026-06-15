import { PurchaseOrderStatus } from './purchase-orders.interface';

export type PoItemReceivingInput = {
  quantity: number;
  received_quantity: number;
};

export const STAGING_ELIGIBLE_STATUSES: PurchaseOrderStatus[] = [
  'approved',
  'in_staging',
  'partially_received',
  'fully_received',
];

export const STAGING_ACTIVE_STATUSES: PurchaseOrderStatus[] = [
  'in_staging',
  'partially_received',
  'fully_received',
];

export const PATCH_BLOCKED_STATUSES: PurchaseOrderStatus[] = [
  'received',
  'in_staging',
  'partially_received',
  'fully_received',
];

export const computeReceivingStatus = (
  items: PoItemReceivingInput[]
): PurchaseOrderStatus => {
  if (!items.length) {
    return 'approved';
  }

  const hasAnyReceived = items.some(item => Number(item.received_quantity) > 0);

  if (!hasAnyReceived) {
    return 'approved';
  }

  const allFullyReceived = items.every(
    item => Number(item.received_quantity) >= Number(item.quantity)
  );

  if (allFullyReceived) {
    return 'fully_received';
  }

  return 'partially_received';
};

export const countFullyReceivedLines = (items: PoItemReceivingInput[]) => {
  if (!items.length) return { fullyReceivedLines: 0, totalLines: 0 };

  const fullyReceivedLines = items.filter(
    item => Number(item.received_quantity) >= Number(item.quantity)
  ).length;

  return { fullyReceivedLines, totalLines: items.length };
};
