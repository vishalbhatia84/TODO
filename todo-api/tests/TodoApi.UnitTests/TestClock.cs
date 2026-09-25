namespace TodoApi.UnitTests;

internal sealed class TestClock(DateTimeOffset start) : TimeProvider
{
    private DateTimeOffset now = start;

    public TestClock()
        : this(new DateTimeOffset(2026, 9, 24, 9, 0, 0, TimeSpan.Zero))
    {
    }

    public override DateTimeOffset GetUtcNow() => now;

    public void Advance(TimeSpan delta) => now = now.Add(delta);
}
