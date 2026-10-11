-- Bound persistent photo storage at the database write, including concurrent uploads.
CREATE TRIGGER photo_storage_quota BEFORE INSERT ON photos BEGIN
  SELECT CASE WHEN COALESCE((SELECT SUM(length(data)) FROM photos WHERE user_id=NEW.user_id),0)+length(NEW.data)>20000000 THEN RAISE(ABORT,'photo_user_quota') END;
  SELECT CASE WHEN COALESCE((SELECT SUM(length(data)) FROM photos),0)+length(NEW.data)>80000000 THEN RAISE(ABORT,'photo_family_quota') END;
  SELECT CASE WHEN (SELECT COUNT(*) FROM photos p WHERE p.user_id=NEW.user_id AND NOT EXISTS(SELECT 1 FROM chores c WHERE c.photo_id=p.id))>=5 THEN RAISE(ABORT,'photo_pending_quota') END;
END;
