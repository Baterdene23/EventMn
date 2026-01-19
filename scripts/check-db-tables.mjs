import "dotenv/config";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
	const result = await pool.query(
		"select to_regclass('public.notifications') as notifications, to_regclass('public.private_messages') as private_messages"
	);
	console.log(result.rows[0]);
} finally {
	await pool.end();
}
