using System;
using System.Threading.Tasks;
using AutoMapper;
using Moq;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;
using SEP_Restaurant_management.Core.Services.Implementation;
using Xunit;

namespace rmn_be.Tests;

public class DiningTableServicePostTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IDiningTableRepository> _diningTableRepoMock;
    private readonly DiningTableService _service;

    public DiningTableServicePostTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
        _diningTableRepoMock = new Mock<IDiningTableRepository>();

        _unitOfWorkMock.Setup(u => u.DiningTables).Returns(_diningTableRepoMock.Object);
        _service = new DiningTableService(_unitOfWorkMock.Object, _mapperMock.Object);
    }

    // ─────────────────────────────────────────────
    //  FUNC: CreateAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_CreateAsync_ValidInput_ReturnsCreatedTable()
    {
        var createDto = new CreateDiningTableDTO
        {
            TableCode = "T01",
            TableName = "A",
            Capacity = 4,
        };
        var entity = new DiningTable { TableId = 1, TableCode = "T01" };
        var dto = new DiningTableDTO { TableId = 1, TableCode = "T01" };

        _diningTableRepoMock.Setup(r => r.IsCodeExistsAsync("T01", null)).ReturnsAsync(false);
        _mapperMock.Setup(m => m.Map<DiningTable>(createDto)).Returns(entity);
        _diningTableRepoMock.Setup(r => r.AddAsync(entity)).Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
        _mapperMock.Setup(m => m.Map<DiningTableDTO>(entity)).Returns(dto);

        var result = await _service.CreateAsync(createDto);

        Assert.Equal("T01", result.TableCode);
        _diningTableRepoMock.Verify(r => r.AddAsync(It.IsAny<DiningTable>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_CreateAsync_DuplicateTableCode_ThrowsInvalidOperationException()
    {
        var createDto = new CreateDiningTableDTO
        {
            TableCode = "T01",
            TableName = "A",
            Capacity = 4,
        };
        _diningTableRepoMock.Setup(r => r.IsCodeExistsAsync("T01", null)).ReturnsAsync(true);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAsync(createDto));
    }

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_CreateAsync_AddThrows_PropagatesException()
    {
        var createDto = new CreateDiningTableDTO
        {
            TableCode = "T02",
            TableName = "B",
            Capacity = 2,
        };
        var entity = new DiningTable { TableId = 2, TableCode = "T02" };

        _diningTableRepoMock.Setup(r => r.IsCodeExistsAsync("T02", null)).ReturnsAsync(false);
        _mapperMock.Setup(m => m.Map<DiningTable>(createDto)).Returns(entity);
        _diningTableRepoMock.Setup(r => r.AddAsync(entity)).ThrowsAsync(new Exception("DB error"));

        await Assert.ThrowsAsync<Exception>(() => _service.CreateAsync(createDto));
    }

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "A")]
    public async Task UTCID04_CreateAsync_SaveChangesThrows_PropagatesException()
    {
        var createDto = new CreateDiningTableDTO
        {
            TableCode = "T03",
            TableName = "C",
            Capacity = 6,
        };
        var entity = new DiningTable { TableId = 3, TableCode = "T03" };

        _diningTableRepoMock.Setup(r => r.IsCodeExistsAsync("T03", null)).ReturnsAsync(false);
        _mapperMock.Setup(m => m.Map<DiningTable>(createDto)).Returns(entity);
        _diningTableRepoMock.Setup(r => r.AddAsync(entity)).Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ThrowsAsync(new Exception("DB error"));

        await Assert.ThrowsAsync<Exception>(() => _service.CreateAsync(createDto));
    }

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_CreateAsync_SaveChangesZero_ReturnsDtoButStillCallsSave()
    {
        var createDto = new CreateDiningTableDTO
        {
            TableCode = "T04",
            TableName = "D",
            Capacity = 1,
        };
        var entity = new DiningTable { TableId = 4, TableCode = "T04" };

        _diningTableRepoMock.Setup(r => r.IsCodeExistsAsync("T04", null)).ReturnsAsync(false);
        _mapperMock.Setup(m => m.Map<DiningTable>(createDto)).Returns(entity);
        _diningTableRepoMock.Setup(r => r.AddAsync(entity)).Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(0);
        _mapperMock
            .Setup(m => m.Map<DiningTableDTO>(entity))
            .Returns(new DiningTableDTO { TableId = 4, TableCode = "T04" });

        var result = await _service.CreateAsync(createDto);

        Assert.Equal("T04", result.TableCode);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    // ─────────────────────────────────────────────
    //  FUNC: UpdateAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_UpdateAsync_ExistingId_SaveChangesPositive_ReturnsTrue()
    {
        var updateDto = new UpdateDiningTableDTO { TableCode = "T10", TableName = "New" };
        var entity = new DiningTable
        {
            TableId = 10,
            TableCode = "T09",
            TableName = "Old",
        };

        _diningTableRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(entity);
        _diningTableRepoMock.Setup(r => r.IsCodeExistsAsync("T10", 10)).ReturnsAsync(false);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.UpdateAsync(10, updateDto);

        Assert.True(result);
        Assert.Equal("T10", entity.TableCode);
        Assert.Equal("New", entity.TableName);
        _diningTableRepoMock.Verify(r => r.Update(entity), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_UpdateAsync_NonExistingId_ReturnsFalse()
    {
        var updateDto = new UpdateDiningTableDTO { TableCode = "T10" };
        _diningTableRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((DiningTable?)null);

        var result = await _service.UpdateAsync(999, updateDto);

        Assert.False(result);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        _diningTableRepoMock.Verify(r => r.Update(It.IsAny<DiningTable>()), Times.Never);
    }

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_UpdateAsync_DuplicateTableCode_ThrowsInvalidOperationException()
    {
        var updateDto = new UpdateDiningTableDTO { TableCode = "T10" };
        var entity = new DiningTable { TableId = 10, TableCode = "T09" };

        _diningTableRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(entity);
        _diningTableRepoMock.Setup(r => r.IsCodeExistsAsync("T10", 10)).ReturnsAsync(true);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.UpdateAsync(10, updateDto)
        );
    }

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_UpdateAsync_SaveChangesZero_ReturnsFalse()
    {
        var updateDto = new UpdateDiningTableDTO { TableName = "OnlyName" };
        var entity = new DiningTable
        {
            TableId = 10,
            TableCode = "T09",
            TableName = "Old",
        };

        _diningTableRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(entity);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(0);

        var result = await _service.UpdateAsync(10, updateDto);

        Assert.False(result);
        Assert.Equal("OnlyName", entity.TableName);
        _diningTableRepoMock.Verify(r => r.Update(entity), Times.Once);
    }

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "A")]
    public async Task UTCID05_UpdateAsync_SaveChangesThrows_PropagatesException()
    {
        var updateDto = new UpdateDiningTableDTO { TableName = "X" };
        var entity = new DiningTable { TableId = 10, TableCode = "T09" };

        _diningTableRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(entity);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ThrowsAsync(new Exception("DB error"));

        await Assert.ThrowsAsync<Exception>(() => _service.UpdateAsync(10, updateDto));
    }

    // ─────────────────────────────────────────────
    //  FUNC: DeleteAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_DeleteAsync_ExistingId_SaveChangesPositive_ReturnsTrue()
    {
        var entity = new DiningTable
        {
            TableId = 20,
            TableCode = "T20",
            IsActive = true,
        };
        _diningTableRepoMock.Setup(r => r.GetByIdAsync(20)).ReturnsAsync(entity);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.DeleteAsync(20);

        Assert.True(result);
        Assert.False(entity.IsActive);
        _diningTableRepoMock.Verify(r => r.Update(entity), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "B")]
    public async Task UTCID02_DeleteAsync_ExistingId_SaveChangesZero_ReturnsFalse()
    {
        var entity = new DiningTable
        {
            TableId = 20,
            TableCode = "T20",
            IsActive = true,
        };
        _diningTableRepoMock.Setup(r => r.GetByIdAsync(20)).ReturnsAsync(entity);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(0);

        var result = await _service.DeleteAsync(20);

        Assert.False(result);
        Assert.False(entity.IsActive);
        _diningTableRepoMock.Verify(r => r.Update(entity), Times.Once);
    }

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_DeleteAsync_NonExistingId_ReturnsFalse()
    {
        _diningTableRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((DiningTable?)null);

        var result = await _service.DeleteAsync(999);

        Assert.False(result);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        _diningTableRepoMock.Verify(r => r.Update(It.IsAny<DiningTable>()), Times.Never);
    }

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "A")]
    public async Task UTCID04_DeleteAsync_GetByIdThrows_PropagatesException()
    {
        _diningTableRepoMock.Setup(r => r.GetByIdAsync(20)).ThrowsAsync(new Exception("DB error"));
        await Assert.ThrowsAsync<Exception>(() => _service.DeleteAsync(20));
    }

    [Fact]
    [Trait("CodeModule", "DiningTable")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "A")]
    public async Task UTCID05_DeleteAsync_SaveChangesThrows_PropagatesException()
    {
        var entity = new DiningTable
        {
            TableId = 20,
            TableCode = "T20",
            IsActive = true,
        };
        _diningTableRepoMock.Setup(r => r.GetByIdAsync(20)).ReturnsAsync(entity);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ThrowsAsync(new Exception("DB error"));

        await Assert.ThrowsAsync<Exception>(() => _service.DeleteAsync(20));
    }
}
