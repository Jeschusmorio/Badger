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
messageTime timestamp not null default current_timestamp,
contactID int not null,
userID int not null,
message varchar(1000) not null,
primary key(messageTime, contactID)
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