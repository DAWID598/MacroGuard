namespace MacroGuard.Domain.Entities;

public class WeightEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public DateOnly Date { get; set; }
    public decimal WeightKg { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

