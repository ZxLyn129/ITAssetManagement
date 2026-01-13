using backend_API.Enums;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace backend_API.Models
{
    public class Asset
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        [Required]
        public string Name { get; set; }
        [Required]
        public string Type { get; set; }
        [Required]
        [EnumDataType(typeof(AssetStatus))]
        public AssetStatus Status { get; set; }
        public Guid? AssignedTo { get; set; }
        public DateTime PurchaseDate { get; set; }
        public DateTime WarrantyExpiry { get; set; }
        public string? Remarks { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; } 



        [ForeignKey("AssignedTo")]
        public User? AssignedUser { get; set; }
        public ICollection<AssetActivityLog> ActivityLogs { get; set; } = new List<AssetActivityLog>();
    }
}
