using System.Security.Claims;
using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MacroGuard.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reports")]
public class ReportsController(IReportService reportService) : ControllerBase
{
    [HttpGet("period")]
    public async Task<ActionResult<PeriodReportDto>> GetPeriodReport([FromQuery] int days = 7, CancellationToken ct = default)
    {
        var userId = GetCurrentUserId();
        var report = await reportService.GeneratePeriodReportAsync(userId, days, ct);
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

