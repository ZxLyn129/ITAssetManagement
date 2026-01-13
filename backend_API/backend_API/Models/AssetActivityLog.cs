using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend_API.Models
{
    public class AssetActivityLog
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        [Required]
        public Guid AssetId { get; set; }
        [Required]
        public Guid UserId { get; set; }
        [Required]
        public string Action { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? Notes { get; set; }


        [ForeignKey("AssetId")]
        public Asset Asset { get; set; }
        [ForeignKey("UserId")]
        public User User { get; set; }
    }
}
