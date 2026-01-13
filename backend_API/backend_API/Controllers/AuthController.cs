using backend_API.Data;
using backend_API.DTOs.Request;
using backend_API.DTOs.Response;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace backend_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [EnableCors("CorsPolicy")]
    public class AuthController : ControllerBase
    {
        private readonly ITAssetManagementDbContext _context;
        public AuthController(ITAssetManagementDbContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.username) || string.IsNullOrEmpty(request.password))
                return BadRequest(new { success = false, message = "Username and password are required." });

            var user = _context.Users.FirstOrDefault(u => u.userName == request.username);

            if (user == null)
                return Unauthorized(new { success = false, message = "Invalid username." });

            if (string.IsNullOrEmpty(user.password))
                return Unauthorized(new { success = false, message = "Invalid stored password." });

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.password, user.password);
            if (!isPasswordValid)
                return Unauthorized(new { success = false, message = "Invalid password." });

            string roleName = Enum.GetName(typeof(backend_API.Enums.Role), user.role) ?? "User";

            var response = new LoginResponse
            {
                success = true,
                message = "Login successful",
                user = new 
                {
                    Id = user.Id,
                    userName = user.userName,
                    role = roleName
                }
            };

            return Ok(response);
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(new { message = "Logout successful" });
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) ||
                string.IsNullOrEmpty(request.OldPassword) ||
                string.IsNullOrEmpty(request.NewPassword))
                return BadRequest(new { message = "All fields are required." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.userName == request.Username);
            if (user == null) return NotFound(new { message = "User not found." });

            // Verify old password
            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.password))
                return BadRequest(new { message = "Old password is incorrect." });

            // Validate new password strength
            var passwordPattern = @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$";
            if (!System.Text.RegularExpressions.Regex.IsMatch(request.NewPassword, passwordPattern))
                return BadRequest(new { message = "New password does not meet complexity requirements." });

            // Update password
            user.password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }
    }
}
