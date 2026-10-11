CREATE TABLE gift_offers (
 id TEXT PRIMARY KEY,
 token_hash TEXT NOT NULL UNIQUE,
 user_id TEXT NOT NULL REFERENCES users(id),
 amount INTEGER NOT NULL CHECK(amount BETWEEN 1 AND 100000),
 name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
 actor_id TEXT NOT NULL REFERENCES users(id),
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','claimed'))
);
CREATE INDEX gift_offers_user ON gift_offers(user_id,created_at);
CREATE TRIGGER gift_offer_credit AFTER UPDATE OF status ON gift_offers WHEN OLD.status='pending' AND NEW.status='claimed' BEGIN INSERT INTO gift_topups(id,user_id,amount,name,actor_id,created_at) VALUES(NEW.id,NEW.user_id,NEW.amount,NEW.name,NEW.actor_id,unixepoch()); END;
