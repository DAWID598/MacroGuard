namespace MacroGuard.Application.Interfaces;

public interface IEmailSender
{
    Task SendEmailAsync(string toEmail, string subject, string htmlMessage, CancellationToken ct = default);
}

