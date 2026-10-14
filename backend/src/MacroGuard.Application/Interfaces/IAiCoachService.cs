using MacroGuard.Application.DTOs;

namespace MacroGuard.Application.Interfaces;

public interface IAiCoachService
{
    Task<AiCoachReportDto> GenerateCoachReportAsync(Guid userId, AiCoachRequest request, CancellationToken ct = default);
}

