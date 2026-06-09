import pool from '../utils/dbClient';

export const generateOutRequestId = async (): Promise<string> => {
  const result = await pool.query<{ max_num: string | null }>(
    `SELECT MAX(CAST(SUBSTRING(request_id FROM 5) AS INTEGER)) AS max_num
     FROM out_requests
     WHERE request_id ~ '^OUT-[0-9]+$'`
  );

  const nextNum =
    (result.rows[0].max_num ? parseInt(result.rows[0].max_num, 10) : 0) + 1;

  return `OUT-${String(nextNum).padStart(3, '0')}`;
};
