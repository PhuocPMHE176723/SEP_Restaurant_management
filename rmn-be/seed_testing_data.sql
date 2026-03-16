-- dynamic lookup for IDs to avoid foreign key conflicts
DECLARE @StaffId BIGINT, @TableId INT, @ItemId1 INT, @ItemId2 INT, @OrderId BIGINT;

-- 1. Find a staff member
SELECT TOP 1 @StaffId = StaffId FROM Staff WHERE WorkingStatus = 'ACTIVE';

-- 2. Find table T1-01
SELECT @TableId = TableId FROM DiningTables WHERE TableCode = 'T1-01';

-- 3. Find some menu items
SELECT TOP 1 @ItemId1 = ItemId FROM MenuItems WHERE IsActive = 1 ORDER BY ItemId;
SELECT TOP 1 @ItemId2 = ItemId FROM MenuItems WHERE IsActive = 1 AND ItemId <> @ItemId1 ORDER BY ItemId;

-- 4. Sample Customers
INSERT INTO Customers (FullName, Phone, CreatedAt) 
VALUES (N'Nguyễn Văn A', '0987654321', GETUTCDATE()),
       (N'Trần Thị B', '0123456789', GETUTCDATE());

-- 5. Sample Reservations (Today)
INSERT INTO Reservations (CustomerName, CustomerPhone, PartySize, ReservedAt, Status, Note, CreatedAt)
VALUES (N'Lê Văn C', '0999888777', 4, DATEADD(hour, 19, CAST(CAST(GETUTCDATE() AS DATE) AS DATETIME)), 'CONFIRMED', N'Gần cửa sổ', GETUTCDATE()),
       (N'Phạm Quang D', '0888777666', 2, DATEADD(hour, 20, CAST(CAST(GETUTCDATE() AS DATE) AS DATETIME)), 'PENDING', N'Lãng mạn', GETUTCDATE());

-- 6. Active Order on Table T1-01 (using dynamic IDs)
IF @StaffId IS NOT NULL AND @TableId IS NOT NULL
BEGIN
    INSERT INTO Orders (OrderCode, TableId, OrderType, Status, OpenedAt, CreatedByStaffId, Note)
    VALUES ('ORD-WALK-TEST-01', @TableId, 'DINE_IN', 'SENT_TO_KITCHEN', GETUTCDATE(), @StaffId, N'Test order for kitchen queue');
    
    SET @OrderId = SCOPE_IDENTITY();

    -- Insert Order Items if we found menu items
    IF @ItemId1 IS NOT NULL
        INSERT INTO OrderItems (OrderId, ItemId, ItemNameSnapshot, Quantity, UnitPrice, Status, CreatedAt)
        SELECT @OrderId, ItemId, ItemName, 2, BasePrice, 'PENDING', GETUTCDATE() FROM MenuItems WHERE ItemId = @ItemId1;

    IF @ItemId2 IS NOT NULL
        INSERT INTO OrderItems (OrderId, ItemId, ItemNameSnapshot, Quantity, UnitPrice, Status, CreatedAt)
        SELECT @OrderId, ItemId, ItemName, 1, BasePrice, 'IN_PROGRESS', GETUTCDATE() FROM MenuItems WHERE ItemId = @ItemId2;

    UPDATE DiningTables SET Status = 'OCCUPIED' WHERE TableId = @TableId;
END
ELSE
BEGIN
    PRINT 'Error: Could not find valid Staff or Table (T1-01). Please ensure you have seeded basic data via DbInitializer first.';
END
