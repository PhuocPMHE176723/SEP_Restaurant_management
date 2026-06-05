using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Middlewares;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class DiningTableService : IDiningTableService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly SepDatabaseContext _context;

    public DiningTableService(IUnitOfWork unitOfWork, IMapper mapper, SepDatabaseContext context)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _context = context;
    }

    //public async Task<IEnumerable<DiningTableDTO>> GetAllAsync()
    //{
    //    // Lấy tất cả bàn active, đã sắp xếp theo TableCode
    //    var tables = await _unitOfWork.DiningTables.GetActiveTablesAsync();
    //    return _mapper.Map<IEnumerable<DiningTableDTO>>(tables);
    //}
    public async Task<IEnumerable<DiningTableDTO>> GetAllAsync()
    {
        var tables = await _unitOfWork.DiningTables.GetActiveTablesAsync();

        var currentShift = GetShiftKey(DateTimeHelper.VietnamNow());

        var orderTables = await _context.OrderTables
            .Include(ot => ot.Order)
                .ThenInclude(o => o.Reservation)
            .Where(ot =>
                ot.Order != null &&
                ot.Order.Reservation != null &&
                ot.Order.Reservation.Status != "CANCELLED" &&
                ot.Order.Reservation.Status != "COMPLETED" &&
                ot.Order.Reservation.Status != "NO_SHOW"
            )
            .ToListAsync();
        var reservedTableIds = orderTables
            .Where(ot =>
                GetShiftKey(ot.Order!.Reservation!.ReservedAt) == currentShift
            )
            .Select(ot => ot.TableId)
            .Distinct()
            .ToList();

        var result = tables.Select(t => new DiningTableDTO
        {
            TableId = t.TableId,
            TableCode = t.TableCode,
            TableName = t.TableName,
            Capacity = t.Capacity,
            Status = t.Status,
            IsActive = t.IsActive,

            // Quan trọng
            IsReserved = reservedTableIds.Contains(t.TableId)
        });

        return result;
    }

    public async Task<IEnumerable<DiningTableWithOrderDTO>> GetAllWithOrdersAsync()
    {
        var tables = await _unitOfWork.DiningTables.GetTablesWithCurrentOrdersAsync();
        return _mapper.Map<IEnumerable<DiningTableWithOrderDTO>>(tables);
    }

    public async Task<DiningTableDTO?> GetByIdAsync(int id)
    {
        var table = await _unitOfWork.DiningTables.GetByIdAsync(id);
        return table == null ? null : _mapper.Map<DiningTableDTO>(table);
    }

    public async Task<DiningTableDTO> CreateAsync(CreateDiningTableDTO dto)
    {
        // Kiểm tra trùng TableCode trước khi tạo
        if (await _unitOfWork.DiningTables.IsCodeExistsAsync(dto.TableCode))
            throw new InvalidOperationException($"TableCode '{dto.TableCode}' already exists.");

        var table = _mapper.Map<DiningTable>(dto);
        await _unitOfWork.DiningTables.AddAsync(table);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<DiningTableDTO>(table);
    }

    public async Task<bool> UpdateAsync(int id, UpdateDiningTableDTO dto)
    {
        var table = await _unitOfWork.DiningTables.GetByIdAsync(id);
        if (table == null)
            return false;

        // Kiểm tra trùng TableCode với bàn khác
        if (
            dto.TableCode != null
            && await _unitOfWork.DiningTables.IsCodeExistsAsync(dto.TableCode, excludeId: id)
        )
            throw new InvalidOperationException($"TableCode '{dto.TableCode}' already exists.");

        if (dto.TableCode != null)
            table.TableCode = dto.TableCode;
        if (dto.TableName != null)
            table.TableName = dto.TableName;
        if (dto.Capacity.HasValue)
            table.Capacity = dto.Capacity.Value;
        if (dto.Status != null)
            table.Status = dto.Status;
        if (dto.IsActive.HasValue)
            table.IsActive = dto.IsActive.Value;

        _unitOfWork.DiningTables.Update(table);
        return await _unitOfWork.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var table = await _unitOfWork.DiningTables.GetByIdAsync(id);
        if (table == null)
            return false;

        // Soft delete
        table.IsActive = false;
        _unitOfWork.DiningTables.Update(table);
        return await _unitOfWork.SaveChangesAsync() > 0;
    }

    public async Task<IEnumerable<TableAvailabilityDTO>> GetAvailabilityAsync(DateTime date, string timeSlot)
    {
        var tables = await _unitOfWork.DiningTables.GetActiveTablesAsync();
        
        if (!TimeSpan.TryParse(timeSlot, out var ts))
        {
            ts = date.TimeOfDay;
        }
        
        var targetTime = date.Date.Add(ts);

        var reservations = await _context.Reservations
    .Include(r => r.Order)
        .ThenInclude(o => o.OrderTables)
    .Where(r => r.Status != "CANCELLED"
             && r.Status != "COMPLETED"
             && r.Status != "NO_SHOW")
    .ToListAsync();

        var availabilityList = new List<TableAvailabilityDTO>();
        
        foreach (var table in tables)
        {
            var dto = new TableAvailabilityDTO
            {
                TableId = table.TableId,
                TableCode = table.TableCode,
                TableName = table.TableName ?? "",
                Capacity = table.Capacity,
                IsAvailable = true,
                StatusMessage = "Trống"
            };
            
            // Check status for targetTime on today
            if (table.Status != "AVAILABLE")
            {
                if (targetTime.Date == DateTime.Now.Date && targetTime < DateTime.Now.AddHours(2))
                {
                    dto.IsAvailable = false;
                    dto.StatusMessage = "Đang có khách/Bận";
                }
            }

            var tableReservations = reservations
    .Where(r =>
        r.Order != null &&
        r.Order.OrderTables.Any(
            ot => ot.TableId == table.TableId));
            var targetShift = GetShiftKey(targetTime);

            foreach (var res in tableReservations)
            {
                if (res.ReservedAt.Date != targetTime.Date)
                    continue;

                if (GetShiftKey(res.ReservedAt) != targetShift)
                    continue;

                dto.IsAvailable = false;
                dto.StatusMessage =
                    res.Status == "CHECKED_IN"
                        ? "Đang có khách"
                        : "Đã được đặt";

                break;
            }

            availabilityList.Add(dto);
        }
        
        return availabilityList;
    }
    private static string GetShiftKey(DateTime date)
    {
        var time = date.TimeOfDay;

        if (time >= new TimeSpan(11, 0, 0) &&
            time <= new TimeSpan(14, 0, 0))
        {
            return $"{date:yyyyMMdd}_MORNING";
        }

        if (time >= new TimeSpan(17, 0, 0) &&
            time <= new TimeSpan(24, 0, 0))
        {
            return $"{date:yyyyMMdd}_EVENING";
        }

        return $"{date:yyyyMMdd}_OTHER";
    }
}
