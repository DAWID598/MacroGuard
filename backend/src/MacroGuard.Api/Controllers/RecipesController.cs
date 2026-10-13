using System.Security.Claims;
using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MacroGuard.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class RecipesController(IRecipeService recipeService) : ControllerBase
{
    [HttpGet("ai-info")]
    public ActionResult<AiInfoDto> GetAiInfo()
    {
        return Ok(recipeService.GetAiInfo());
    }

    [HttpPost("generate")]
    public async Task<ActionResult<GeneratedRecipeDto>> GenerateRecipe(
        [FromBody] GenerateRecipeRequest request,
        CancellationToken ct)
    {
        var recipe = await recipeService.GenerateRecipeAsync(request, ct);
        return Ok(recipe);
    }

    [HttpPost("apply")]
    public async Task<ActionResult<List<MealEntryDto>>> ApplyRecipe(
        [FromBody] ApplyRecipeRequest request,
        CancellationToken ct)
    {
        var userId = GetCurrentUserId();
        var entries = await recipeService.ApplyRecipeToDiaryAsync(userId, request, ct);
        return Ok(entries);
    }

    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new UnauthorizedAccessException("Brak identyfikatora użytkownika w tokenie.");
        return Guid.Parse(claim);
    }
}

