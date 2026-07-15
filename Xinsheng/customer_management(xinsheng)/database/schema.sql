-- Customer Management module schema -- Microsoft SQL Server (T-SQL).
-- Covers Sprint 1 stories: register, login/logout, view/update profile,
-- change password, delete account, view order history.
--
-- `Customers` is this module's own table. `foodStall` / `menuItem` /
-- `customerOrder` / `orderItem` below are PLACEHOLDERS that mirror the real
-- tables owned by Matthias's food-ordering-api module (see his models/ for
-- the source of truth) -- keep table/column names IDENTICAL to his so the
-- order-history read keeps working once the databases are merged into one.

IF DB_ID('hawker_centre_db') IS NULL
  CREATE DATABASE hawker_centre_db;
GO

USE hawker_centre_db;
GO

IF OBJECT_ID('dbo.Customers', 'U') IS NULL
CREATE TABLE Customers (
  CustomerID VARCHAR(50) PRIMARY KEY,
  Name VARCHAR(100) NOT NULL,
  Email VARCHAR(150) NOT NULL UNIQUE,
  PasswordHash VARCHAR(255) NOT NULL,
  CreatedAt DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- Placeholder table, owned by the food-ordering module.
IF OBJECT_ID('dbo.foodStall', 'U') IS NULL
CREATE TABLE foodStall (
  StallID VARCHAR(50) PRIMARY KEY,
  StallUnitNo VARCHAR(20),
  StallName VARCHAR(150) NOT NULL,
  StallDesc VARCHAR(255),
  StallStatus VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
GO

-- Placeholder table, owned by the food-ordering module.
IF OBJECT_ID('dbo.menuItem', 'U') IS NULL
CREATE TABLE menuItem (
  itemCode VARCHAR(10) PRIMARY KEY,
  StallID VARCHAR(50) NOT NULL,
  itemName VARCHAR(150) NOT NULL,
  itemDesc VARCHAR(255),
  itemPrice DECIMAL(6, 2) NOT NULL,
  itemCategory VARCHAR(50),
  isAvailable BIT NOT NULL DEFAULT 1,
  itemImage VARCHAR(255),
  FOREIGN KEY (StallID) REFERENCES foodStall(StallID)
);
GO

-- Placeholder table, owned by the food-ordering module. CustomerID FKs into
-- this module's Customers table -- that's the real integration point.
IF OBJECT_ID('dbo.customerOrder', 'U') IS NULL
CREATE TABLE customerOrder (
  OrderID VARCHAR(50) PRIMARY KEY,
  OrderDate DATETIME NOT NULL DEFAULT GETDATE(),
  PmtType VARCHAR(20),
  CustomerID VARCHAR(50) NOT NULL,
  OrderStatus VARCHAR(20) NOT NULL DEFAULT 'received',
  OrderReference VARCHAR(50),
  FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID)
);
GO

-- Placeholder table, owned by the food-ordering module.
IF OBJECT_ID('dbo.orderItem', 'U') IS NULL
CREATE TABLE orderItem (
  OrderID VARCHAR(50) NOT NULL,
  OrderItemNo INT NOT NULL,
  stallID VARCHAR(50) NOT NULL,
  itemCode VARCHAR(10) NOT NULL,
  quantity INT NOT NULL,
  unitPrice DECIMAL(6, 2) NOT NULL,
  PRIMARY KEY (OrderID, OrderItemNo),
  FOREIGN KEY (OrderID) REFERENCES customerOrder(OrderID),
  FOREIGN KEY (stallID) REFERENCES foodStall(StallID),
  FOREIGN KEY (itemCode) REFERENCES menuItem(itemCode)
);
GO

-- Sample data so this module runs and the order-history endpoint returns
-- something during standalone dev/demo.
IF NOT EXISTS (SELECT 1 FROM foodStall)
BEGIN
  INSERT INTO foodStall (StallID, StallUnitNo, StallName, StallStatus) VALUES
    ('STALL_001', '#01-01', 'Ah Hock Noodles', 'ACTIVE'),
    ('STALL_002', '#01-02', 'Lucky Chicken Rice', 'ACTIVE');
END
GO

IF NOT EXISTS (SELECT 1 FROM menuItem)
BEGIN
  INSERT INTO menuItem (itemCode, StallID, itemName, itemPrice, isAvailable) VALUES
    ('ITM_001', 'STALL_001', 'Fishball Noodles', 4.50, 1),
    ('ITM_002', 'STALL_001', 'Wanton Mee', 4.80, 1),
    ('ITM_003', 'STALL_002', 'Chicken Rice', 4.00, 1),
    ('ITM_004', 'STALL_002', 'Iced Milo', 1.80, 1);
END
GO

IF NOT EXISTS (SELECT 1 FROM Customers)
BEGIN
  -- Password for this seed row is 'password123' hashed with bcrypt -- for
  -- local demo/testing only, register real accounts through the API.
  INSERT INTO Customers (CustomerID, Name, Email, PasswordHash) VALUES
    ('CUST_001', 'Demo Customer', 'demo@example.com',
     '$2b$10$CwTycUXWue0Thq9StjUM0uJ8YEsgkJ0kmT8k5nOnbaPRDqx8EOKAO');
END
GO

IF NOT EXISTS (SELECT 1 FROM customerOrder)
BEGIN
  INSERT INTO customerOrder (OrderID, PmtType, CustomerID, OrderStatus, OrderReference) VALUES
    ('ORD_001', 'PayNow', 'CUST_001', 'collected', 'REF-DEMO-001'),
    ('ORD_002', 'Cash', 'CUST_001', 'preparing', 'REF-DEMO-002');

  INSERT INTO orderItem (OrderID, OrderItemNo, stallID, itemCode, quantity, unitPrice) VALUES
    ('ORD_001', 1, 'STALL_001', 'ITM_001', 2, 4.50),
    ('ORD_001', 2, 'STALL_001', 'ITM_002', 1, 4.80),
    ('ORD_002', 1, 'STALL_002', 'ITM_003', 1, 4.00);
END
GO
