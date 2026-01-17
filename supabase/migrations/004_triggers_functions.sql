-- =====================================================
-- Database Triggers and Functions
-- Multi-Tenant ToDo Application
-- =====================================================

-- =====================================================
-- AUTO-UPDATE updated_at TIMESTAMP
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_members_updated_at
  BEFORE UPDATE ON company_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subtasks_updated_at
  BEFORE UPDATE ON subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- LOG ACTIVITY ON TODO CHANGES
-- =====================================================

CREATE OR REPLACE FUNCTION log_todo_changes()
RETURNS TRIGGER AS $$
DECLARE
  change_data JSONB;
BEGIN
  -- Build changes object
  IF TG_OP = 'INSERT' THEN
    change_data = jsonb_build_object(
      'title', NEW.title,
      'status', NEW.status,
      'priority', NEW.priority
    );

    INSERT INTO activity_logs (
      company_id, todo_id, user_id, action, entity_type, entity_id, changes
    ) VALUES (
      NEW.company_id, NEW.id, NEW.created_by, 'created', 'todo', NEW.id, change_data
    );

  ELSIF TG_OP = 'UPDATE' THEN
    change_data = jsonb_build_object();

    -- Track status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      change_data = change_data || jsonb_build_object(
        'status', jsonb_build_object('old', OLD.status, 'new', NEW.status)
      );
    END IF;

    -- Track priority changes
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      change_data = change_data || jsonb_build_object(
        'priority', jsonb_build_object('old', OLD.priority, 'new', NEW.priority)
      );
    END IF;

    -- Track title changes
    IF OLD.title IS DISTINCT FROM NEW.title THEN
      change_data = change_data || jsonb_build_object(
        'title', jsonb_build_object('old', OLD.title, 'new', NEW.title)
      );
    END IF;

    -- Track deadline changes
    IF OLD.deadline IS DISTINCT FROM NEW.deadline THEN
      change_data = change_data || jsonb_build_object(
        'deadline', jsonb_build_object('old', OLD.deadline, 'new', NEW.deadline)
      );
    END IF;

    -- Only log if there are actual changes
    IF jsonb_object_keys(change_data) IS NOT NULL THEN
      INSERT INTO activity_logs (
        company_id, todo_id, user_id, action, entity_type, entity_id, changes
      ) VALUES (
        NEW.company_id, NEW.id, auth.uid(), 'updated', 'todo', NEW.id, change_data
      );
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    change_data = jsonb_build_object(
      'title', OLD.title,
      'status', OLD.status
    );

    INSERT INTO activity_logs (
      company_id, todo_id, user_id, action, entity_type, entity_id, changes
    ) VALUES (
      OLD.company_id, OLD.id, auth.uid(), 'deleted', 'todo', OLD.id, change_data
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER log_todo_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION log_todo_changes();

-- =====================================================
-- LOG ACTIVITY ON TODO ASSIGNMENT
-- =====================================================

CREATE OR REPLACE FUNCTION log_todo_assignment()
RETURNS TRIGGER AS $$
DECLARE
  todo_company_id UUID;
  assigned_user_email TEXT;
BEGIN
  -- Get company_id from todo
  SELECT company_id INTO todo_company_id
  FROM todos
  WHERE id = NEW.todo_id;

  -- Get user email
  SELECT email INTO assigned_user_email
  FROM user_profiles
  WHERE id = NEW.user_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (
      company_id, todo_id, user_id, action, entity_type, entity_id, changes
    ) VALUES (
      todo_company_id,
      NEW.todo_id,
      auth.uid(),
      'assigned',
      'todo_assignee',
      NEW.id,
      jsonb_build_object('assigned_to', assigned_user_email)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_logs (
      company_id, todo_id, user_id, action, entity_type, entity_id, changes
    ) VALUES (
      todo_company_id,
      OLD.todo_id,
      auth.uid(),
      'unassigned',
      'todo_assignee',
      OLD.id,
      jsonb_build_object('unassigned_from', assigned_user_email)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER log_todo_assignment_trigger
  AFTER INSERT OR DELETE ON todo_assignees
  FOR EACH ROW
  EXECUTE FUNCTION log_todo_assignment();

-- =====================================================
-- LOG ACTIVITY ON COMMENTS
-- =====================================================

CREATE OR REPLACE FUNCTION log_comment_activity()
RETURNS TRIGGER AS $$
DECLARE
  todo_company_id UUID;
BEGIN
  -- Get company_id from todo
  SELECT company_id INTO todo_company_id
  FROM todos
  WHERE id = NEW.todo_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (
      company_id, todo_id, user_id, action, entity_type, entity_id, changes
    ) VALUES (
      todo_company_id,
      NEW.todo_id,
      NEW.user_id,
      'commented',
      'comment',
      NEW.id,
      jsonb_build_object(
        'is_question', NEW.is_question,
        'content_preview', LEFT(NEW.content, 100)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER log_comment_activity_trigger
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION log_comment_activity();

-- =====================================================
-- CREATE NOTIFICATION ON TODO ASSIGNMENT
-- =====================================================

CREATE OR REPLACE FUNCTION create_assignment_notification()
RETURNS TRIGGER AS $$
DECLARE
  todo_title TEXT;
  assigner_name TEXT;
BEGIN
  -- Get todo title
  SELECT title INTO todo_title
  FROM todos
  WHERE id = NEW.todo_id;

  -- Get assigner name
  SELECT full_name INTO assigner_name
  FROM user_profiles
  WHERE id = auth.uid();

  -- Only create notification if user is not assigning themselves
  IF NEW.user_id != auth.uid() THEN
    INSERT INTO notifications (
      user_id, todo_id, type, title, message
    ) VALUES (
      NEW.user_id,
      NEW.todo_id,
      'todo_assigned',
      'Neue Aufgabe zugewiesen',
      assigner_name || ' hat Ihnen die Aufgabe "' || todo_title || '" zugewiesen.'
    );
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER create_assignment_notification_trigger
  AFTER INSERT ON todo_assignees
  FOR EACH ROW
  EXECUTE FUNCTION create_assignment_notification();

-- =====================================================
-- CREATE NOTIFICATION ON COMMENT
-- =====================================================

CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  todo_title TEXT;
  commenter_name TEXT;
  todo_creator UUID;
  assignee_ids UUID[];
BEGIN
  -- Get todo details
  SELECT title, created_by INTO todo_title, todo_creator
  FROM todos
  WHERE id = NEW.todo_id;

  -- Get commenter name
  SELECT full_name INTO commenter_name
  FROM user_profiles
  WHERE id = NEW.user_id;

  -- Get all assignees
  SELECT ARRAY_AGG(user_id) INTO assignee_ids
  FROM todo_assignees
  WHERE todo_id = NEW.todo_id;

  -- Notify todo creator if they didn't write the comment
  IF todo_creator != NEW.user_id THEN
    INSERT INTO notifications (
      user_id, todo_id, type, title, message
    ) VALUES (
      todo_creator,
      NEW.todo_id,
      'comment_added',
      'Neuer Kommentar',
      commenter_name || ' hat einen Kommentar zu "' || todo_title || '" hinzugefügt.'
    );
  END IF;

  -- Notify all assignees (except the commenter)
  IF assignee_ids IS NOT NULL THEN
    FOR i IN 1..array_length(assignee_ids, 1) LOOP
      IF assignee_ids[i] != NEW.user_id AND assignee_ids[i] != todo_creator THEN
        INSERT INTO notifications (
          user_id, todo_id, type, title, message
        ) VALUES (
          assignee_ids[i],
          NEW.todo_id,
          'comment_added',
          'Neuer Kommentar',
          commenter_name || ' hat einen Kommentar zu "' || todo_title || '" hinzugefügt.'
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER create_comment_notification_trigger
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

-- =====================================================
-- CREATE NOTIFICATION ON STATUS CHANGE
-- =====================================================

CREATE OR REPLACE FUNCTION create_status_change_notification()
RETURNS TRIGGER AS $$
DECLARE
  todo_title TEXT;
  changer_name TEXT;
  todo_creator UUID;
  assignee_ids UUID[];
  status_text_old TEXT;
  status_text_new TEXT;
BEGIN
  -- Only proceed if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get todo details
    SELECT title, created_by INTO todo_title, todo_creator
    FROM todos
    WHERE id = NEW.id;

    -- Get changer name
    SELECT full_name INTO changer_name
    FROM user_profiles
    WHERE id = auth.uid();

    -- Get all assignees
    SELECT ARRAY_AGG(user_id) INTO assignee_ids
    FROM todo_assignees
    WHERE todo_id = NEW.id;

    -- Translate status to German
    status_text_old = CASE OLD.status
      WHEN 'open' THEN 'Offen'
      WHEN 'in_progress' THEN 'In Bearbeitung'
      WHEN 'question' THEN 'Rückfrage'
      WHEN 'done' THEN 'Erledigt'
    END;

    status_text_new = CASE NEW.status
      WHEN 'open' THEN 'Offen'
      WHEN 'in_progress' THEN 'In Bearbeitung'
      WHEN 'question' THEN 'Rückfrage'
      WHEN 'done' THEN 'Erledigt'
    END;

    -- Notify todo creator if they didn't make the change
    IF todo_creator != auth.uid() THEN
      INSERT INTO notifications (
        user_id, todo_id, type, title, message
      ) VALUES (
        todo_creator,
        NEW.id,
        'status_changed',
        'Status geändert',
        changer_name || ' hat den Status von "' || todo_title || '" von "' ||
        status_text_old || '" zu "' || status_text_new || '" geändert.'
      );
    END IF;

    -- Notify all assignees (except the changer)
    IF assignee_ids IS NOT NULL THEN
      FOR i IN 1..array_length(assignee_ids, 1) LOOP
        IF assignee_ids[i] != auth.uid() AND assignee_ids[i] != todo_creator THEN
          INSERT INTO notifications (
            user_id, todo_id, type, title, message
          ) VALUES (
            assignee_ids[i],
            NEW.id,
            'status_changed',
            'Status geändert',
            changer_name || ' hat den Status von "' || todo_title || '" von "' ||
            status_text_old || '" zu "' || status_text_new || '" geändert.'
          );
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER create_status_change_notification_trigger
  AFTER UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION create_status_change_notification();

-- =====================================================
-- AUTO-INCREMENT priority_order ON TODO INSERT
-- =====================================================

CREATE OR REPLACE FUNCTION set_todo_priority_order()
RETURNS TRIGGER AS $$
DECLARE
  max_order INTEGER;
BEGIN
  -- Get max priority_order for this company
  SELECT COALESCE(MAX(priority_order), 0) INTO max_order
  FROM todos
  WHERE company_id = NEW.company_id;

  -- Set new priority_order
  NEW.priority_order = max_order + 1;

  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_todo_priority_order_trigger
  BEFORE INSERT ON todos
  FOR EACH ROW
  EXECUTE FUNCTION set_todo_priority_order();
