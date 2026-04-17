using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using rmn_be.Core.DTOs;
using rmn_be.Core.Services.Interface;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;
using static rmn_be.Core.DTOs.CustomerOrderDTO;

namespace rmn_be.Core.Services.Implementation
{
    public class CustomerService : ICustomerService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly UserManager<UserIdentity> _userManager;
        private readonly SepDatabaseContext _context;
        public CustomerService(IUnitOfWork unitOfWork, IMapper mapper, UserManager<UserIdentity> userManager, SepDatabaseContext context)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _userManager = userManager;
            _context = context;
        }

        public async Task<CustomerDTO> CreateCustomerAsync(CreateCustomerDTO createDto)
        {
            var customerRepo = _unitOfWork.GetRepository<Customer>();

            var fullName = createDto.FullName.Trim();
            var phone = createDto.Phone.Trim();
            var email = createDto.Email.Trim();
            var username = createDto.Username.Trim();

            if (createDto.Password != createDto.ConfirmPassword)
                throw new Exception("Confirm password does not match.");

            var customers = await customerRepo.GetAllAsync();

            var duplicatedPhone = customers.Any(x =>
                !string.IsNullOrWhiteSpace(x.Phone) &&
                x.Phone.Trim() == phone);

            if (duplicatedPhone)
                throw new Exception("Phone already exists.");

            var duplicatedEmail = customers.Any(x =>
                !string.IsNullOrWhiteSpace(x.Email) &&
                x.Email!.Trim().ToLower() == email.ToLower());

            if (duplicatedEmail)
                throw new Exception("Email already exists.");

            var existedUserByEmail = await _userManager.FindByEmailAsync(email);
            if (existedUserByEmail != null)
                throw new Exception("Email already exists in system.");

            var existedUserByUsername = await _userManager.FindByNameAsync(username);
            if (existedUserByUsername != null)
                throw new Exception("Username already exists.");

            var user = new UserIdentity
            {
                Id = Guid.NewGuid().ToString(),
                UserName = username,
                Email = email,
                PhoneNumber = phone,
                FullName = fullName
            };

            var createUserResult = await _userManager.CreateAsync(user, createDto.Password);
            if (!createUserResult.Succeeded)
            {
                throw new Exception(string.Join(", ", createUserResult.Errors.Select(x => x.Description)));
            }

            var addRoleResult = await _userManager.AddToRoleAsync(user, "Customer");
            if (!addRoleResult.Succeeded)
            {
                throw new Exception(string.Join(", ", addRoleResult.Errors.Select(x => x.Description)));
            }

            var customer = new Customer
            {
                UserId = user.Id,
                FullName = fullName,
                Phone = phone,
                Email = email,
                TotalPoints = 0,
                CreatedAt = DateTime.UtcNow
            };

            await customerRepo.AddAsync(customer);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<CustomerDTO>(customer);
        }

        public async Task<PagedResultDTO<CustomerDTO>> GetAllCustomersAsync(PagingRequestDTO pagingRequest)
        {
            var customers = await _unitOfWork.GetRepository<Customer>().GetAllAsync();

            var query = customers.AsQueryable();

            if (!string.IsNullOrWhiteSpace(pagingRequest.SearchTerm))
            {
                var keyword = pagingRequest.SearchTerm.Trim().ToLower();

                query = query.Where(x =>
                    (!string.IsNullOrEmpty(x.FullName) && x.FullName.ToLower().Contains(keyword)) ||
                    (!string.IsNullOrEmpty(x.Email) && x.Email.ToLower().Contains(keyword)) ||
                    (!string.IsNullOrEmpty(x.Phone) && x.Phone.ToLower().Contains(keyword)) 
                );
            }

            

            var totalRecords = query.Count();

            var pagedCustomers = query
                .Skip((pagingRequest.PageNumber - 1) * pagingRequest.PageSize)
                .Take(pagingRequest.PageSize)
                .ToList();

            return new PagedResultDTO<CustomerDTO>
            {
                Items = _mapper.Map<IEnumerable<CustomerDTO>>(pagedCustomers),
                PageNumber = pagingRequest.PageNumber,
                PageSize = pagingRequest.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling((double)totalRecords / pagingRequest.PageSize)
            };
        }

        public async Task<CustomerDTO?> GetCustomerByIdAsync(long id)
        {
            var customer = await _unitOfWork.GetRepository<Customer>().GetByIdAsync(id);
            if (customer == null) return null;

            return _mapper.Map<CustomerDTO>(customer);
        }

        public async Task<bool> UpdateCustomerAsync(long id, UpdateCustomerDTO updateDto)
        {
            var customerRepo = _unitOfWork.GetRepository<Customer>();
            var existingCustomer = await customerRepo.GetByIdAsync(id);

            if (existingCustomer == null)
                return false;

            var normalizedFullName = updateDto.FullName.Trim();
            var normalizedPhone = updateDto.Phone.Trim();
            var normalizedEmail = updateDto.Email.Trim();
            var normalizedUsername = updateDto.Username.Trim();

            var customers = await customerRepo.GetAllAsync();

            var duplicatedPhone = customers.Any(x =>
                x.CustomerId != id &&
                !string.IsNullOrWhiteSpace(x.Phone) &&
                x.Phone.Trim() == normalizedPhone);

            if (duplicatedPhone)
                throw new Exception("Phone already exists.");

            var duplicatedEmail = customers.Any(x =>
                x.CustomerId != id &&
                !string.IsNullOrWhiteSpace(x.Email) &&
                x.Email!.Trim().ToLower() == normalizedEmail.ToLower());

            if (duplicatedEmail)
                throw new Exception("Email already exists.");

            if (!string.IsNullOrWhiteSpace(existingCustomer.UserId))
            {
                var user = await _userManager.FindByIdAsync(existingCustomer.UserId);

                if (user != null)
                {
                    var userByEmail = await _userManager.FindByEmailAsync(normalizedEmail);
                    if (userByEmail != null && userByEmail.Id != user.Id)
                        throw new Exception("Email already exists in system.");

                    var userByUsername = await _userManager.FindByNameAsync(normalizedUsername);
                    if (userByUsername != null && userByUsername.Id != user.Id)
                        throw new Exception("Username already exists.");

                    user.Email = normalizedEmail;
                    user.UserName = normalizedUsername;
                    user.PhoneNumber = normalizedPhone;

                    var updateUserResult = await _userManager.UpdateAsync(user);
                    if (!updateUserResult.Succeeded)
                    {
                        throw new Exception(string.Join(", ", updateUserResult.Errors.Select(x => x.Description)));
                    }
                }
            }

            existingCustomer.FullName = normalizedFullName;
            existingCustomer.Phone = normalizedPhone;
            existingCustomer.Email = normalizedEmail;

            customerRepo.Update(existingCustomer);
            var result = await _unitOfWork.SaveChangesAsync();

            return result > 0;
        }
        public async Task<CustomerDTO?> GetMyProfileAsync(string userId)
        {
            var customers = await _unitOfWork
        .GetRepository<Customer>()
        .GetAllAsync();

            var entity = customers.FirstOrDefault(c => c.UserId == userId);
            if (entity == null) return null;

            var user = await _userManager.FindByIdAsync(userId);

            var dto = _mapper.Map<CustomerDTO>(entity);
            dto.Username = user?.UserName;

            return dto;
        }

        public async Task<CustomerContextDTO> GetMyOrderAsync(string userId)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);


            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new Exception("User not found");


            var activeOrder = await _context.Orders
                .AsNoTracking()
                .Include(o => o.Table)
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.MenuItem)
                .Where(o => o.CustomerId == customer.CustomerId
                    && (o.Status == "OPEN"
                || o.Status == "SENT_TO_KITCHEN"
                        || o.Status == "SERVED"))
                .OrderByDescending(o => o.OpenedAt)
                .FirstOrDefaultAsync();

            var activeReservation = await _context.Reservations
                .AsNoTracking()
                .Include(r => r.Table)
                .Include(r => r.Order)
                    .ThenInclude(o => o!.OrderItems)
                        .ThenInclude(oi => oi.MenuItem)
                .Where(r => r.CustomerId == customer.CustomerId
                    && (r.Status == "PENDING" || r.Status == "CONFIRMED") && r.Order.Status == "RESERVED")
                .OrderBy(r => r.ReservedAt)
                .FirstOrDefaultAsync();

            var result = new CustomerContextDTO
            {
                Customer = new CustomerSummaryDTO
                {
                    CustomerId = customer.CustomerId,
                    FullName = customer.FullName,
                    Phone = customer.Phone,
                    Email = customer.Email,
                    TotalPoints = customer.TotalPoints
                },
                DisplayMode = "NONE"
            };

            if (activeOrder != null)
            {
                result.DisplayMode = "SERVING";
                result.ActiveOrder = MapOrderDTO(activeOrder);
                return result;
            }

            if (activeReservation != null)
            {
                result.DisplayMode = "PREORDER";
                result.ActiveReservation = MapReservationDTO(activeReservation);
                return result;
            }
            return result;
        }



        private OrderDTO MapOrderDTO(Order order)
        {
            return new OrderDTO
            {
                OrderId = order.OrderId,
                OrderCode = order.OrderCode,
                Status = order.Status,
                TableName = order.Table?.TableCode ?? order.Table?.TableName,
                CustomerName = order.Customer?.FullName,
                OpenedAt = order.OpenedAt,
                ClosedAt = order.ClosedAt,
                TotalAmount = order.OrderItems.Sum(i =>
                    i.LineTotal > 0 ? i.LineTotal : (i.UnitPrice * i.Quantity) - i.DiscountAmount),

                OrderItems = order.OrderItems
            .OrderBy(i => i.CreatedAt)
            .Select(i => new OrderItemDTO
            {
                OrderItemId = i.OrderItemId,
                ItemNameSnapshot = i.ItemNameSnapshot,
                Quantity = i.Quantity,
                Status = i.Status,
                UnitPrice = i.UnitPrice
            })
            .ToList()
            };
        }

        private ReservationDTO MapReservationDTO(Reservation reservation)
        {
            return new ReservationDTO
            {
                ReservationId = reservation.ReservationId,
                CustomerId = reservation.CustomerId,
                TableId = reservation.TableId,
                CustomerName = reservation.CustomerName,
                CustomerPhone = reservation.CustomerPhone,
                PartySize = reservation.PartySize,
                ReservedAt = reservation.ReservedAt,
                DurationMinutes = reservation.DurationMinutes,
                Status = reservation.Status,
                Note = reservation.Note,
                CreatedAt = reservation.CreatedAt,
                CreatedByStaffId = reservation.CreatedByStaffId,
                DepositAmount = reservation.DepositAmount,

                Order = reservation.Order == null ? null : new OrderDTO
                {
                    OrderId = reservation.Order.OrderId,
                    OrderCode = reservation.Order.OrderCode,
                    Status = reservation.Order.Status,
                    TableName = reservation.Table?.TableCode ?? reservation.Table?.TableName,
                    CustomerName = reservation.CustomerName,
                    OpenedAt = reservation.Order.OpenedAt,
                    ClosedAt = reservation.Order.ClosedAt,
                    TotalAmount = reservation.Order.OrderItems.Sum(i =>
                        i.LineTotal > 0 ? i.LineTotal : (i.UnitPrice * i.Quantity) - i.DiscountAmount),

                    OrderItems = reservation.Order.OrderItems
                        .OrderBy(i => i.CreatedAt)
                        .Select(i => new OrderItemDTO
                        {
                            OrderItemId = i.OrderItemId,
                            ItemNameSnapshot = i.ItemNameSnapshot,
                            Quantity = i.Quantity,
                            Status = i.Status,
                            UnitPrice = i.UnitPrice
                        })
                        .ToList()
                }
            };
        }
    }
}
