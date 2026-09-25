using TodoApi.Models;

namespace TodoApi.DTOs;

/// <summary>
/// A request to create a todo item. The only field is the title, which is required and must be 200 characters or fewer.
/// </summary>
/// <param name="Title"></param>
public sealed record CreateTodoRequest(string? Title);

/// <summary>
/// A response representing a todo item. The fields are the id, title, and creation timestamp.
/// </summary>
/// <param name="Id"></param>
/// <param name="Title"></param>
/// <param name="CreatedAt"></param>
public sealed record TodoResponse(Guid Id, string Title, DateTimeOffset CreatedAt)
{
    public static TodoResponse From(TodoItem item) => new(item.Id, item.Title, item.CreatedAt);
}
