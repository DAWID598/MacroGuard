using System.Net;
using System.Net.Mail;
using MacroGuard.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MacroGuard.Infrastructure.Services;

public class SmtpEmailSender(
    IConfiguration configuration,
    ILogger<SmtpEmailSender> logger) : IEmailSender
{
    public async Task SendEmailAsync(string toEmail, string subject, string htmlMessage, CancellationToken ct = default)
    {
        var host = configuration["Smtp:Host"];
        var portStr = configuration["Smtp:Port"];
        var userName = configuration["Smtp:UserName"];
        var password = configuration["Smtp:Password"];
        var enableSsl = configuration.GetValue<bool>("Smtp:EnableSsl", true);
        var senderEmail = configuration["Smtp:SenderEmail"] ?? userName ?? "no-reply@macroguard.pl";
        var senderName = configuration["Smtp:SenderName"] ?? "MacroGuard";

        if (string.IsNullOrWhiteSpace(host))
        {
            logger.LogWarning(
                "[SMTP] Brak skonfigurowanego hosta SMTP w appsettings.json.\n" +
                "Wiadomość e-mail do: {ToEmail}\nTemat: {Subject}",
                toEmail,
                subject
            );
            return;
        }

        var port = int.TryParse(portStr, out var p) ? p : 1025;

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = enableSsl
        };

        if (!string.IsNullOrWhiteSpace(userName) && !string.IsNullOrWhiteSpace(password))
        {
            client.Credentials = new NetworkCredential(userName, password);
        }

        using var mail = new MailMessage
        {
            From = new MailAddress(senderEmail, senderName),
            Subject = subject,
            Body = htmlMessage,
            IsBodyHtml = true
        };

        mail.To.Add(toEmail);

        try
        {
            await client.SendMailAsync(mail, ct);
            logger.LogInformation("[SMTP] Pomyślnie wysłano wiadomość e-mail do {ToEmail} (Temat: {Subject}).", toEmail, subject);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[SMTP] Błąd podczas wysyłania wiadomości e-mail do {ToEmail}.", toEmail);
            throw new InvalidOperationException($"Nie udało się wysłać wiadomości e-mail: {ex.Message}", ex);
        }
    }
}

