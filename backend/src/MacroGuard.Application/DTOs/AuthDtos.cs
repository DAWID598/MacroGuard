using System.ComponentModel.DataAnnotations;

namespace MacroGuard.Application.DTOs;

public record RegisterRequest(
    [Required(ErrorMessage = "Adres e-mail jest wymagany."), EmailAddress(ErrorMessage = "Nieprawidłowy format adresu e-mail.")] string Email,
    [Required(ErrorMessage = "Hasło jest wymagane.")]
    [StringLength(100, MinimumLength = 10, ErrorMessage = "Hasło musi zawierać co najmniej 10 znaków.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,}$", 
        ErrorMessage = "Hasło musi zawierać co najmniej 10 znaków, w tym wielką literę (A-Z), małą literę (a-z), cyfrę (0-9) oraz znak specjalny.")] 
    string Password,
    [Required(ErrorMessage = "Imię lub pseudonim jest wymagany."), MinLength(2, ErrorMessage = "Imię musi zawierać co najmniej 2 znaki.")] string DisplayName
);

public record LoginRequest(
    [Required(ErrorMessage = "Adres e-mail jest wymagany."), EmailAddress(ErrorMessage = "Nieprawidłowy format adresu e-mail.")] string Email,
    [Required(ErrorMessage = "Hasło jest wymagane.")] string Password
);

public record AuthResponse(
    string Token,
    Guid UserId,
    string Email,
    string DisplayName
);

public record ForgotPasswordRequest(
    [Required(ErrorMessage = "Adres e-mail jest wymagany."), EmailAddress(ErrorMessage = "Nieprawidłowy format adresu e-mail.")] string Email
);

public record ForgotPasswordResponse(
    string Message
);

public record ResetPasswordRequest(
    [Required(ErrorMessage = "Adres e-mail jest wymagany."), EmailAddress(ErrorMessage = "Nieprawidłowy format adresu e-mail.")] string Email,
    [Required(ErrorMessage = "Token jest wymagany.")] string Token,
    [Required(ErrorMessage = "Nowe hasło jest wymagane.")]
    [StringLength(100, MinimumLength = 10, ErrorMessage = "Nowe hasło musi zawierać co najmniej 10 znaków.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,}$", 
        ErrorMessage = "Nowe hasło musi zawierać co najmniej 10 znaków, w tym wielką literę (A-Z), małą literę (a-z), cyfrę (0-9) oraz znak specjalny.")] 
    string NewPassword
);

