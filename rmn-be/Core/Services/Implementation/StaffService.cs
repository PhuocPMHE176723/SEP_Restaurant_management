using AutoMapper;
using Microsoft.AspNetCore.Identity;
using rmn_be.Core.DTOs;
using rmn_be.Core.Services.Interface;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;
using SEP_Restaurant_management.Core.Services.Interface;

namespace rmn_be.Core.Services.Implementation
{
    public class StaffService : IStaffService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly UserManager<UserIdentity> _userManager;
        private readonly IEmailService _emailService;
        public StaffService(IUnitOfWork unitOfWork, IMapper mapper, UserManager<UserIdentity> userManager, IEmailService emailService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _userManager = userManager;
            _emailService = emailService;
        }

        public async Task<PagedResultDTO<StaffDTO>> GetAllStaffAsync(PagingRequestDTO pagingRequest)
        {
            var staffs = await _unitOfWork.GetRepository<Staff>().GetAllAsync();

            var orderedStaffs = staffs.OrderByDescending(x => x.CreatedAt);

            var totalRecords = orderedStaffs.Count();

            var pagedStaffs = orderedStaffs
                .Skip((pagingRequest.PageNumber - 1) * pagingRequest.PageSize)
                .Take(pagingRequest.PageSize)
                .ToList();

            return new PagedResultDTO<StaffDTO>
            {
                Items = _mapper.Map<IEnumerable<StaffDTO>>(pagedStaffs),
                PageNumber = pagingRequest.PageNumber,
                PageSize = pagingRequest.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling((double)totalRecords / pagingRequest.PageSize)
            };
        }

        public async Task<StaffDTO?> GetStaffByIdAsync(long id)
        {
            var staff = await _unitOfWork.GetRepository<Staff>().GetByIdAsync(id);
            if (staff == null) return null;

            return _mapper.Map<StaffDTO>(staff);
        }

