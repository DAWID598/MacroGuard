using Microsoft.AspNetCore.Identity;

namespace MacroGuard.Infrastructure.Identity;

public class IdentityPolishErrorDescriber : IdentityErrorDescriber
{
    public override IdentityError PasswordTooShort(int length) => new()
    {
        Code = nameof(PasswordTooShort),
        Description = $"Hasło musi zawierać co najmniej {length} znaków."
    };

    public override IdentityError PasswordRequiresNonAlphanumeric() => new()
    {
        Code = nameof(PasswordRequiresNonAlphanumeric),
        Description = "Hasło musi zawierać co najmniej jeden znak specjalny (np. !@#$%^&*)."
    };

    public override IdentityError PasswordRequiresDigit() => new()
    {
        Code = nameof(PasswordRequiresDigit),
        Description = "Hasło musi zawierać co najmniej jedną cyfrę (0-9)."
    };

    public override IdentityError PasswordRequiresLower() => new()
    {
        Code = nameof(PasswordRequiresLower),
        Description = "Hasło musi zawierać co najmniej jedną małą literę (a-z)."
    };

    public override IdentityError PasswordRequiresUpper() => new()
    {
        Code = nameof(PasswordRequiresUpper),
        Description = "Hasło musi zawierać co najmniej jedną wielką literę (A-Z)."
    };

    public override IdentityError PasswordRequiresUniqueChars(int uniqueChars) => new()
    {
        Code = nameof(PasswordRequiresUniqueChars),
        Description = $"Hasło musi zawierać co najmniej {uniqueChars} różne znaki."
    };

    public override IdentityError DuplicateEmail(string email) => new()
    {
        Code = nameof(DuplicateEmail),
        Description = $"Użytkownik z adresem e-mail '{email}' już istnieje."
    };

    public override IdentityError DuplicateUserName(string userName) => new()
    {
        Code = nameof(DuplicateUserName),
        Description = $"Nazwa użytkownika '{userName}' jest już zajęta."
    };

    public override IdentityError InvalidToken() => new()
    {
        Code = nameof(InvalidToken),
        Description = "Token autoryzacyjny jest nieprawidłowy lub wygasł."
    };
}

