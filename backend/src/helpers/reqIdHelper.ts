import pool from '../utils/dbClient';

export const generateReqId = async (): Promise<string> => {
  const result = await pool.query<{ max_num: string | null }>(
    `SELECT MAX(CAST(SUBSTRING(req_id FROM 5) AS INTEGER)) AS max_num
     FROM requisitions
     WHERE req_id ~ '^REQ-[0-9]+$'`
  );

  const nextNum =
    (result.rows[0].max_num ? parseInt(result.rows[0].max_num, 10) : 0) + 1;

  return `REQ-${String(nextNum).padStart(3, '0')}`;
};
