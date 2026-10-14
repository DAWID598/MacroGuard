using System.Security.Claims;
using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MacroGuard.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DiaryController(IDiaryService diaryService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DailyDiaryDto>> GetDailyDiary([FromQuery] DateOnly? date, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var targetDate = date ?? DateOnly.FromDateTime(DateTime.Today);
        var diary = await diaryService.GetDailyDiaryAsync(userId, targetDate, ct);
        return Ok(diary);
    }

    [HttpPost]
    public async Task<ActionResult<MealEntryDto>> AddEntry([FromBody] AddMealEntryRequest request, CancellationToken ct)
    {
        try
        {
            var userId = GetCurrentUserId();
            var entry = await diaryService.AddMealEntryAsync(userId, request, ct);
            return Ok(entry);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteEntry(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var deleted = await diaryService.DeleteMealEntryAsync(userId, id, ct);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("copy-meal")]
    public async Task<ActionResult<CopyResultDto>> CopyMeal([FromBody] CopyMealRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await diaryService.CopyMealAsync(userId, request, ct);
        return Ok(result);
    }

    [HttpPost("copy-day")]
    public async Task<ActionResult<CopyResultDto>> CopyDay([FromBody] CopyDayRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var result = await diaryService.CopyDayAsync(userId, request, ct);
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

