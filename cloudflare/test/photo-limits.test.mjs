import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
test('photo storage quotas apply atomically and referenced photos do not expire',()=>{
 const db=new DatabaseSync(':memory:');try{
 for(const file of ['0001_initial.sql','0002_family_rules.sql','0003_gift_topups.sql','0004_gift_qr.sql','0005_photo_limits.sql'])db.exec(readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
 db.exec("INSERT INTO users VALUES('a','demo_a','synthetic','child',1),('b','demo_b','synthetic','child',1)");
 const add=db.prepare('INSERT INTO photos VALUES(?,?,?,?,?)');
 for(let i=0;i<5;i++)add.run('p'+i,'a','image/png',new Uint8Array([137,80,78,71]),1);
 assert.throws(()=>add.run('p5','a','image/png',new Uint8Array([1]),1),/photo_pending_quota/);
 db.exec("INSERT INTO chores(id,user_id,name,photo_id,status,created_at) VALUES('c','a','Demo chore','p0','pending',1)");
 db.exec('DELETE FROM photos WHERE created_at < 100 AND NOT EXISTS(SELECT 1 FROM chores WHERE chores.photo_id=photos.id)');
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM photos').get().n,1);
 add.run('large','a','image/png',new Uint8Array(19999996),1);
 assert.throws(()=>add.run('over','a','image/png',new Uint8Array([1]),1),/photo_user_quota/);
 assert.equal(db.prepare("SELECT SUM(length(data)) AS n FROM photos WHERE user_id='a'").get().n,20000000);
 // Family cap is separate from per-user caps; four already-full child accounts.
 db.exec("INSERT INTO users VALUES('c2','demo_c','synthetic','child',1),('d','demo_d','synthetic','child',1)");
 for(const id of ['b','c2','d'])add.run('full-'+id,id,'image/png',new Uint8Array(20000000),1);
 db.exec("INSERT INTO users VALUES('e','demo_e','synthetic','child',1)");
 assert.throws(()=>add.run('family-over','e','image/png',new Uint8Array([1]),1),/photo_family_quota/);
 assert.equal(db.prepare('SELECT SUM(length(data)) AS n FROM photos').get().n,80000000);
 }finally{db.close();}
});
