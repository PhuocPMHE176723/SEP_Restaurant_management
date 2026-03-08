using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class CloudinaryService : ICloudinaryService
{
    private readonly IConfiguration _config;
    private Cloudinary? _cloudinary;

    public CloudinaryService(IConfiguration config)
    {
        _config = config;
    }

    private Cloudinary GetClient()
    {
        if (_cloudinary != null) return _cloudinary;

        var cloudName = _config["Cloudinary:CloudName"];
        var apiKey    = _config["Cloudinary:ApiKey"];
        var apiSecret = _config["Cloudinary:ApiSecret"];

        if (string.IsNullOrWhiteSpace(cloudName) || cloudName == "your_cloud_name")
            throw new InvalidOperationException("Cloudinary:CloudName is not configured. Please set your Cloudinary details in appsettings.json.");

        if (string.IsNullOrWhiteSpace(apiKey) || apiKey == "your_api_key")
            throw new InvalidOperationException("Cloudinary:ApiKey is not configured.");

        if (string.IsNullOrWhiteSpace(apiSecret) || apiSecret == "your_api_secret")
            throw new InvalidOperationException("Cloudinary:ApiSecret is not configured.");

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account) { Api = { Secure = true } };
        return _cloudinary;
    }

    public async Task<string> UploadImageAsync(IFormFile file, string folder = "menu-items")
    {
        using var stream = file.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File           = new FileDescription(file.FileName, stream),
            Folder         = folder,
            UseFilename    = false,
            UniqueFilename = true,
            Overwrite      = false,
            Transformation = new Transformation()
                .Width(800).Height(800)
                .Crop("limit")
                .Quality("auto")
                .FetchFormat("auto"),
        };

        var result = await GetClient().UploadAsync(uploadParams);

        if (result.Error != null)
            throw new InvalidOperationException($"Cloudinary upload error: {result.Error.Message}");

        return result.SecureUrl.ToString();
    }

    public async Task DeleteImageAsync(string publicId)
    {
        var deleteParams = new DeletionParams(publicId);
        await GetClient().DestroyAsync(deleteParams);
    }
}
