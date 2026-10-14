using System.Security.Claims;
using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using MacroGuard.Domain.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MacroGuard.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ProfileController(IProfileService profileService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<UserProfileDto>> GetProfile(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var profile = await profileService.GetProfileAsync(userId, ct);
        return Ok(profile);
    }

    [HttpPut("calculate")]
    public async Task<ActionResult<UserProfileDto>> CalculateAndSave([FromBody] CalculateProfileRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var profile = await profileService.CalculateAndSaveProfileAsync(userId, request, ct);
        return Ok(profile);
    }

    [HttpPost("preview")]
    public ActionResult<MacroCalculationResult> PreviewCalculation([FromBody] CalculateProfileRequest request)
    {
        var result = MacroCalculator.Calculate(
            request.Age,
            request.Gender,
            request.WeightKg,
            request.HeightCm,
            request.ActivityLevel,
            request.Goal,
            request.TargetWeightKg,
            request.DeficitPercentage,
            request.WeeklyChangeKg
        );
        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("Brak identyfikatora użytkownika w tokenie.");
        return Guid.Parse(claim);
    }
}

