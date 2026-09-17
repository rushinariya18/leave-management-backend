-- CreateTable
CREATE TABLE "data_change_logs" (
    "id" BIGSERIAL NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" TEXT,
    "operation" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "changedBy" TEXT,
    "clientAddr" TEXT,
    "appName" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "data_change_logs_tableName_recordId_idx" ON "data_change_logs"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "data_change_logs_changedAt_idx" ON "data_change_logs"("changedAt");

-- CreateFunction
-- Fires on every INSERT/UPDATE/DELETE on an audited table, regardless of
-- whether the change came from the app's Prisma client or a direct SQL
-- session (psql, a DB GUI, another service), and records a before/after
-- snapshot plus who/what made the change.
CREATE OR REPLACE FUNCTION log_data_change() RETURNS TRIGGER AS $$
DECLARE
  v_record_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD."id"::TEXT;
  ELSE
    v_record_id := NEW."id"::TEXT;
  END IF;

  INSERT INTO "data_change_logs" (
    "tableName", "recordId", "operation", "oldData", "newData",
    "changedBy", "clientAddr", "appName", "changedAt"
  ) VALUES (
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('UPDATE', 'INSERT') THEN to_jsonb(NEW) ELSE NULL END,
    current_user,
    inet_client_addr()::TEXT,
    current_setting('application_name', true),
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- CreateTrigger
CREATE TRIGGER "trg_audit_leave_balances"
AFTER INSERT OR UPDATE OR DELETE ON "leave_balances"
FOR EACH ROW EXECUTE FUNCTION log_data_change();

-- CreateTrigger
CREATE TRIGGER "trg_audit_leave_requests"
AFTER INSERT OR UPDATE OR DELETE ON "leave_requests"
FOR EACH ROW EXECUTE FUNCTION log_data_change();

-- CreateTrigger
CREATE TRIGGER "trg_audit_leave_carry_forwards"
AFTER INSERT OR UPDATE OR DELETE ON "leave_carry_forwards"
FOR EACH ROW EXECUTE FUNCTION log_data_change();

-- CreateTrigger
CREATE TRIGGER "trg_audit_users"
AFTER INSERT OR UPDATE OR DELETE ON "users"
FOR EACH ROW EXECUTE FUNCTION log_data_change();
