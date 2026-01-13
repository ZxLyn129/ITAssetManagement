using backend_API.Data;
using backend_API.Models;

namespace backend_API
{
    public interface IAssetActivityLogService
    {
        void Log(string action, Guid assetId, Guid userId, string? details);
    }

    // AssetActivityLogService.cs
    public class AssetActivityLogService : IAssetActivityLogService
    {
        private readonly ITAssetManagementDbContext _context;

        public AssetActivityLogService(ITAssetManagementDbContext context)
        {
            _context = context;
        }

        public void Log(string action, Guid assetId, Guid userId, string notes)
        {
            var log = new Models.AssetActivityLog
            {
                Id = Guid.NewGuid(),
                AssetId = assetId,
                UserId = userId,
                Action = action,
                Timestamp = DateTime.Now,
                Notes = notes
            };

            _context.AssetActivityLogs.Add(log);
            _context.SaveChanges();
        }
    }
}
