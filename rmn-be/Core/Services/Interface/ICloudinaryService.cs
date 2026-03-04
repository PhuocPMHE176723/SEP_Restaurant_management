namespace SEP_Restaurant_management.Core.Services.Interface;

public interface ICloudinaryService
{
    /// <summary>Upload ảnh từ IFormFile, trả về URL public</summary>
    Task<string> UploadImageAsync(IFormFile file, string folder = "menu-items");

    /// <summary>Xóa ảnh theo publicId</summary>
    Task DeleteImageAsync(string publicId);
}
