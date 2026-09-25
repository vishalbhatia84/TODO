using TodoApi.Data;
using TodoApi.Models;

namespace TodoApi.UnitTests;

public sealed class InMemoryTodoRepositoryTests
{
    private readonly InMemoryTodoRepository repository = new();
    private readonly TestClock clock = new();

    private TodoItem Add(string title)
    {
        var item = repository.Add(new TodoItem(Guid.NewGuid(), title, clock.GetUtcNow()));
        clock.Advance(TimeSpan.FromSeconds(1));
        return item;
    }

    [Fact]
    public void GetAll_is_empty_to_begin_with()
    {
        Assert.Empty(repository.GetAll());
    }

    [Fact]
    public void Add_returns_the_stored_item_and_makes_it_retrievable()
    {
        var item = Add("Buy milk");

        Assert.Equal(item, Assert.Single(repository.GetAll()));
    }

    [Fact]
    public void GetAll_returns_items_oldest_first()
    {
        var first = Add("First");
        var second = Add("Second");
        var third = Add("Third");

        Assert.Equal([first, second, third], repository.GetAll());
    }

    [Fact]
    public void GetAll_orders_by_creation_not_insertion()
    {
        var later = new TodoItem(
            Guid.NewGuid(), "Later", new DateTimeOffset(2026, 9, 24, 12, 0, 0, TimeSpan.Zero));
        var earlier = new TodoItem(
            Guid.NewGuid(), "Earlier", new DateTimeOffset(2026, 9, 24, 8, 0, 0, TimeSpan.Zero));

        repository.Add(later);
        repository.Add(earlier);

        Assert.Equal([earlier, later], repository.GetAll());
    }

    [Fact]
    public void GetAll_is_a_snapshot_that_later_writes_do_not_mutate()
    {
        Add("First");
        var snapshot = repository.GetAll();

        Add("Second");

        Assert.Single(snapshot);
    }

    [Fact]
    public void Delete_removes_the_item_and_reports_success()
    {
        var item = Add("Buy milk");

        Assert.True(repository.Delete(item.Id));
        Assert.Empty(repository.GetAll());
    }

    [Fact]
    public void Delete_reports_failure_for_an_unknown_id()
    {
        Add("Buy milk");

        Assert.False(repository.Delete(Guid.NewGuid()));
        Assert.Single(repository.GetAll());
    }

    [Fact]
    public void Delete_is_not_repeatable()
    {
        var item = Add("Buy milk");
        repository.Delete(item.Id);

        Assert.False(repository.Delete(item.Id));
    }

    [Fact]
    public void Add_loses_nothing_under_concurrent_writes()
    {
        // The reason for ConcurrentDictionary. Against a plain List<T> this
        // test fails intermittently — which is exactly how the bug would show
        // up in production.
        const int writers = 100;

        Parallel.For(
            0,
            writers,
            i => repository.Add(new TodoItem(Guid.NewGuid(), $"Todo {i}", clock.GetUtcNow())));

        Assert.Equal(writers, repository.GetAll().Count);
    }
}