        public async Task<StaffDTO> CreateStaffAsync(CreateStaffDTO createDto)
        {
            var staffRepo = _unitOfWork.GetRepository<Staff>();

            var now = DateTime.UtcNow;

            // 1. Generate StaffCode
            var staffCode = await GenerateStaffCodeAsync(createDto.FullName, createDto.Position ?? "Staff");

            // 2. Tạo UserIdentity
            var user = new UserIdentity
            {
                Id = Guid.NewGuid().ToString(),
                UserName = createDto.Email,
                Email = createDto.Email,
                PhoneNumber = createDto.Phone,
            };
            var defaultPassword = "Abc123456!";

            var result = await _userManager.CreateAsync(user, defaultPassword);
            if (!result.Succeeded)
            {
                throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));
            }

            // 👉 role = position
            var roleName = createDto.Position ?? "Staff";
            await _userManager.AddToRoleAsync(user, roleName);

            // 3. Tạo Staff
            var staff = new Staff
            {
                UserId = user.Id,
                StaffCode = staffCode,
                FullName = createDto.FullName,
                Phone = createDto.Phone,
                Email = createDto.Email,
                Position = createDto.Position,

                HireDate = DateOnly.FromDateTime(now),
                WorkingStatus = "ACTIVE",
                CreatedAt = now
            };

            await staffRepo.AddAsync(staff);
            await _unitOfWork.SaveChangesAsync();
            // gửi mail nếu có email
            var email = createDto.Email?.Trim();
            if (!string.IsNullOrWhiteSpace(email))
            {
                var subject = "Tai khoan nhan vien da duoc tao";
                var body = $@"
            <h3>Xin chao {createDto.FullName},</h3>
            <p>Tai khoan nhan vien cua ban da duoc tao thanh cong.</p>
            <p><strong>Staff Code:</strong> {staffCode}</p>
            <p><strong>Username:</strong> {user.UserName}</p>
            <p><strong>Password mac dinh:</strong> {defaultPassword}</p>
            <p><strong>Role:</strong> {roleName}</p>
            <p>Vui long dang nhap va doi mat khau sau lan dang nhap dau tien.</p>
            <br/>
            <p>Tran trong.</p>
        ";

                await _emailService.SendEmailAsync(email, subject, body);
            }
            return _mapper.Map<StaffDTO>(staff);
        }

        public async Task<bool> UpdateStaffAsync(long id, UpdateStaffDTO updateDto)
        {
            var repo = _unitOfWork.GetRepository<Staff>();
            var existingStaff = await repo.GetByIdAsync(id);

            if (existingStaff == null) return false;

            _mapper.Map(updateDto, existingStaff);
            existingStaff.UpdatedAt = DateTime.UtcNow;

            repo.Update(existingStaff);
            var result = await _unitOfWork.SaveChangesAsync();

            return result > 0;
        }

        private async Task<string> GenerateStaffCodeAsync(string fullName, string role)
        {
            var now = DateTime.UtcNow;

            var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);

            if (parts.Length < 2)
                throw new Exception("FullName must have at least 2 words");

            // Last name (bỏ dấu nếu cần)
            var lastName = RemoveVietnameseAccents(parts[^1]);

            // initials (không viết hoa)
            var initials = string.Concat(
                parts.Take(parts.Length - 1)
                     .Select(x => RemoveVietnameseAccents(x)[0])
            );

            // role abbr
            var roleAbbr = role.Substring(0, Math.Min(2, role.Length)).ToLower();

            // date part
            var datePart = now.ToString("yydd");

            // base code
            var baseCode = $"{lastName}{initials}{roleAbbr}{datePart}";

            var staffRepo = _unitOfWork.GetRepository<Staff>();

            // lấy tất cả code bắt đầu bằng baseCode
            var existed = await staffRepo.FindAsync(x => x.StaffCode.StartsWith(baseCode));

            if (!existed.Any())
                return baseCode;

            // tìm số suffix lớn nhất
            var maxNumber = 0;

            foreach (var item in existed)
            {
                var code = item.StaffCode;

                if (code.Length > baseCode.Length)
                {
                    var suffix = code.Substring(baseCode.Length);

                    if (int.TryParse(suffix, out int num))
                    {
                        if (num > maxNumber)
                            maxNumber = num;
                    }
                }
            }

            var newNumber = maxNumber + 1;

            return $"{baseCode}{newNumber:D2}";
        }
        private string RemoveVietnameseAccents(string text)
        {
            var normalized = text.Normalize(System.Text.NormalizationForm.FormD);
            var chars = normalized.Where(c => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark);
            return new string(chars.ToArray()).Normalize(System.Text.NormalizationForm.FormC);
        }
        public async Task<bool> LockStaffAccountAsync(long staffId)
        {
            var staffRepo = _unitOfWork.GetRepository<Staff>();
            var staff = await staffRepo.GetByIdAsync(staffId);

            if (staff == null || string.IsNullOrWhiteSpace(staff.UserId))
                return false;

            var user = await _userManager.FindByIdAsync(staff.UserId);
            if (user == null)
                return false;

            user.LockoutEnabled = true;

            var lockResult = await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
            if (!lockResult.Succeeded)
                return false;

            staff.WorkingStatus = "INACTIVE";
            staff.UpdatedAt = DateTime.UtcNow;

            staffRepo.Update(staff);
            var saveResult = await _unitOfWork.SaveChangesAsync();

            return saveResult > 0;
        }

        public async Task<bool> UnlockStaffAccountAsync(long staffId)
        {
            var staffRepo = _unitOfWork.GetRepository<Staff>();
            var staff = await staffRepo.GetByIdAsync(staffId);

            if (staff == null || string.IsNullOrWhiteSpace(staff.UserId))
                return false;

            var user = await _userManager.FindByIdAsync(staff.UserId);
            if (user == null)
                return false;

            var unlockResult = await _userManager.SetLockoutEndDateAsync(user, null);
            if (!unlockResult.Succeeded)
                return false;

            staff.WorkingStatus = "ACTIVE";
            staff.UpdatedAt = DateTime.UtcNow;

            staffRepo.Update(staff);
            var saveResult = await _unitOfWork.SaveChangesAsync();

            return saveResult > 0;
        }
        public async Task<StaffDTO?> GetMyProfileAsync(string userId)
        {
            var staff = await _unitOfWork
        .GetRepository<Staff>()
        .GetAllAsync();

            var entity = staff.FirstOrDefault(s => s.UserId == userId);
            if (entity == null) return null;

            var user = await _userManager.FindByIdAsync(userId);

            var dto = _mapper.Map<StaffDTO>(entity);
            dto.Username = user?.UserName;

            return dto;
        }
    }
}
