using AutoMapper;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;

namespace SEP_Restaurant_management.Core.Mappers;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // ── MenuCategory (replaces old Category) ──────────────
        CreateMap<MenuCategory, CategoryDTO>().ReverseMap();
        CreateMap<CreateCategoryDTO, MenuCategory>();
        CreateMap<UpdateCategoryDTO, MenuCategory>();

        CreateMap<MenuCategory, MenuCategoryDTO>().ReverseMap();
        CreateMap<CreateMenuCategoryDTO, MenuCategory>();
        CreateMap<UpdateMenuCategoryDTO, MenuCategory>()
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

        // ── DiningTable ────────────────────────────────────────
        CreateMap<DiningTable, DiningTableDTO>().ReverseMap();
        CreateMap<CreateDiningTableDTO, DiningTable>();
        CreateMap<UpdateDiningTableDTO, DiningTable>()
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

        // ── MenuItem ───────────────────────────────────────────
        CreateMap<MenuItem, MenuItemDTO>().ReverseMap();

        // ── Reservation ────────────────────────────────────────
        CreateMap<Reservation, ReservationDTO>()
            .ForMember(dest => dest.Order, opt => opt.MapFrom(src => src.Order));

        // ── Order ──────────────────────────────────────────────
        CreateMap<Order, OrderDTO>()
            .ForMember(dest => dest.TotalAmount, opt => opt.MapFrom(src => src.OrderItems.Sum(i => i.LineTotal)))
            .ForMember(dest => dest.OrderItems, opt => opt.MapFrom(src => src.OrderItems));

        // ── OrderItem ──────────────────────────────────────────
        CreateMap<OrderItem, OrderItemDTO>();

        // ── Blog & Sliders ─────────────────────────────────────
        CreateMap<BlogCategory, BlogCategoryDTO>().ReverseMap();
        CreateMap<BlogPost, BlogPostDTO>()
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.CategoryName));
        CreateMap<CreateBlogPostDTO, BlogPost>();
        
        CreateMap<Slider, SliderDTO>().ReverseMap();
        CreateMap<CreateSliderDTO, Slider>();
    }
}

