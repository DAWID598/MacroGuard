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
    public DbSet<WeightEntry> WeightEntries => Set<WeightEntry>();
    public DbSet<CustomMealSet> CustomMealSets => Set<CustomMealSet>();
    public DbSet<CustomMealSetItem> CustomMealSetItems => Set<CustomMealSetItem>();

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

        builder.Entity<WeightEntry>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.UserId, x.Date }).IsUnique();
            entity.Property(x => x.WeightKg).HasPrecision(5, 2);
            entity.Property(x => x.Note).HasMaxLength(200);
        });

        builder.Entity<CustomMealSet>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.UserId);
            entity.Property(x => x.Name).HasMaxLength(120).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(250);
            entity.HasMany(x => x.Items)
                .WithOne(x => x.CustomMealSet)
                .HasForeignKey(x => x.CustomMealSetId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<CustomMealSetItem>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.WeightGrams).HasPrecision(7, 2);
            entity.HasOne(x => x.FoodItem)
                .WithMany()
                .HasForeignKey(x => x.FoodItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}

