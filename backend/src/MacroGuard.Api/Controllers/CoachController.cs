using System.Security.Claims;
using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MacroGuard.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/coach")]
public class CoachController(IAiCoachService coachService) : ControllerBase
{
    [HttpPost("analyze")]
    public async Task<ActionResult<AiCoachReportDto>> Analyze([FromBody] AiCoachRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var report = await coachService.GenerateCoachReportAsync(userId, request, ct);
        return Ok(report);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("Brak identyfikatora użytkownika w tokenie.");
        return Guid.Parse(claim);
    }
}

