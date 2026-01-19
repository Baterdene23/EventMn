import "dotenv/config";
import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
		CREATE TYPE "NotificationType" AS ENUM (
			'MESSAGE',
			'EVENT_REMINDER',
			'EVENT_UPDATE',
			'NEW_ATTENDEE',
			'SYSTEM'
		);
	END IF;
END $$;

CREATE TABLE IF NOT EXISTS "notifications" (
	"id" TEXT NOT NULL,
	"userId" TEXT NOT NULL,
	"type" "NotificationType" NOT NULL,
	"title" TEXT NOT NULL,
	"message" TEXT NOT NULL,
	"link" TEXT,
	"isRead" BOOLEAN NOT NULL DEFAULT false,
	"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"eventId" TEXT,
	"fromUserId" TEXT,
	CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
	CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "notifications_userId_idx" ON "notifications"("userId");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");
`;

try {
	await pool.query(sql);
	console.log("OK: notifications table ensured");
} finally {
	await pool.end();
}
