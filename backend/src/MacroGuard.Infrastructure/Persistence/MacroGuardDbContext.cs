using MacroGuard.Domain.Entities;
using MacroGuard.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace MacroGuard.Infrastructure.Persistence;

public class MacroGuardDbContext(DbContextOptions<MacroGuardDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<FoodItem> FoodItems => Set<FoodItem>();
    public DbSet<MealEntry> MealEntries => Set<MealEntry>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<UserProfile>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.UserId).IsUnique();
            entity.Property(x => x.WeightKg).HasPrecision(6, 2);
            entity.Property(x => x.HeightCm).HasPrecision(6, 2);
        });

        builder.Entity<FoodItem>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Name);
            entity.Property(x => x.Name).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Brand).HasMaxLength(100);
            entity.Property(x => x.Category).HasMaxLength(80).IsRequired();
            entity.Property(x => x.CaloriesPer100g).HasPrecision(7, 2);
            entity.Property(x => x.ProteinPer100g).HasPrecision(6, 2);
            entity.Property(x => x.CarbsPer100g).HasPrecision(6, 2);
            entity.Property(x => x.FatPer100g).HasPrecision(6, 2);
        });

        builder.Entity<MealEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.UserId, x.ConsumedDate });
            entity.Property(x => x.WeightGrams).HasPrecision(7, 2);
            entity.HasOne(x => x.FoodItem)
                .WithMany()
                .HasForeignKey(x => x.FoodItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}

