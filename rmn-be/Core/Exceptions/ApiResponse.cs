namespace SEP_Restaurant_management.Core.Exceptions;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public static ApiResponse<T> SuccessResponse(T data, string message = "Success")
    {
        return new ApiResponse<T> { Success = true, Data = data, Message = message };
    }

    public static ApiResponse<T> FailureResponse(string message, List<string>? errors = null)
    {
        return new ApiResponse<T> { Success = false, Message = message, Errors = errors };
    }
}

public class ApiMessage
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;

    public static ApiMessage SuccessResponse(string message = "Success")
    {
        return new ApiMessage { Success = true, Message = message };
    }

    public static ApiMessage FailureResponse(string message)
    {
        return new ApiMessage { Success = false, Message = message };
    }
}
