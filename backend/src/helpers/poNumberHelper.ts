import pool from '../utils/dbClient';

export const generatePoNumber = async (): Promise<string> => {
  const result = await pool.query<{ max_num: string | null }>(
    `SELECT MAX(CAST(SUBSTRING(po_number FROM 4) AS INTEGER)) AS max_num
     FROM purchase_orders
     WHERE po_number ~ '^PO-[0-9]+$'`
  );

  const nextNum =
    (result.rows[0].max_num ? parseInt(result.rows[0].max_num, 10) : 0) + 1;

  return `PO-${String(nextNum).padStart(3, '0')}`;
};
