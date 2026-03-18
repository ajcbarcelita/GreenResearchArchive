-- Adds task-level lock support so coordinators/faculty can stop further submissions per task.
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

-- Enables automatic lock behavior once due date has passed.
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS auto_lock_after_due_date boolean NOT NULL DEFAULT false;
