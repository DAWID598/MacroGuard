using System.Security.Claims;
using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MacroGuard.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/custom-meal-sets")]
public class CustomMealSetsController(ICustomMealSetService mealSetService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CustomMealSetDto>>> GetMealSets(CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var sets = await mealSetService.GetUserMealSetsAsync(userId, ct);
        return Ok(sets);
    }

    [HttpPost("from-meal")]
    public async Task<ActionResult<CustomMealSetDto>> CreateFromMeal([FromBody] CreateMealSetFromMealRequest request, CancellationToken ct)
    {
        try
        {
            var userId = GetCurrentUserId();
            var created = await mealSetService.CreateFromMealAsync(userId, request, ct);
            return Ok(created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/apply")]
    public async Task<ActionResult<List<MealEntryDto>>> ApplyMealSet(Guid id, [FromBody] ApplyMealSetRequest request, CancellationToken ct)
    {
        try
        {
            var userId = GetCurrentUserId();
            var addedEntries = await mealSetService.ApplyMealSetAsync(userId, id, request, ct);
            return Ok(addedEntries);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteMealSet(Guid id, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var deleted = await mealSetService.DeleteMealSetAsync(userId, id, ct);
        return deleted ? NoContent() : NotFound(new { message = "Nie znaleziono zestawu do usunięcia." });
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("Brak identyfikatora użytkownika w tokenie.");
        return Guid.Parse(claim);
    }
}

