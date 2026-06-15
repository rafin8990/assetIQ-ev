import pool from '../utils/dbClient';

export const generateLocationCode = async (): Promise<string> => {
  const result = await pool.query<{ max_num: string | null }>(
    `SELECT MAX(CAST(SUBSTRING(location_code FROM 10) AS INTEGER)) AS max_num
     FROM locations
     WHERE location_code ~ '^location-[0-9]+$'`
  );

  const nextNum =
    (result.rows[0].max_num ? parseInt(result.rows[0].max_num, 10) : 0) + 1;

  return `location-${String(nextNum).padStart(3, '0')}`;
};
