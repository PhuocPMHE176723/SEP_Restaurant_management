namespace rmn_be.Core.Services.Interface
{
    public interface ICurrentUserService
    {
        string? UserId { get; }
        int? StaffId { get; }
        string? IpAddress { get; }
    }
}
