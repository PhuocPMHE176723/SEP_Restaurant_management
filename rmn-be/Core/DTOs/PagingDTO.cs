namespace rmn_be.Core.DTOs
{
    public class PagingRequestDTO
    {
        private const int MaxPageSize = 50;
        private int _pageSize = 10;

        public int PageNumber { get; set; } = 1;

        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = value > MaxPageSize ? MaxPageSize : value;
        }
        public string? SearchTerm { get; set; }
        public string? Status { get; set; } // ACTIVE | INACTIVE | ALL
    }

    public class PagedResultDTO<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalRecords { get; set; }
        public int TotalPages { get; set; }
        public string? SearchTerm { get; set; }
        public string? Status { get; set; } // ACTIVE | INACTIVE | ALL
    }
}
