using MacroGuard.Application.DTOs;

namespace MacroGuard.Application.Interfaces;

public interface IReportService
{
    Task<PeriodReportDto> GeneratePeriodReportAsync(Guid userId, int days, CancellationToken ct = default);
}

