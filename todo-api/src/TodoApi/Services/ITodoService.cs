using System.Diagnostics.CodeAnalysis;
using TodoApi.DTOs;

namespace TodoApi.Services;

public sealed record CreateTodoResult(TodoResponse? Todo, string? Error)
{
    public static CreateTodoResult Success(TodoResponse todo) => new(todo, null);
    public static CreateTodoResult Invalid(string error) => new(null, error);

    [MemberNotNullWhen(true, nameof(Error))]
    [MemberNotNullWhen(false, nameof(Todo))]
    public bool IsInvalid => Error is not null;
}

public interface ITodoService
{
    /// <summary>All todos, oldest first.</summary>
    IReadOnlyList<TodoResponse> GetAll();

    /// <summary>Validates, creates and stores a todo item.</summary>
    CreateTodoResult Create(CreateTodoRequest request);

    /// <summary>Deletes a todo.</summary>
    /// <returns>true if one was removed; false if no such id exists.</returns>
    bool Delete(Guid id);
}
