using backend_API.Data;
using backend_API.Enums;
using backend_API.Models;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace backend_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableCors("CorsPolicy")]
    public class AssetController : ControllerBase
    {
        private readonly ITAssetManagementDbContext _context;
        private readonly IAssetActivityLogService _activityLog;

        public AssetController(ITAssetManagementDbContext context, IAssetActivityLogService activityLog)
        {
            _context = context;
            _activityLog = activityLog;
        }

        private Guid GetCurrentUserId(string userIdHeader) =>
            Guid.TryParse(userIdHeader, out var id) ? id : Guid.Empty;

        private string GetCurrentUserRole(string roleHeader) =>
            string.IsNullOrEmpty(roleHeader) ? "User" : roleHeader;

        // GET: api/asset?search=...
        [HttpGet]
        public async Task<IActionResult> GetAssets([FromQuery] string? search,
            [FromHeader(Name = "x-user-id")] string userIdHeader,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            try
            {
                var role = GetCurrentUserRole(roleHeader);
                var userId = GetCurrentUserId(userIdHeader);

                var query = _context.Assets.Include(a => a.AssignedUser).Where(a => a.IsDeleted == false).AsQueryable();

                // Filter by user role
                if (!role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                    query = query.Where(a => a.AssignedTo.HasValue && a.AssignedTo == userId);

                // Execute query first
                var list = await query
                    .Select(a => new
                    {
                        a.Id,
                        a.Name,
                        a.Type,
                        a.Status,
                        a.AssignedTo,
                        AssignedUsername = a.AssignedUser != null ? a.AssignedUser.userName : null,
                        a.PurchaseDate,
                        a.WarrantyExpiry,
                        a.Remarks
                    })
                    .ToListAsync();

                // Apply in-memory search
                if (!string.IsNullOrEmpty(search))
                {
                    search = search.ToLower();

                    list = list.Where(a =>
                        (a.Name != null && a.Name.ToLower().Contains(search)) ||
                        (a.Type != null && a.Type.ToLower().Contains(search)) ||
                        (a.Remarks != null && a.Remarks.ToLower().Contains(search)) ||
                        (role.Equals("Admin", StringComparison.OrdinalIgnoreCase) && a.AssignedUsername != null && a.AssignedUsername.ToLower().Contains(search)) ||
                        (Enum.GetName(typeof(AssetStatus), a.Status)?.ToLower().Contains(search) ?? false)
                    ).ToList();
                }

                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // GET disposed asset
        [HttpGet("disposed")]
        public async Task<IActionResult> GetDisposedAssets([FromQuery] string? search,
            [FromHeader(Name = "x-user-id")] string userIdHeader,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            try
            {
                var role = GetCurrentUserRole(roleHeader);
                var userId = GetCurrentUserId(userIdHeader);

                if (!role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                    return Forbid();

                var query = _context.Assets
                    .Where(a => a.IsDeleted == true)
                    .AsQueryable();

                var list = await query
                    .Select(a => new
                    {
                        a.Id,
                        a.Name,
                        a.Type,
                        a.Status,
                        a.PurchaseDate,
                        a.WarrantyExpiry,
                        a.Remarks,
                        a.DeletedAt
                    })
                    .ToListAsync();

                // Optional search
                if (!string.IsNullOrEmpty(search))
                {
                    search = search.ToLower();
                    list = list.Where(a =>
                        (a.Name?.ToLower().Contains(search) ?? false) ||
                        (a.Type?.ToLower().Contains(search) ?? false) ||
                        (a.Remarks?.ToLower().Contains(search) ?? false)
                    ).ToList();
                }

                return Ok(list);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // GET: api/asset/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAssetDetails(Guid id,
            [FromHeader(Name = "x-user-id")] string userIdHeader,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            try
            {
                var role = GetCurrentUserRole(roleHeader);
                var userId = GetCurrentUserId(userIdHeader);

                // Fetch asset with assigned user
                var asset = await _context.Assets
                    .Include(a => a.AssignedUser)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (asset == null)
                    return NotFound();

                // Restrict normal users to their assigned asset
                if (!role.Equals("Admin", StringComparison.OrdinalIgnoreCase) &&
                    (asset.AssignedTo == null || asset.AssignedTo != userId))
                    return Forbid();

                // Fetch logs
                var logsQuery = _context.AssetActivityLogs
                    .Where(l => l.AssetId == id)
                    .Include(l => l.User)
                    .OrderByDescending(l => l.Timestamp);

                var logs = await logsQuery
                    .Select(l => new
                    {
                        l.Id,
                        l.Action,
                        l.Timestamp,
                        l.Notes,
                        UserName = l.User.userName
                    })
                    .ToListAsync();

                // Return asset + logs
                return Ok(new
                {
                    asset = new
                    {
                        asset.Id,
                        asset.Name,
                        asset.Type,
                        asset.Status,
                        asset.AssignedTo,
                        AssignedUsername = asset.AssignedUser != null ? asset.AssignedUser.userName : null,
                        asset.PurchaseDate,
                        asset.WarrantyExpiry,
                        asset.Remarks,
                        asset.CreatedAt,
                        asset.UpdatedAt,
                        asset.IsDeleted,
                        asset.DeletedAt
                    },
                    logs
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("getById/{id}")]
        public async Task<IActionResult> GetAssetById(Guid id,
            [FromHeader(Name = "x-user-id")] string userIdHeader,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            try
            {
                // Only admin can access this endpoint
                if (!roleHeader.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                    return Forbid();

                var asset = await _context.Assets
                    .Include(a => a.AssignedUser)
                    .Select(a => new
                    {
                        a.Id,
                        a.Name,
                        a.Type,
                        a.Status,
                        a.AssignedTo,
                        AssignedUsername = a.AssignedUser != null ? a.AssignedUser.userName : null,
                        a.PurchaseDate,
                        a.WarrantyExpiry,
                        a.Remarks
                    })
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (asset == null)
                    return NotFound();

                return Ok(asset);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // POST: api/asset
        [HttpPost]
        public async Task<IActionResult> CreateAsset([FromBody] Asset asset,
            [FromHeader(Name = "x-user-id")] string userIdHeader,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            try
            {
                if (!GetCurrentUserRole(roleHeader).Equals("Admin", StringComparison.OrdinalIgnoreCase))
                    return Forbid();

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                asset.Id = Guid.NewGuid();
                asset.AssignedUser = null;
                asset.CreatedAt = DateTime.Now;
                asset.UpdatedAt = null;

                _context.Assets.Add(asset);
                await _context.SaveChangesAsync();

                _activityLog.Log("Create", asset.Id, GetCurrentUserId(userIdHeader), null);
                return Ok(new { asset.Id, message = "Created successfully" });

            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // PUT: api/asset/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAsset(Guid id, [FromBody] Asset asset,
            [FromHeader(Name = "x-user-id")] string userIdHeader,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            try
            {
                if (!GetCurrentUserRole(roleHeader).Equals("Admin", StringComparison.OrdinalIgnoreCase))
                    return Forbid();

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var existing = await _context.Assets.FirstOrDefaultAsync(a => a.Id == id);
                if (existing == null) return NotFound();

                var oldAssigned = existing.AssignedTo;
                var newAssigned = asset.AssignedTo;

                existing.Name = asset.Name;
                existing.Type = asset.Type;
                existing.Status = asset.Status;
                existing.PurchaseDate = asset.PurchaseDate;
                existing.WarrantyExpiry = asset.WarrantyExpiry;
                existing.Remarks = asset.Remarks;
                existing.AssignedTo = asset.AssignedTo;
                asset.UpdatedAt = DateTime.Now;

                if (oldAssigned != newAssigned)
                {
                    string? oldUserName = oldAssigned.HasValue
                        ? _context.Users.Where(u => u.Id == oldAssigned.Value).Select(u => u.userName).FirstOrDefault()
                        : null;

                    string? newUserName = newAssigned.HasValue
                        ? _context.Users.Where(u => u.Id == newAssigned.Value).Select(u => u.userName).FirstOrDefault()
                        : null;

                    if (oldAssigned.HasValue && !newAssigned.HasValue)
                    {
                        _activityLog.Log("Unassign", existing.Id, GetCurrentUserId(userIdHeader), $"Unassigned from {oldUserName}");
                        existing.Status = AssetStatus.Available;
                    }

                    else if (!oldAssigned.HasValue && newAssigned.HasValue)
                    {
                        _activityLog.Log("Assign", existing.Id, GetCurrentUserId(userIdHeader), $"Assigned to {newUserName}");
                        if (existing.Status == AssetStatus.Available)
                            existing.Status = AssetStatus.InUse;
                    }

                    else if (oldAssigned.HasValue && newAssigned.HasValue && oldAssigned != newAssigned)
                    {
                        _activityLog.Log("Reassign", existing.Id, GetCurrentUserId(userIdHeader), $"From {oldUserName} to {newUserName}");
                        existing.Status = AssetStatus.InUse;
                    }

                }
                else
                {
                    _activityLog.Log("Update", existing.Id, GetCurrentUserId(userIdHeader), null);
                }

                await _context.SaveChangesAsync();

                return Ok(new { existing.Id, message = "Updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("assignable-users")]
        public async Task<IActionResult> GetAssignableUsers([FromHeader(Name = "x-user-id")] string userIdHeader,
                                                    [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            if (!roleHeader.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                return Forbid();

            var users = await _context.Users
                .Where(u => u.role == Role.User)
                .Select(u => new { u.Id, u.userName })
                .ToListAsync();

            return Ok(users);
        }


        // DELETE: api/asset/{id}?reason=...
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAsset(Guid id, [FromQuery] string reason, [FromQuery] string? remark,
            [FromHeader(Name = "x-user-id")] string userIdHeader,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            try
            {
                if (!GetCurrentUserRole(roleHeader).Equals("Admin", StringComparison.OrdinalIgnoreCase))
                    return Forbid();

                if (string.IsNullOrWhiteSpace(reason))
                    return BadRequest(new { message = "Reason is required." });

                var asset = await _context.Assets.FirstOrDefaultAsync(a => a.Id == id);
                if (asset == null) return NotFound();

                asset.IsDeleted = true;
                asset.Status = AssetStatus.Disposed;
                asset.AssignedTo = null;
                asset.DeletedAt = DateTime.UtcNow;
                if (remark != null)
                    asset.Remarks = remark;
                //_context.Assets.Remove(asset);
                await _context.SaveChangesAsync();

                _activityLog.Log("Delete", asset.Id, GetCurrentUserId(userIdHeader), reason);
                return Ok(new { message = "Deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // TODO: export, chart
        [HttpGet("export")]
        public async Task<IActionResult> ExportAssetsToExcel( [FromQuery] string? search,
            [FromHeader(Name = "x-user-id")] string userIdHeader,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            try
            {
                var role = GetCurrentUserRole(roleHeader);
                var userId = GetCurrentUserId(userIdHeader);

                var query = _context.Assets
                    . Where(a => !a.IsDeleted)
                    .Include(a => a.AssignedUser)
                    .AsQueryable();

                // User filtering
                if (!role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                    query = query.Where(a=> a.AssignedTo.HasValue && a.AssignedTo == userId);

                var dbAssets = await query.ToListAsync();

                var assets = dbAssets.Select(a => new
                {
                    a.Id,
                    a.Name,
                    a.Type,
                    Status = Enum.GetName(typeof(AssetStatus), a.Status),
                    AssignedTo = a.AssignedUser != null ? a.AssignedUser.userName : "-",
                    a.PurchaseDate,
                    a.WarrantyExpiry,
                    a.Remarks,
                    a.CreatedAt,
                    a.UpdatedAt,
                    a.IsDeleted,
                    a.DeletedAt
                }).ToList();

                //Search filter
                if (!string.IsNullOrEmpty(search))
                {
                    search = search.ToLower();
                    assets = assets.Where(a =>
                        (a.Name != null && a.Name.ToLower().Contains(search)) ||
                        (a.Type != null && a.Type.ToLower().Contains(search)) ||
                        (a.Remarks != null && a.Remarks.ToLower().Contains(search)) ||
                        (role.Equals("Admin", StringComparison.OrdinalIgnoreCase) && a.AssignedTo != null && a.AssignedTo.ToLower().Contains(search)) ||
                        (a.Status != null && a.Status.ToLower().Contains(search))
                    ).ToList();
                }

                using var workbook = new XLWorkbook();
                var ws = workbook.Worksheets.Add("Assets");

                // Header row
                var headers = new[]
                {
                    "ID", "Name", "Type", "Status", "Assigned To", "Purchase Date", "Warranty Expiry",
                    "Remarks", "Created At", "Updated At", "Is Deleted", "Deleted At"
                };

                for (int i = 0; i < headers.Length; i++)
                    ws.Cell(1, i + 1).Value = headers[i];

                // Data rows
                int currentRow = 2;
                foreach (var a in assets)
                {
                    ws.Cell(currentRow, 1).Value = a.Id.ToString();
                    ws.Cell(currentRow, 2).Value = a.Name;
                    ws.Cell(currentRow, 3).Value = a.Type;
                    ws.Cell(currentRow, 4).Value = a.Status;
                    ws.Cell(currentRow, 5).Value = a.AssignedTo;
                    ws.Cell(currentRow, 6).Value = a.PurchaseDate.ToString("yyyy-MM-dd");
                    ws.Cell(currentRow, 7).Value = a.WarrantyExpiry.ToString("yyyy-MM-dd");
                    ws.Cell(currentRow, 8).Value = a.Remarks;
                    ws.Cell(currentRow, 9).Value = a.CreatedAt?.ToString("yyyy-MM-dd HH:mm:ss");
                    ws.Cell(currentRow, 10).Value = a.UpdatedAt?.ToString("yyyy-MM-dd HH:mm:ss");
                    ws.Cell(currentRow, 11).Value = a.IsDeleted ? "Yes" : "No";
                    ws.Cell(currentRow, 12).Value = a.DeletedAt?.ToString("yyyy-MM-dd HH:mm:ss");
                    currentRow++;
                }

                ws.Columns().AdjustToContents();

                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Position = 0;

                var fileName = $"Assets_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";

                return File(stream.ToArray(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardData(
            [FromHeader(Name = "x-user-id")] string userIdHeader,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            var role = GetCurrentUserRole(roleHeader);
            var userId = GetCurrentUserId(userIdHeader);

            var query = _context.Assets.AsQueryable();

            // User filtering
            if (!role.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                query = query.Where(a => a.AssignedTo == userId);

            var assets = await query.ToListAsync();

            // Total assets
            var totalAssets = assets.Count;

            // Assigned vs Unassigned
            var assignedCount = assets.Count(a => a.AssignedTo.HasValue);
            var unassignedCount = totalAssets - assignedCount;

            // Assets needing repair/maintenance
            var repairCount = assets.Count(a => a.Status == AssetStatus.Repair);

            // Status distribution
            var statusDistribution = assets
                .GroupBy(a => a.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToList();

            // Type distribution 
            var typeDistribution = assets
                .GroupBy(a => (a.Type ?? "Unknown").Trim().ToLower())
                .Select(g => new { Type = g.Key, Count = g.Count() })
                .ToList();

            return Ok(new
            {
                totalAssets,
                assignedCount,
                unassignedCount,
                repairCount,
                statusDistribution,
                typeDistribution
            });
        }

    }
}
