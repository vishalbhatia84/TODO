import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TodoForm } from './todo-form';

describe('TodoForm', () => {
  let fixture: ComponentFixture<TodoForm>;
  let emitted: string[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TodoForm] }).compileComponents();

    fixture = TestBed.createComponent(TodoForm);
    emitted = [];
    fixture.componentInstance.submitted.subscribe((title) => emitted.push(title));
    await fixture.whenStable();
  });

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input');
  }

  async function type(value: string): Promise<void> {
    const element = input();
    element.value = value;
    element.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  async function submit(): Promise<void> {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  function errorText(): string | null {
    return fixture.nativeElement.querySelector('.todo-form__error')?.textContent?.trim() ?? null;
  }

  it('emits the trimmed title and clears the field', async () => {
    await type('  Buy milk  ');
    await submit();

    expect(emitted).toEqual(['Buy milk']);
    expect(input().value).toBe('');
  });

  it('rejects a whitespace-only title', async () => {
    await type('   ');
    await submit();

    expect(emitted).toEqual([]);
    expect(errorText()).toBe('Give your todo a title.');
  });

  it('rejects a title beyond the server limit', async () => {
    await type('x'.repeat(201));
    await submit();

    expect(emitted).toEqual([]);
    expect(errorText()).toContain('under 200 characters');
  });

  it('does not cap what the user can type', () => {
    expect(input().hasAttribute('maxlength')).toBe(false);
  });

  function counterText(): string | null {
    return fixture.nativeElement.querySelector('.todo-form__counter')?.textContent?.trim() ?? null;
  }

  it('shows no counter until something is typed', () => {
    expect(counterText()).toBeNull();
  });

  it('counts what has been typed', async () => {
    await type('Buy milk');

    expect(counterText()).toBe('8 / 200');
  });

  it('keeps counting past the limit', async () => {
    await type('x'.repeat(201));

    expect(counterText()).toBe('201 / 200');
  });

  it('stays quiet until the user has engaged with the field', () => {
    expect(errorText()).toBeNull();
  });

  async function blur(): Promise<void> {
    input().dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  it('stays quiet when the field is blurred without being typed in', async () => {
    await blur();

    expect(errorText()).toBeNull();
  });

  it('stays quiet after a successful submit, even once the field is blurred', async () => {
    await type('Buy milk');
    await submit();

    await blur();

    expect(errorText()).toBeNull();
  });

  it('does not submit while a create is already in progress', async () => {
    await type('Buy milk');
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();

    await submit();

    expect(emitted).toEqual([]);
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
  });
});
