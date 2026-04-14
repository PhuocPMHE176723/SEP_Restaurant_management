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

public class CategoryServicePostTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly Mock<IMenuCategoryRepository> _menuCategoryRepoMock;
    private readonly Mock<IGenericRepository<MenuCategory>> _menuCategoryGenericRepoMock;
    private readonly CategoryService _service;

    public CategoryServicePostTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
        _menuCategoryRepoMock = new Mock<IMenuCategoryRepository>();
        _menuCategoryGenericRepoMock = new Mock<IGenericRepository<MenuCategory>>();

        _unitOfWorkMock.Setup(u => u.MenuCategories).Returns(_menuCategoryRepoMock.Object);
        _unitOfWorkMock
            .Setup(u => u.GetRepository<MenuCategory>())
            .Returns(_menuCategoryGenericRepoMock.Object);

        _service = new CategoryService(_unitOfWorkMock.Object, _mapperMock.Object);
    }

    // ─────────────────────────────────────────────
    //  FUNC: CreateCategoryAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "CreateCategoryAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_CreateCategoryAsync_ValidInput_ReturnsCreatedCategory()
    {
        var createDto = new CreateCategoryDTO { CategoryName = "C" };
        var category = new MenuCategory { CategoryId = 3, CategoryName = "ignored" };
        var dto = new CategoryDTO { CategoryId = 3, CategoryName = "C" };

        _menuCategoryRepoMock.Setup(r => r.IsNameExistsAsync("C", null)).ReturnsAsync(false);
        _mapperMock.Setup(m => m.Map<MenuCategory>(createDto)).Returns(category);
        _mapperMock.Setup(m => m.Map<CategoryDTO>(category)).Returns(dto);
        _menuCategoryGenericRepoMock.Setup(r => r.AddAsync(category)).Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.CreateCategoryAsync(createDto);

        Assert.Equal("C", result.CategoryName);
        _menuCategoryGenericRepoMock.Verify(r => r.AddAsync(It.IsAny<MenuCategory>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "CreateCategoryAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_CreateCategoryAsync_EmptyName_ThrowsInvalidOperationException()
    {
        var createDto = new CreateCategoryDTO { CategoryName = "   " };
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.CreateCategoryAsync(createDto)
        );
    }

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "CreateCategoryAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_CreateCategoryAsync_DuplicateName_ThrowsInvalidOperationException()
    {
        var createDto = new CreateCategoryDTO { CategoryName = "D" };
        _menuCategoryRepoMock.Setup(r => r.IsNameExistsAsync("D", null)).ReturnsAsync(true);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.CreateCategoryAsync(createDto)
        );
    }

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "CreateCategoryAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "A")]
    public async Task UTCID04_CreateCategoryAsync_SaveChangesThrows_PropagatesException()
    {
        var createDto = new CreateCategoryDTO { CategoryName = "E" };
        var category = new MenuCategory { CategoryId = 10, CategoryName = "ignored" };

        _menuCategoryRepoMock.Setup(r => r.IsNameExistsAsync("E", null)).ReturnsAsync(false);
        _mapperMock.Setup(m => m.Map<MenuCategory>(createDto)).Returns(category);
        _menuCategoryGenericRepoMock.Setup(r => r.AddAsync(category)).Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ThrowsAsync(new Exception("DB error"));

        await Assert.ThrowsAsync<Exception>(() => _service.CreateCategoryAsync(createDto));
    }

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "CreateCategoryAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_CreateCategoryAsync_NameHasSpaces_TrimsAndCreates()
    {
        var createDto = new CreateCategoryDTO { CategoryName = "  Cakes  " };
        var category = new MenuCategory { CategoryId = 11, CategoryName = "ignored" };

        string? nameExistsChecked = null;
        _menuCategoryRepoMock
            .Setup(r => r.IsNameExistsAsync(It.IsAny<string>(), null))
            .Callback<string, int?>((name, _) => nameExistsChecked = name)
            .ReturnsAsync(false);

        _mapperMock.Setup(m => m.Map<MenuCategory>(createDto)).Returns(category);
        _menuCategoryGenericRepoMock.Setup(r => r.AddAsync(category)).Returns(Task.CompletedTask);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        _mapperMock
            .Setup(m => m.Map<CategoryDTO>(It.IsAny<MenuCategory>()))
            .Returns<MenuCategory>(c => new CategoryDTO
            {
                CategoryId = c.CategoryId,
                CategoryName = c.CategoryName,
            });

        var result = await _service.CreateCategoryAsync(createDto);

        Assert.Equal("Cakes", nameExistsChecked);
        Assert.Equal("Cakes", result.CategoryName);
    }

    // ─────────────────────────────────────────────
    //  FUNC: UpdateCategoryAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "UpdateCategoryAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_UpdateCategoryAsync_ExistingId_SaveChangesPositive_ReturnsTrue()
    {
        var updateDto = new UpdateCategoryDTO { CategoryName = "E" };
        var category = new MenuCategory { CategoryId = 4, CategoryName = "Old" };

        _menuCategoryGenericRepoMock.Setup(r => r.GetByIdAsync(4)).ReturnsAsync(category);
        _menuCategoryRepoMock.Setup(r => r.IsNameExistsAsync("E", 4)).ReturnsAsync(false);
        _mapperMock.Setup(m => m.Map(updateDto, category));
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.UpdateCategoryAsync(4, updateDto);

        Assert.True(result);
        _menuCategoryGenericRepoMock.Verify(r => r.Update(category), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "UpdateCategoryAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_UpdateCategoryAsync_NonExistingId_ReturnsFalse()
    {
        var updateDto = new UpdateCategoryDTO { CategoryName = "F" };
        _menuCategoryGenericRepoMock
            .Setup(r => r.GetByIdAsync(99))
            .ReturnsAsync((MenuCategory?)null);

        var result = await _service.UpdateCategoryAsync(99, updateDto);

        Assert.False(result);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
        _menuCategoryGenericRepoMock.Verify(r => r.Update(It.IsAny<MenuCategory>()), Times.Never);
    }

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "UpdateCategoryAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_UpdateCategoryAsync_EmptyName_ThrowsInvalidOperationException()
    {
        var updateDto = new UpdateCategoryDTO { CategoryName = "   " };
        var category = new MenuCategory { CategoryId = 4, CategoryName = "Old" };
        _menuCategoryGenericRepoMock.Setup(r => r.GetByIdAsync(4)).ReturnsAsync(category);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.UpdateCategoryAsync(4, updateDto)
        );
    }

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "UpdateCategoryAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "A")]
    public async Task UTCID04_UpdateCategoryAsync_DuplicateName_ThrowsInvalidOperationException()
    {
        var updateDto = new UpdateCategoryDTO { CategoryName = "NewName" };
        var category = new MenuCategory { CategoryId = 4, CategoryName = "Old" };
        _menuCategoryGenericRepoMock.Setup(r => r.GetByIdAsync(4)).ReturnsAsync(category);
        _menuCategoryRepoMock.Setup(r => r.IsNameExistsAsync("NewName", 4)).ReturnsAsync(true);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.UpdateCategoryAsync(4, updateDto)
        );
    }

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "UpdateCategoryAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_UpdateCategoryAsync_SaveChangesZero_ReturnsFalse()
    {
        var updateDto = new UpdateCategoryDTO { CategoryName = "E" };
        var category = new MenuCategory { CategoryId = 4, CategoryName = "Old" };

        _menuCategoryGenericRepoMock.Setup(r => r.GetByIdAsync(4)).ReturnsAsync(category);
        _menuCategoryRepoMock.Setup(r => r.IsNameExistsAsync("E", 4)).ReturnsAsync(false);
        _mapperMock.Setup(m => m.Map(updateDto, category));
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(0);

        var result = await _service.UpdateCategoryAsync(4, updateDto);

        Assert.False(result);
    }

    // ─────────────────────────────────────────────
    //  FUNC: DeleteCategoryAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "DeleteCategoryAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_DeleteCategoryAsync_ExistingId_SaveChangesPositive_ReturnsTrue()
    {
        var category = new MenuCategory { CategoryId = 5, CategoryName = "G" };
        _menuCategoryGenericRepoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(category);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.DeleteCategoryAsync(5);

        Assert.True(result);
        _menuCategoryGenericRepoMock.Verify(r => r.Delete(category), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "DeleteCategoryAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "B")]
    public async Task UTCID02_DeleteCategoryAsync_ExistingId_SaveChangesZero_ReturnsFalse()
    {
        var category = new MenuCategory { CategoryId = 5, CategoryName = "G" };
        _menuCategoryGenericRepoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(category);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ReturnsAsync(0);

        var result = await _service.DeleteCategoryAsync(5);

        Assert.False(result);
        _menuCategoryGenericRepoMock.Verify(r => r.Delete(category), Times.Once);
    }

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "DeleteCategoryAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_DeleteCategoryAsync_NonExistingId_ReturnsFalse()
    {
        _menuCategoryGenericRepoMock
            .Setup(r => r.GetByIdAsync(99))
            .ReturnsAsync((MenuCategory?)null);

        var result = await _service.DeleteCategoryAsync(99);

        Assert.False(result);
        _menuCategoryGenericRepoMock.Verify(r => r.Delete(It.IsAny<MenuCategory>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "DeleteCategoryAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "A")]
    public async Task UTCID04_DeleteCategoryAsync_RepoThrows_PropagatesException()
    {
        _menuCategoryGenericRepoMock
            .Setup(r => r.GetByIdAsync(5))
            .ThrowsAsync(new Exception("DB error"));
        await Assert.ThrowsAsync<Exception>(() => _service.DeleteCategoryAsync(5));
    }

    [Fact]
    [Trait("CodeModule", "Category")]
    [Trait("Method", "DeleteCategoryAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "A")]
    public async Task UTCID05_DeleteCategoryAsync_SaveThrows_PropagatesException()
    {
        var category = new MenuCategory { CategoryId = 5, CategoryName = "G" };
        _menuCategoryGenericRepoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(category);
        _unitOfWorkMock.Setup(u => u.SaveChangesAsync()).ThrowsAsync(new Exception("DB error"));

        await Assert.ThrowsAsync<Exception>(() => _service.DeleteCategoryAsync(5));
    }
}
