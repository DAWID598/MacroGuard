using System.Security.Claims;
using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MacroGuard.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class FoodsController(IFoodService foodService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<FoodItemDto>>> SearchFoods(
        [FromQuery] string? query,
        [FromQuery] string? category,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var foods = await foodService.SearchFoodsAsync(userId, query, category, ct);
        return Ok(foods);
    }

    [HttpPost]
    public async Task<ActionResult<FoodItemDto>> CreateFood([FromBody] CreateFoodItemRequest request, CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var food = await foodService.CreateFoodAsync(userId, request, ct);
        return Ok(food);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("Brak identyfikatora użytkownika w tokenie.");
        return Guid.Parse(claim);
    }
}

