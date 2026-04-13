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

public class MenuCategoryServicePostTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IMenuCategoryRepository> _menuCategoryRepoMock;
    private readonly MenuCategoryService _service;

    public MenuCategoryServicePostTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
        _menuCategoryRepoMock = new Mock<IMenuCategoryRepository>();

        _unitOfWorkMock.Setup(u => u.MenuCategories).Returns(_menuCategoryRepoMock.Object);
        _service = new MenuCategoryService(_unitOfWorkMock.Object, _mapperMock.Object);
    }

    // ─────────────────────────────────────────────
    //  FUNC: CreateAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_CreateAsync_ValidInput_ReturnsCreatedCategory()
    {
        var createDto = new CreateMenuCategoryDTO { CategoryName = "Desserts" };
        var entity = new MenuCategory { CategoryId = 1, CategoryName = "ignored" };
        var dto = new MenuCategoryDTO { CategoryId = 1, CategoryName = "Desserts" };

        _menuCategoryRepoMock.Setup(r => r.IsNameExistsAsync("Desserts", null)).ReturnsAsync(false);
        _mapperMock.Setup(m => m.Map<MenuCategory>(createDto)).Returns(entity);
        _mapperMock.Setup(m => m.Map<MenuCategoryDTO>(entity)).Returns(dto);
        _menuCategoryRepoMock.Setup(r => r.AddAsync(entity)).Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.CreateAsync(createDto);

        Assert.Equal("Desserts", result.CategoryName);
        _menuCategoryRepoMock.Verify(r => r.AddAsync(It.IsAny<MenuCategory>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_CreateAsync_EmptyName_ThrowsInvalidOperationException()
    {
        var createDto = new CreateMenuCategoryDTO { CategoryName = "   " };
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAsync(createDto));
    }

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_CreateAsync_DuplicateName_ThrowsInvalidOperationException()
    {
        var createDto = new CreateMenuCategoryDTO { CategoryName = "Desserts" };
        _menuCategoryRepoMock.Setup(r => r.IsNameExistsAsync("Desserts", null)).ReturnsAsync(true);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAsync(createDto));
    }

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "A")]
    public async Task UTCID04_CreateAsync_SaveChangesThrows_PropagatesException()
    {
        var createDto = new CreateMenuCategoryDTO { CategoryName = "Drinks" };
        var entity = new MenuCategory { CategoryId = 2, CategoryName = "ignored" };

        _menuCategoryRepoMock.Setup(r => r.IsNameExistsAsync("Drinks", null)).ReturnsAsync(false);
        _mapperMock.Setup(m => m.Map<MenuCategory>(createDto)).Returns(entity);
        _menuCategoryRepoMock.Setup(r => r.AddAsync(entity)).Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ThrowsAsync(new Exception("DB error"));

        await Assert.ThrowsAsync<Exception>(() => _service.CreateAsync(createDto));
    }

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_CreateAsync_NameHasSpaces_TrimsAndCreates()
    {
        var createDto = new CreateMenuCategoryDTO { CategoryName = "  Drinks  " };
        var entity = new MenuCategory { CategoryId = 3, CategoryName = "ignored" };

        string? nameChecked = null;
        _menuCategoryRepoMock
            .Setup(r => r.IsNameExistsAsync(It.IsAny<string>(), null))
            .Callback<string, int?>((name, _) => nameChecked = name)
            .ReturnsAsync(false);
        _mapperMock.Setup(m => m.Map<MenuCategory>(createDto)).Returns(entity);
        _menuCategoryRepoMock.Setup(r => r.AddAsync(entity)).Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
        _mapperMock
            .Setup(m => m.Map<MenuCategoryDTO>(It.IsAny<MenuCategory>()))
            .Returns<MenuCategory>(c => new MenuCategoryDTO
            {
                CategoryId = c.CategoryId,
                CategoryName = c.CategoryName,
            });

        var result = await _service.CreateAsync(createDto);

        Assert.Equal("Drinks", nameChecked);
        Assert.Equal("Drinks", result.CategoryName);
    }

    // ─────────────────────────────────────────────
    //  FUNC: UpdateAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_UpdateAsync_ExistingId_SaveChangesPositive_ReturnsTrue()
    {
        var updateDto = new UpdateMenuCategoryDTO { CategoryName = "NewName" };
        var entity = new MenuCategory { CategoryId = 10, CategoryName = "Old" };

        _menuCategoryRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(entity);
        _menuCategoryRepoMock.Setup(r => r.IsNameExistsAsync("NewName", 10)).ReturnsAsync(false);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.UpdateAsync(10, updateDto);

        Assert.True(result);
        Assert.Equal("NewName", entity.CategoryName);
        _menuCategoryRepoMock.Verify(r => r.Update(entity), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_UpdateAsync_NonExistingId_ReturnsFalse()
    {
        var updateDto = new UpdateMenuCategoryDTO { CategoryName = "X" };
        _menuCategoryRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((MenuCategory?)null);

        var result = await _service.UpdateAsync(999, updateDto);

        Assert.False(result);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        _menuCategoryRepoMock.Verify(r => r.Update(It.IsAny<MenuCategory>()), Times.Never);
    }

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_UpdateAsync_EmptyName_ThrowsInvalidOperationException()
    {
        var updateDto = new UpdateMenuCategoryDTO { CategoryName = "   " };
        var entity = new MenuCategory { CategoryId = 10, CategoryName = "Old" };
        _menuCategoryRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(entity);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.UpdateAsync(10, updateDto)
        );
    }

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "A")]
    public async Task UTCID04_UpdateAsync_DuplicateName_ThrowsInvalidOperationException()
    {
        var updateDto = new UpdateMenuCategoryDTO { CategoryName = "Dup" };
        var entity = new MenuCategory { CategoryId = 10, CategoryName = "Old" };
        _menuCategoryRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(entity);
        _menuCategoryRepoMock.Setup(r => r.IsNameExistsAsync("Dup", 10)).ReturnsAsync(true);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.UpdateAsync(10, updateDto)
        );
    }

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_UpdateAsync_SaveChangesZero_ReturnsFalse()
    {
        var updateDto = new UpdateMenuCategoryDTO { CategoryName = "NewName" };
        var entity = new MenuCategory { CategoryId = 10, CategoryName = "Old" };

        _menuCategoryRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(entity);
        _menuCategoryRepoMock.Setup(r => r.IsNameExistsAsync("NewName", 10)).ReturnsAsync(false);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(0);

        var result = await _service.UpdateAsync(10, updateDto);

        Assert.False(result);
    }

    // ─────────────────────────────────────────────
    //  FUNC: DeleteAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_DeleteAsync_ExistingId_SaveChangesPositive_ReturnsTrue()
    {
        var entity = new MenuCategory
        {
            CategoryId = 20,
            CategoryName = "A",
            IsActive = true,
        };
        _menuCategoryRepoMock.Setup(r => r.GetByIdAsync(20)).ReturnsAsync(entity);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.DeleteAsync(20);

        Assert.True(result);
        Assert.False(entity.IsActive);
        _menuCategoryRepoMock.Verify(r => r.Update(entity), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "B")]
    public async Task UTCID02_DeleteAsync_ExistingId_SaveChangesZero_ReturnsFalse()
    {
        var entity = new MenuCategory
        {
            CategoryId = 20,
            CategoryName = "A",
            IsActive = true,
        };
        _menuCategoryRepoMock.Setup(r => r.GetByIdAsync(20)).ReturnsAsync(entity);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(0);

        var result = await _service.DeleteAsync(20);

        Assert.False(result);
        Assert.False(entity.IsActive);
        _menuCategoryRepoMock.Verify(r => r.Update(entity), Times.Once);
    }

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_DeleteAsync_NonExistingId_ReturnsFalse()
    {
        _menuCategoryRepoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((MenuCategory?)null);

        var result = await _service.DeleteAsync(999);

        Assert.False(result);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        _menuCategoryRepoMock.Verify(r => r.Update(It.IsAny<MenuCategory>()), Times.Never);
    }

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "A")]
    public async Task UTCID04_DeleteAsync_GetByIdThrows_PropagatesException()
    {
        _menuCategoryRepoMock.Setup(r => r.GetByIdAsync(20)).ThrowsAsync(new Exception("DB error"));
        await Assert.ThrowsAsync<Exception>(() => _service.DeleteAsync(20));
    }

    [Fact]
    [Trait("CodeModule", "MenuCategory")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "A")]
    public async Task UTCID05_DeleteAsync_SaveChangesThrows_PropagatesException()
    {
        var entity = new MenuCategory
        {
            CategoryId = 20,
            CategoryName = "A",
            IsActive = true,
        };
        _menuCategoryRepoMock.Setup(r => r.GetByIdAsync(20)).ReturnsAsync(entity);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ThrowsAsync(new Exception("DB error"));

        await Assert.ThrowsAsync<Exception>(() => _service.DeleteAsync(20));
    }
}
