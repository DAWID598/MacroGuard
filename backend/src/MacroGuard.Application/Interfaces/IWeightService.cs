using MacroGuard.Application.DTOs;

namespace MacroGuard.Application.Interfaces;

public interface IWeightService
{
    Task<WeightEntryDto> LogWeightAsync(Guid userId, LogWeightRequest request, CancellationToken ct = default);
    Task<WeightStatsSummaryDto> GetStatsSummaryAsync(Guid userId, CancellationToken ct = default);
    Task<List<WeightEntryDto>> GetHistoryAsync(Guid userId, int? limitDays = null, CancellationToken ct = default);
    Task<bool> DeleteWeightEntryAsync(Guid userId, Guid entryId, CancellationToken ct = default);
}

