using TodoApi.DTOs;
using TodoApi.Data;
using TodoApi.Models;

namespace TodoApi.Services;

/// <summary>
/// The todo rules, in one place.
/// </summary>
/// <param name="repository">Storage; this class never assumes what backs it.</param>
/// <param name="timeProvider">Clock, injected so tests can control timestamps.</param>
public sealed class TodoService(ITodoRepository repository, TimeProvider timeProvider) : ITodoService
{
    public const int TitleMaxLength = 200;

    public IReadOnlyList<TodoResponse> GetAll() =>
        [.. repository.GetAll().Select(TodoResponse.From)];

    public CreateTodoResult Create(CreateTodoRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var title = request.Title?.Trim() ?? string.Empty;

        if (title.Length == 0)
        {
            return CreateTodoResult.Invalid("Title is required.");
        }

        if (title.Length > TitleMaxLength)
        {
            return CreateTodoResult.Invalid($"Title must be {TitleMaxLength} characters or fewer.");
        }

        var created = repository.Add(new TodoItem(Guid.NewGuid(), title, timeProvider.GetUtcNow()));

        return CreateTodoResult.Success(TodoResponse.From(created));
    }

    public bool Delete(Guid id) => repository.Delete(id);
}
