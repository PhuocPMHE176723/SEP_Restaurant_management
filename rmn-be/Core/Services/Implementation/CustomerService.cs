using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using rmn_be.Core.DTOs;
using rmn_be.Core.Services.Interface;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;
using SEP_Restaurant_management.Core.Services.Interface;
using static rmn_be.Core.DTOs.CustomerOrderDTO;

namespace rmn_be.Core.Services.Implementation
{
    public class CustomerService : ICustomerService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly UserManager<UserIdentity> _userManager;
        private readonly SepDatabaseContext _context;
        private readonly IAuthService _authService;

        public CustomerService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            UserManager<UserIdentity> userManager,
            SepDatabaseContext context,
            IAuthService authService
        )
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _userManager = userManager;
            _context = context;
            _authService = authService;
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
                !string.IsNullOrWhiteSpace(x.Phone) && x.Phone.Trim() == phone
            );

            if (duplicatedPhone)
                throw new Exception("Phone already exists.");

            var duplicatedEmail = customers.Any(x =>
                !string.IsNullOrWhiteSpace(x.Email) && x.Email!.Trim().ToLower() == email.ToLower()
            );

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
                FullName = fullName,
            };

            var createUserResult = await _userManager.CreateAsync(user, createDto.Password);
            if (!createUserResult.Succeeded)
            {
                throw new Exception(
                    string.Join(", ", createUserResult.Errors.Select(x => x.Description))
                );
            }

            var addRoleResult = await _userManager.AddToRoleAsync(user, "Customer");
            if (!addRoleResult.Succeeded)
            {
                throw new Exception(
                    string.Join(", ", addRoleResult.Errors.Select(x => x.Description))
                );
            }

            var customer = new Customer
            {
                UserId = user.Id,
                FullName = fullName,
                Phone = phone,
                Email = email,
                TotalPoints = 0,
                CreatedAt = DateTime.UtcNow,
            };

            await customerRepo.AddAsync(customer);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<CustomerDTO>(customer);
        }

        public async Task<PagedResultDTO<CustomerDTO>> GetAllCustomersAsync(
            PagingRequestDTO pagingRequest
        )
        {
            var customers = await _unitOfWork.GetRepository<Customer>().GetAllAsync();

            var query = customers.AsQueryable();

            if (!string.IsNullOrWhiteSpace(pagingRequest.SearchTerm))
            {
                var keyword = pagingRequest.SearchTerm.Trim().ToLower();

                query = query.Where(x =>
                    (!string.IsNullOrEmpty(x.FullName) && x.FullName.ToLower().Contains(keyword))
                    || (!string.IsNullOrEmpty(x.Email) && x.Email.ToLower().Contains(keyword))
                    || (!string.IsNullOrEmpty(x.Phone) && x.Phone.ToLower().Contains(keyword))
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
                TotalPages = (int)Math.Ceiling((double)totalRecords / pagingRequest.PageSize),
            };
        }

        public async Task<CustomerDetailDTO?> GetCustomerByIdAsync(long id)
        {
            var customer = await _context.Customers
                .Include(c => c.Reservations)
                    .ThenInclude(r => r.ReservationTables)
                        .ThenInclude(rt => rt.DiningTable)
                .Include(c => c.Reservations)
                    .ThenInclude(r => r.Order)
                        .ThenInclude(o => o!.OrderItems)
                            .ThenInclude(oi => oi.MenuItem)
                .Include(c => c.Invoices)
                .FirstOrDefaultAsync(c => c.CustomerId == id);

            if (customer == null)
                return null;

            var user = await _userManager.FindByIdAsync(customer.UserId ?? "");

            var dto = _mapper.Map<CustomerDetailDTO>(customer);
            dto.Username = user?.UserName;

            // Manual mapping for ReservationHistory and PaymentHistory if needed, or use AutoMapper
            dto.ReservationHistory = customer.Reservations
                .OrderByDescending(r => r.ReservedAt)
                .Select(MapReservationDTO)
                .ToList();

            dto.PaymentHistory = customer.Invoices
                .OrderByDescending(i => i.IssuedAt)
                .Select(i => _mapper.Map<SEP_Restaurant_management.Core.DTOs.InvoiceDTO>(i))
                .ToList();

            return dto;
        }

        public async Task<UpdateCustomerResultDTO> UpdateCustomerAsync(
            long id,
            UpdateCustomerDTO updateDto
        )
        {
            var customerRepo = _unitOfWork.GetRepository<Customer>();
            var existingCustomer = await customerRepo.GetByIdAsync(id);

            if (existingCustomer == null)
                return new UpdateCustomerResultDTO { Message = $"Customer with ID {id} not found" };

            var normalizedFullName = updateDto.FullName?.Trim() ?? string.Empty;
            var normalizedPhone = updateDto.Phone?.Trim() ?? string.Empty;
            var normalizedEmail = updateDto.Email?.Trim() ?? string.Empty;
            var normalizedUsername = updateDto.Username?.Trim() ?? string.Empty;

            var customers = await customerRepo.GetAllAsync();
            var duplicateCustomers = customers
                .Where(x =>
                    x.CustomerId != id
                    && !string.IsNullOrWhiteSpace(x.Phone)
                    && x.Phone.Trim() == normalizedPhone
                )
                .ToList();

            var phoneChanged = false;
            if (!string.IsNullOrWhiteSpace(normalizedPhone))
            {
                phoneChanged = !string.Equals(
                    existingCustomer.Phone?.Trim(),
                    normalizedPhone,
                    StringComparison.Ordinal
                );

                foreach (var dup in duplicateCustomers)
                {
                    bool isVerified = false;
                    if (!string.IsNullOrWhiteSpace(dup.UserId))
                    {
                        var otherUser = await _userManager.FindByIdAsync(dup.UserId);
                        if (otherUser is UserIdentity ui && ui.IsPhoneVerified)
                        {
                            isVerified = true;
                        }
                    }

                    if (isVerified)
                    {
                        throw new Exception(
                            "Số điện thoại này đã được xác thực bởi một tài khoản khác."
                        );
                    }
                    else
                    {
                        dup.Phone = null;
                        if (!string.IsNullOrWhiteSpace(dup.UserId))
                        {
                            var otherUser = await _userManager.FindByIdAsync(dup.UserId);
                            if (otherUser != null)
                            {
                                otherUser.PhoneNumber = null;
                                await _userManager.UpdateAsync(otherUser);
                            }
                        }
                        customerRepo.Update(dup);
                    }
                }
            }

            // Remove redundant email check on Customers table as UserManager handles it more accurately below.

            if (!string.IsNullOrWhiteSpace(existingCustomer.UserId))
            {
                var user = await _userManager.FindByIdAsync(existingCustomer.UserId);

                if (user != null)
                {
                    var userByEmail = await _userManager.FindByEmailAsync(normalizedEmail);
                    if (userByEmail != null && userByEmail.Id != user.Id)
                        throw new Exception("Email đã tồn tại trong hệ thống.");

                    var userByUsername = await _userManager.FindByNameAsync(normalizedUsername);
                    if (userByUsername != null && userByUsername.Id != user.Id)
                        throw new Exception("Tên đăng nhập (Username) đã tồn tại.");

                    user.Email = normalizedEmail;
                    user.UserName = normalizedUsername;

                    if (phoneChanged)
                    {
                        user.PendingPhoneNumber = normalizedPhone;
                        user.IsPhoneVerified = false;
                        user.PhoneNumberConfirmed = false;
                    }
                    else if (!string.IsNullOrWhiteSpace(normalizedPhone))
                    {
                        user.PhoneNumber = normalizedPhone;
                    }

                    var updateUserResult = await _userManager.UpdateAsync(user);
                    if (!updateUserResult.Succeeded)
                    {
                        throw new Exception(
                            string.Join(", ", updateUserResult.Errors.Select(x => x.Description))
                        );
                    }
                }
            }

            existingCustomer.FullName = normalizedFullName;
            if (phoneChanged)
            {
                // Keep the current stored phone until OTP verification succeeds.
                // The pending value is stored on AspNetUsers.
            }
            else
            {
                existingCustomer.Phone = normalizedPhone;
            }
            existingCustomer.Email = normalizedEmail;

            customerRepo.Update(existingCustomer);
            var result = await _unitOfWork.SaveChangesAsync();

            if (result <= 0)
                return new UpdateCustomerResultDTO { Message = "Không thể cập nhật khách hàng" };

            if (phoneChanged && !string.IsNullOrWhiteSpace(normalizedPhone))
            {
                var resendResult = await _authService.ResendOtpAsync(
                    new ResendOtpRequestDTO { PhoneNumber = normalizedPhone }
                );

                if (!resendResult.Succeeded)
                {
                    return new UpdateCustomerResultDTO
                    {
                        Message = "Cập nhật thành công nhưng không thể gửi OTP. Vui lòng thử lại.",
                        PhoneRequiresVerification = true,
                    };
                }

                return new UpdateCustomerResultDTO
                {
                    Message = "Vui lòng xác minh số điện thoại mới qua OTP để hoàn tất cập nhật.",
                    PhoneRequiresVerification = true,
                };
            }

            return new UpdateCustomerResultDTO
            {
                Message = "Customer updated successfully",
                PhoneRequiresVerification = false,
            };
        }

        public async Task<CustomerDTO?> GetMyProfileAsync(string userId)
        {
            var customers = await _unitOfWork.GetRepository<Customer>().GetAllAsync();

            var entity = customers.FirstOrDefault(c => c.UserId == userId);
            if (entity == null)
                return null;

            var user = await _userManager.FindByIdAsync(userId);

            var dto = _mapper.Map<CustomerDTO>(entity);
            dto.Username = user?.UserName;

            if (
                string.IsNullOrWhiteSpace(dto.Phone)
                && user != null
                && !string.IsNullOrWhiteSpace(user.PhoneNumber)
            )
            {
                dto.Phone = user.PhoneNumber;
            }

            if (
                string.IsNullOrWhiteSpace(dto.Email)
                && user != null
                && !string.IsNullOrWhiteSpace(user.Email)
            )
            {
                dto.Email = user.Email;
            }

            if (user is UserIdentity userIdentity)
            {
                dto.IsPhoneVerified = userIdentity.IsPhoneVerified;
            }

            return dto;
        }

        public async Task<CustomerContextDTO> GetMyOrderAsync(string userId)
        {
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new Exception("User not found");

            var activeOrder = await _context
                .Orders.AsNoTracking()
                .Include(o => o.Table)
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.MenuItem)
                .Where(o =>
                    o.CustomerId == customer.CustomerId
                    && (o.Status == "OPEN" || o.Status == "SENT_TO_KITCHEN" || o.Status == "SERVED")
                )
                .OrderByDescending(o => o.OpenedAt)
                .FirstOrDefaultAsync();

            var activeReservation = await _context
                .Reservations.AsNoTracking()
                .Include(r => r.ReservationTables)
                    .ThenInclude(rt => rt.DiningTable)
                .Include(r => r.Order)
                    .ThenInclude(o => o!.OrderItems)
                        .ThenInclude(oi => oi.MenuItem)
                .Where(r =>
                    r.CustomerId == customer.CustomerId
                    && (r.Status == "PENDING" || r.Status == "CONFIRMED")
                    && r.Order.Status == "RESERVED"
                )
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
                    TotalPoints = customer.TotalPoints,
                },
                DisplayMode = "NONE",
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
            var tableNames = order.OrderTables.ToList();

            var tableDisplay = tableNames.Any() ? string.Join(", ", tableNames) : "Ch?a c bn";

            return new OrderDTO
            {
                OrderId = order.OrderId,
                OrderCode = order.OrderCode,
                Status = order.Status,
                TableName = tableDisplay,
                CustomerName = order.Customer?.FullName,
                OpenedAt = order.OpenedAt,
                ClosedAt = order.ClosedAt,
                TotalAmount = order
                    .OrderItems.Where(i => i.Status != "CANCELLED")
                    .Sum(i =>
                        i.LineTotal > 0
                            ? i.LineTotal
                            : (i.UnitPrice * i.Quantity) - i.DiscountAmount
                    ),

                OrderItems = order
                    .OrderItems.OrderBy(i => i.CreatedAt)
                    .Select(i => new OrderItemDTO
                    {
                        OrderItemId = i.OrderItemId,
                        ItemNameSnapshot = i.ItemNameSnapshot,
                        Quantity = i.Quantity,
                        Status = i.Status,
                        UnitPrice = i.UnitPrice,
                        Thumbnail = i.MenuItem.Thumbnail,
                    })
                    .ToList(),
            };
        }

        private ReservationDTO MapReservationDTO(Reservation reservation)
        {
            return new ReservationDTO
            {
                ReservationId = reservation.ReservationId,
                CustomerId = reservation.CustomerId,
                TableIds = reservation.ReservationTables.Select(rt => rt.TableId).ToList(),
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

                Order =
                    reservation.Order == null
                        ? null
                        : new OrderDTO
                        {
                            OrderId = reservation.Order.OrderId,
                            OrderCode = reservation.Order.OrderCode,
                            Status = reservation.Order.Status,
                            TableName = string.Join(
                                ", ",
                                reservation
                                    .ReservationTables.Select(rt =>
                                        rt.DiningTable?.TableCode ?? rt.DiningTable?.TableName
                                    )
                                    .Where(n => n != null)
                            ),
                            CustomerName = reservation.CustomerName,
                            OpenedAt = reservation.Order.OpenedAt,
                            ClosedAt = reservation.Order.ClosedAt,
                            TotalAmount = reservation
                                .Order.OrderItems.Where(i => i.Status != "CANCELLED")
                                .Sum(i =>
                                    i.LineTotal > 0
                                        ? i.LineTotal
                                        : (i.UnitPrice * i.Quantity) - i.DiscountAmount
                                ),

                            OrderItems = reservation
                                .Order.OrderItems.OrderBy(i => i.CreatedAt)
                                .Select(i => new OrderItemDTO
                                {
                                    OrderItemId = i.OrderItemId,
                                    ItemNameSnapshot = i.ItemNameSnapshot,
                                    Quantity = i.Quantity,
                                    Status = i.Status,
                                    UnitPrice = i.UnitPrice,
                                    Thumbnail = i.MenuItem.Thumbnail,
                                })
                                .ToList(),
                        },
            };
        }
    }
}
