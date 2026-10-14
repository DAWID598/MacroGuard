using System.Security.Claims;
using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MacroGuard.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class WeightsController(IWeightService weightService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<WeightEntryDto>> LogWeight([FromBody] LogWeightRequest request, CancellationToken ct)
    {
        try
        {
            var userId = GetCurrentUserId();
            var entry = await weightService.LogWeightAsync(userId, request, ct);
            return Ok(entry);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<ActionResult<WeightStatsSummaryDto>> GetStats(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var stats = await weightService.GetStatsSummaryAsync(userId, ct);
        return Ok(stats);
    }

    [HttpGet("history")]
    public async Task<ActionResult<List<WeightEntryDto>>> GetHistory([FromQuery] int? days, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var history = await weightService.GetHistoryAsync(userId, days, ct);
        return Ok(history);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteWeight(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var deleted = await weightService.DeleteWeightEntryAsync(userId, id, ct);
        return deleted ? NoContent() : NotFound(new { message = "Nie znaleziono wpisu wagi." });
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("Brak identyfikatora użytkownika w tokenie.");
        return Guid.Parse(claim);
    }
}

