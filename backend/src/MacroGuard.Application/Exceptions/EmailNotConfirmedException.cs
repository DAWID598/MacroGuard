namespace MacroGuard.Application.Exceptions;

public class EmailNotConfirmedException(string message, string? email = null) : Exception(message)
{
    public string? Email { get; } = email;
}

