using backend_API.Models;

namespace backend_API.DTOs.Response
{
    public class LoginResponse
    {
        public bool success { get; set; }
        public object user { get; set; }
        public string message { get; set; }
    }
}
