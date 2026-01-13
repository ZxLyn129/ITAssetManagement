using backend_API.Data;
using backend_API.Enums;
using backend_API.Models;
using ClosedXML.Excel;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ITAssetManagementDbContext _context;

        public UserController(ITAssetManagementDbContext context)
        {
            _context = context;
        }

        private string GetCurrentUserRole(string roleHeader) =>
            string.IsNullOrEmpty(roleHeader) ? "User" : roleHeader;

        // GET: api/user?search=...
        [HttpGet]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? search,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            try
            {
                if (!GetCurrentUserRole(roleHeader).Equals("Admin", StringComparison.OrdinalIgnoreCase))
                    return Forbid();

                var query = _context.Users.AsQueryable();

                if (!string.IsNullOrEmpty(search))
                {
                    search = search.ToLower();
                    query = query.Where(u =>
                        u.userName.ToLower().Contains(search) ||
                        u.email.ToLower().Contains(search) ||
                        u.role.ToString().ToLower().Contains(search)
                    );
                }

                var usersList = await query.ToListAsync();

                var users = usersList.Select(u => new
                {
                    u.Id,
                    u.userName,
                    u.email,
                    u.password,
                    Role = u.role.ToString(),
                    u.isTerminated,
                }).ToList();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // GET: api/user/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(Guid id,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            try
            {
                if (!GetCurrentUserRole(roleHeader).Equals("Admin", StringComparison.OrdinalIgnoreCase))
                    return Forbid();

                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return NotFound();

                return Ok(new
                {
                    user.Id,
                    user.userName,
                    user.email,
                    Role = user.role.ToString(),
                    user.isTerminated,
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // POST: api/user
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] User user,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            try
            {
                if (!GetCurrentUserRole(roleHeader).Equals("Admin", StringComparison.OrdinalIgnoreCase))
                    return Forbid();

                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Convert role string to enum
                if (!Enum.TryParse<Role>(user.role.ToString(), true, out var roleEnum))
                    return BadRequest(new { message = "Invalid role value" });

                user.role = roleEnum;
                user.password = BCrypt.Net.BCrypt.HashPassword(user.password);
                user.Id = Guid.NewGuid();

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Ok(new { user.Id, message = "User created successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // PUT: api/user/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] User updatedUser,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            try
            {
                if (!GetCurrentUserRole(roleHeader).Equals("Admin", StringComparison.OrdinalIgnoreCase))
                    return Forbid();

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
                if (user == null) return NotFound();

                user.userName = updatedUser.userName;
                user.email = updatedUser.email;

                if (!Enum.TryParse<Role>(updatedUser.role.ToString(), true, out var roleEnum))
                    return BadRequest(new { message = "Invalid role value" });
                user.role = roleEnum;

                if (!string.IsNullOrEmpty(updatedUser.password))
                    user.password = BCrypt.Net.BCrypt.HashPassword(updatedUser.password);

                await _context.SaveChangesAsync();

                return Ok(new { message = "User updated successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // DELETE: api/user/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            try
            {
                if (!GetCurrentUserRole(roleHeader).Equals("Admin", StringComparison.OrdinalIgnoreCase))
                    return Forbid();

                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return NotFound();

                user.isTerminated = true;
                await _context.SaveChangesAsync();

                return Ok(new { message = "User deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // EXPORT: api/user/export
        [HttpGet("export")]
        public async Task<IActionResult> ExportUsersToExcel([FromQuery] string? search,
            [FromHeader(Name = "x-user-role")] string roleHeader)
        {
            try
            {
                if (!GetCurrentUserRole(roleHeader).Equals("Admin", StringComparison.OrdinalIgnoreCase))
                    return Forbid();

                var query = _context.Users.AsQueryable();

                if (!string.IsNullOrEmpty(search))
                {
                    search = search.ToLower();
                    query = query.Where(u =>
                        u.userName.ToLower().Contains(search) ||
                        u.email.ToLower().Contains(search) ||
                        u.role.ToString().ToLower().Contains(search)
                    );
                }

                var dbUsers = await query.ToListAsync();

                var users = dbUsers.Select(u => new
                {
                    u.Id,
                    u.userName,
                    u.email,
                    u.password,
                    Role = u.role.ToString(),
                    u.isTerminated,
                }).ToList();

                using var workbook = new XLWorkbook();
                var ws = workbook.Worksheets.Add("Users");

                var headers = new[] { "ID", "Username", "Email", "Password", "Role", "IsTerminated" };
                for (int i = 0; i < headers.Length; i++)
                    ws.Cell(1, i + 1).Value = headers[i];

                int currentRow = 2;
                foreach (var u in users)
                {
                    ws.Cell(currentRow, 1).Value = u.Id.ToString();
                    ws.Cell(currentRow, 2).Value = u.userName;
                    ws.Cell(currentRow, 3).Value = u.email;
                    ws.Cell(currentRow, 4).Value = u.password;
                    ws.Cell(currentRow, 5).Value = u.Role;
                    ws.Cell(currentRow, 6).Value = u.isTerminated;
                    currentRow++;
                }

                ws.Columns().AdjustToContents();

                using var stream = new MemoryStream();
                workbook.SaveAs(stream);
                stream.Position = 0;

                var fileName = $"Users_{DateTime.Now:yyyyMMdd_HHmm}.xlsx";

                return File(stream.ToArray(),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
