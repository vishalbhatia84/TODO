using TodoApi.DTOs;
using TodoApi.Data;
using TodoApi.Models;
using TodoApi.Services;

namespace TodoApi.UnitTests;

public sealed class TodoServiceTests
{
    private readonly TestClock clock = new();
    private readonly InMemoryTodoRepository repository = new();
    private readonly TodoService service;

    public TodoServiceTests() => service = new TodoService(repository, clock);

    private TodoResponse Add(string title)
    {
        var result = service.Create(new CreateTodoRequest(title));
        Assert.False(result.IsInvalid);
        clock.Advance(TimeSpan.FromSeconds(1));

        return result.Todo;
    }

    [Fact]
    public void GetAll_is_empty_to_begin_with()
    {
        Assert.Empty(service.GetAll());
    }

    [Fact]
    public void Create_stores_the_todo_and_returns_it()
    {
        var created = Add("Buy milk");

        Assert.Equal("Buy milk", created.Title);
        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal(created.Id, Assert.Single(service.GetAll()).Id);
    }

    [Theory]
    [InlineData("Buy milk", "Buy milk")]
    [InlineData("  Buy milk  ", "Buy milk")]
    [InlineData("\tBuy milk\n", "Buy milk")]
    public void Create_trims_the_title(string raw, string expected)
    {
        var result = service.Create(new CreateTodoRequest(raw));

        Assert.False(result.IsInvalid);
        Assert.Equal(expected, result.Todo.Title);
    }

    [Fact]
    public void Create_stamps_the_injected_clock()
    {
        var created = service.Create(new CreateTodoRequest("Buy milk"));

        Assert.False(created.IsInvalid);
        Assert.Equal(clock.GetUtcNow(), created.Todo.CreatedAt);
    }

    [Fact]
    public void Create_accepts_a_title_at_the_limit()
    {
        var result = service.Create(
            new CreateTodoRequest(new string('x', TodoService.TitleMaxLength)));

        Assert.False(result.IsInvalid);
    }

    [Fact]
    public void Create_rejects_a_title_past_the_limit()
    {
        var result = service.Create(
            new CreateTodoRequest(new string('x', TodoService.TitleMaxLength + 1)));

        Assert.True(result.IsInvalid);
        Assert.Equal(
            $"Title must be {TodoService.TitleMaxLength} characters or fewer.",
            result.Error);
    }

    [Fact]
    public void GetAll_returns_todos_oldest_first()
    {
        var first = Add("First");
        var second = Add("Second");
        var third = Add("Third");

        Assert.Equal([first.Id, second.Id, third.Id], service.GetAll().Select(todo => todo.Id));
    }

    [Fact]
    public void Delete_removes_the_todo_and_reports_success()
    {
        var created = Add("Buy milk");

        Assert.True(service.Delete(created.Id));
        Assert.Empty(service.GetAll());
    }

    [Fact]
    public void Delete_reports_failure_for_an_unknown_id()
    {
        Add("Buy milk");

        Assert.False(service.Delete(Guid.NewGuid()));
        Assert.Single(service.GetAll());
    }

    /// <summary>Counts calls, so a test can assert storage was left alone.</summary>
    private sealed class RecordingTodoRepository : ITodoRepository
    {
        public int AddCalls { get; private set; }

        public IReadOnlyList<TodoItem> GetAll() => [];

        public TodoItem Add(TodoItem item)
        {
            AddCalls++;
            return item;
        }

        public bool Delete(Guid id) => false;
    }
}
