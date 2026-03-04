using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryService(IConfiguration config)
    {
        var cloudName  = config["Cloudinary:CloudName"]  ?? throw new InvalidOperationException("Cloudinary:CloudName missing");
        var apiKey     = config["Cloudinary:ApiKey"]     ?? throw new InvalidOperationException("Cloudinary:ApiKey missing");
        var apiSecret  = config["Cloudinary:ApiSecret"]  ?? throw new InvalidOperationException("Cloudinary:ApiSecret missing");

        var account   = new Account(cloudName, apiKey, apiSecret);
        _cloudinary   = new Cloudinary(account) { Api = { Secure = true } };
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

        var result = await _cloudinary.UploadAsync(uploadParams);

        if (result.Error != null)
            throw new InvalidOperationException($"Cloudinary upload error: {result.Error.Message}");

        return result.SecureUrl.ToString();
    }

    public async Task DeleteImageAsync(string publicId)
    {
        var deleteParams = new DeletionParams(publicId);
        await _cloudinary.DestroyAsync(deleteParams);
    }
}
