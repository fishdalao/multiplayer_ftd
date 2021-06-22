--- load with 
--- psql "dbname='webdb' user='webdbuser' password='password' host='localhost'" -f schema.sql
DROP TABLE IF EXISTS profile;
DROP TABLE IF EXISTS stats;
DROP TABLE IF EXISTS ftduser;
CREATE TABLE ftduser (
	username VARCHAR(20) PRIMARY KEY,
	password BYTEA NOT NULL
);


CREATE TABLE profile (
	username VARCHAR(20) NOT NULL,
	name VARCHAR(30),
	gender VARCHAR(10),
	CONSTRAINT fk_username FOREIGN KEY(username) REFERENCES ftduser(username) ON DELETE CASCADE  
);

CREATE TABLE stats(
	username VARCHAR(20) NOT NULL,
	kill INT DEFAULT 0,
	death INT DEFAULT 0,
	consumed_bullets INT DEFAULT 0,
	CONSTRAINT fk_username FOREIGN KEY(username) REFERENCES ftduser(username) ON DELETE CASCADE 
);
--- Could have also stored as 128 character hex encoded values
--- select char_length(encode(sha512('abc'), 'hex')); --- returns 128
INSERT INTO ftduser VALUES('user1', sha512('password1'));
INSERT INTO profile VALUES('user1');
INSERT INTO stats VALUES('user1');

INSERT INTO ftduser VALUES('a', sha512('a'));
INSERT INTO profile VALUES('a');
INSERT INTO stats VALUES('a');