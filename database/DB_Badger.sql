create database badger;
use badger;

create table user (
userID int auto_increment primary key,
email varchar(255) not null unique,
username varchar(50) not null,
password varchar(50) not null,
profilePicture mediumblob
);

create table contact (
contactID int auto_increment primary key,
userID1 int not null,
userID2 int not null
);

create table message (
messageID int auto_increment primary key,
contactID int not null,
userID int not null,
message varchar(1000) not null,
messageDateTime timestamp not null default current_timestamp
);

alter table contact 
add constraint contact_user1 
foreign key(userID1) 
references user(userID);

alter table contact 
add constraint contact_user2 
foreign key(userID2) 
references user(userID);

alter table message 
add constraint message_contact 
foreign key(contactID) 
references contact(contactID);

alter table message 
add constraint message_user 
foreign key(userID) 
references user(userID);



insert into user (email, username, password) values ('mariopetrovic02@hotmail.com', 'Jeschu', 'root');
insert into user (email, username, password) values ('test-mail-1@hotmail.com', 'User-1', 'password-1');
insert into user (email, username, password) values ('test-mail-2@hotmail.com', 'User-2', 'password-2');
insert into user (email, username, password) values ('test-mail-3@hotmail.com', 'User-3', 'password-3');

insert into contact (userID1, userID2) values (1, 2);
insert into contact (userID1, userID2) values (1, 3);
insert into contact (userID1, userID2) values (4, 1);

insert into message (contactID, userID, message) values (1, 2, 'Hey, ich bin User-1!');
insert into message (contactID, userID, message) values (1, 1, 'Hey, User-1, wie gehts?');

insert into message (contactID, userID, message) values (2, 1, 'Hey User-2, was geht?');
insert into message (contactID, userID, message) values (2, 3, 'Nicht viel Brudi, bei dir?');