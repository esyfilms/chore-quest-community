-- Gifts stay separate from chore rewards and preserve the existing ledger rows.
CREATE TABLE gift_topups (
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id),
 amount INTEGER NOT NULL CHECK(amount BETWEEN 1 AND 100000),
 name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
 actor_id TEXT NOT NULL REFERENCES users(id),
 created_at INTEGER NOT NULL
);
CREATE INDEX gift_topups_user ON gift_topups(user_id,created_at);
CREATE VIEW wallet_entries AS
 SELECT id,user_id,kind,amount,tip,name,actor_id,source_id,created_at FROM ledger
 UNION ALL
 SELECT id,user_id,'gift' AS kind,amount,0 AS tip,name,actor_id,id AS source_id,created_at FROM gift_topups;
DROP TRIGGER request_reserve;
CREATE TRIGGER request_reserve BEFORE INSERT ON requests BEGIN
 SELECT (CASE WHEN NEW.amount > COALESCE((SELECT SUM(amount) FROM wallet_entries WHERE user_id=NEW.user_id),0) - COALESCE((SELECT SUM(amount) FROM requests WHERE user_id=NEW.user_id AND status='pending'),0) THEN RAISE(ABORT,'insufficient_funds') END);
END;
DROP TRIGGER request_fulfill_guard;
CREATE TRIGGER request_fulfill_guard BEFORE UPDATE OF status ON requests WHEN OLD.status='pending' AND NEW.status='completed' BEGIN
 SELECT (CASE WHEN COALESCE((SELECT SUM(amount) FROM wallet_entries WHERE user_id=NEW.user_id),0) < COALESCE((SELECT SUM(amount) FROM requests WHERE user_id=NEW.user_id AND status='pending'),0) THEN RAISE(ABORT,'insufficient_funds') END);
END;
