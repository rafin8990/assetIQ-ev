import pool from '../utils/dbClient';

export const generateReturnRequestId = async (): Promise<string> => {
  const result = await pool.query<{ max_num: string | null }>(
    `SELECT MAX(CAST(SUBSTRING(return_id FROM 5) AS INTEGER)) AS max_num
     FROM return_requests
     WHERE return_id ~ '^RET-[0-9]+$'`
  );

  const nextNum =
    (result.rows[0].max_num ? parseInt(result.rows[0].max_num, 10) : 0) + 1;

  return `RET-${String(nextNum).padStart(3, '0')}`;
};
