using backend_API.Enums;
using System;
using System.ComponentModel.DataAnnotations;

namespace backend_API.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        [Required]
        public string userName { get; set; }
        [Required]
        public string email { get; set; }
        [Required]
        public string password { get; set; }
        [Required]
        [EnumDataType(typeof(Role))]
        public Role role { get; set; }
        public bool isTerminated { get; set; }
    }
}
