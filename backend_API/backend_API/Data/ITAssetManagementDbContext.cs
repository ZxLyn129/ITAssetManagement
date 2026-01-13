
using backend_API.Models;
using Microsoft.EntityFrameworkCore;

namespace backend_API.Data
{
    public class ITAssetManagementDbContext : DbContext
    {
        public ITAssetManagementDbContext(DbContextOptions<ITAssetManagementDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Asset> Assets { get; set; }
        public DbSet<Models.AssetActivityLog> AssetActivityLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .Property(u => u.role)
                .HasConversion<string>();

            modelBuilder.Entity<Asset>()
                .Property(a => a.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Asset>()
                .HasOne(a => a.AssignedUser)
                .WithMany()
                .HasForeignKey(a => a.AssignedTo)
                .OnDelete(DeleteBehavior.SetNull);

            base.OnModelCreating(modelBuilder);
        }

        public override int SaveChanges()
        {
            UpdateTimestamps();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            UpdateTimestamps();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void UpdateTimestamps()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is Asset && (e.State == EntityState.Added || e.State == EntityState.Modified));

            foreach (var entry in entries)
            {
                var now = DateTime.UtcNow;
                var asset = (Asset)entry.Entity;
                if (entry.State == EntityState.Added)
                {
                    asset.CreatedAt = now;
                    asset.UpdatedAt = now;
                }
                else // Modified
                {
                    asset.UpdatedAt = now;
                    // keep CreatedAt untouched
                }
            }
        }
    }
}
