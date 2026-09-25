namespace TodoApi.Models;

public sealed record TodoItem(Guid Id, string Title, DateTimeOffset CreatedAt);