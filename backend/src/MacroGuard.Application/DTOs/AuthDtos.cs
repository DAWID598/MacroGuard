using System.ComponentModel.DataAnnotations;

namespace MacroGuard.Application.DTOs;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Required, MinLength(2)] string DisplayName
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponse(
    string Token,
    Guid UserId,
    string Email,
    string DisplayName
);

public record ForgotPasswordRequest(
    [Required, EmailAddress] string Email
);

public record ForgotPasswordResponse(
    string Message
);

public record ResetPasswordRequest(
    [Required, EmailAddress] string Email,
    [Required] string Token,
    [Required, MinLength(6)] string NewPassword
);

