-- Attach the existing log_data_change() trigger (see migration
-- 20260916085510_add_data_change_audit_log) to the rest of the app's
-- tables. Excluded: "health_checks" (per request), "data_change_logs"
-- itself (would recurse into itself on every insert), and
-- "_prisma_migrations" (Prisma's internal bookkeeping table, not app data).

-- CreateTrigger
CREATE TRIGGER "trg_audit_audit_logs"
AFTER INSERT OR UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION log_data_change();

-- CreateTrigger
CREATE TRIGGER "trg_audit_leave_types"
AFTER INSERT OR UPDATE OR DELETE ON "leave_types"
FOR EACH ROW EXECUTE FUNCTION log_data_change();

-- CreateTrigger
CREATE TRIGGER "trg_audit_password_reset_otps"
AFTER INSERT OR UPDATE OR DELETE ON "password_reset_otps"
FOR EACH ROW EXECUTE FUNCTION log_data_change();

-- CreateTrigger
CREATE TRIGGER "trg_audit_public_holidays"
AFTER INSERT OR UPDATE OR DELETE ON "public_holidays"
FOR EACH ROW EXECUTE FUNCTION log_data_change();
