using MacroGuard.Application.DTOs;
using MacroGuard.Application.Exceptions;
using MacroGuard.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace MacroGuard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth-endpoints")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<RegisterResponse>> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        try
        {
            var response = await authService.RegisterAsync(request, ct);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        try
        {
            var response = await authService.LoginAsync(request, ct);
            return Ok(response);
        }
        catch (AccountLockedException ex)
        {
            return StatusCode(StatusCodes.Status423Locked, new { message = ex.Message });
        }
        catch (EmailNotConfirmedException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message, requiresEmailConfirmation = true, email = ex.Email ?? request.Email });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequest request, CancellationToken ct)
    {
        try
        {
            await authService.ConfirmEmailAsync(request, ct);
            return Ok(new ConfirmEmailResponse("Adres e-mail został pomyślnie potwierdzony. Możesz się teraz zalogować."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("resend-confirmation-email")]
    public async Task<IActionResult> ResendConfirmationEmail([FromBody] ResendConfirmationEmailRequest request, CancellationToken ct)
    {
        var message = await authService.ResendConfirmationEmailAsync(request, ct);
        return Ok(new { message });
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ForgotPasswordResponse>> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        var response = await authService.ForgotPasswordAsync(request, ct);
        return Ok(response);
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        try
        {
            await authService.ResetPasswordAsync(request, ct);
            return Ok(new { message = "Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

