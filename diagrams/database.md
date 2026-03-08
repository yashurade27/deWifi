``` mermaid
erDiagram
    User {
        id INT
        name STRING
        email STRING
        password STRING
        role STRING
        walletBalance FLOAT
    }
    WiFiSpot {
        id INT
        ownerId INT
        location STRING
        pricePerHour FLOAT
        bandwidth STRING
        status STRING
    }
    Booking {
        id INT
        userId INT
        wifiSpotId INT
        startTime DATETIME
        endTime DATETIME
        status STRING
        paymentId INT
    }
    Transaction {
        id INT
        userId INT
        bookingId INT
        amount FLOAT
        commission FLOAT
        paymentStatus STRING
    }
    Review {
        id INT
        userId INT
        wifiSpotId INT
        rating INT
        comment STRING
    }

    User ||--o{ WiFiSpot : owns
    User ||--o{ Booking : makes
    WiFiSpot ||--o{ Booking : has
    Booking ||--|| Transaction : generates
    User ||--o{ Review : writes
    WiFiSpot ||--o{ Review : receives
```