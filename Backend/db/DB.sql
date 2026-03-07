CREATE DATABASE IF NOT EXISTS NetMeTube;

use NetMeTube;
CREATE TABLE IF NOT EXISTS users (
	user_id BINARY(16) PRIMARY KEY,
    user_email VARCHAR(255) UNIQUE NOT NULL,
	username VARCHAR(36) NOT NULL,	
	user_password VARCHAR(72) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

use NetMeTube
CREATE TABLE IF NOT EXISTS channels ( 
    channel_id BINARY(16) PRIMARY KEY, 
    user_id BINARY(16) UNIQUE NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    channel_description TEXT,
    profile_pic_path VARCHAR(64),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
); 

use NetMeTube
CREATE TABLE IF NOT EXISTS videos ( 
    video_id BINARY(16) PRIMARY KEY, 
    video_path VARCHAR(64) UNIQUE NOT NULL, 
    thumbnail_path VARCHAR(64),       
    video_title VARCHAR(255) NOT NULL,
    video_description TEXT,
    channel_id BINARY(16) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES channels(channel_id) ON DELETE CASCADE
);


