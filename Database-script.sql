CREATE DATABASE reservroom;


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SELECT user, host, plugin FROM mysql.user;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'Ottocska2003';
FLUSH PRIVILEGES;

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hotel_id VARCHAR(100) NOT NULL,
    hotel_name VARCHAR(255) NOT NULL,
    hotel_address VARCHAR(255),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_adults INT DEFAULT 1,
    num_children INT DEFAULT 0,
    num_rooms INT DEFAULT 1,
    total_price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EUR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  hotel_id VARCHAR(100),
  hotel_name VARCHAR(255),
  hotel_address VARCHAR(255),
  hotel_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE booking_attractions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    attraction_name VARCHAR(255) NOT NULL,
    attraction_description TEXT,
    price DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'EUR',
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);


select * from favorites;

ALTER TABLE booking_attractions ADD COLUMN slug VARCHAR(255);

ALTER TABLE bookings
ADD COLUMN hotel_image_url TEXT;
DELETE FROM bookings WHERE id = 1 ;
select * from users;
select * from bookings;
select * from booking_attractions;