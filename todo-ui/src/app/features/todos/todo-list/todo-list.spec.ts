import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Todo } from '../../../core/todo.model';
import { TodoList } from './todo-list';

const ITEMS: Todo[] = [
  { id: 'id-1', title: 'Buy milk', createdAt: '2026-09-24T09:00:00+00:00' },
  { id: 'id-2', title: 'Buy bread', createdAt: '2026-09-24T10:00:00+00:00' },
];

describe('TodoList', () => {
  let fixture: ComponentFixture<TodoList>;
  let deleted: string[];

  async function render(items: readonly Todo[]): Promise<void> {
    fixture.componentRef.setInput('items', items);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TodoList] }).compileComponents();

    fixture = TestBed.createComponent(TodoList);
    deleted = [];
    fixture.componentInstance.deleted.subscribe((id) => deleted.push(id));
  });

  function rows(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('li'));
  }

  it('renders one row per todo, in the order given', async () => {
    await render(ITEMS);

    expect(
      rows().map((row) => row.querySelector('.todo-list__title')?.textContent?.trim()),
    ).toEqual(['Buy milk', 'Buy bread']);
  });

  it('renders nothing for an empty list', async () => {
    await render([]);

    expect(rows()).toHaveLength(0);
  });

  it('emits the id of the todo whose button was pressed', async () => {
    await render(ITEMS);

    rows()[1].querySelector('button')!.click();

    expect(deleted).toEqual(['id-2']);
  });

  it('names the todo in each delete button for screen readers', async () => {
    await render(ITEMS);

    expect(rows()[0].querySelector('button')!.getAttribute('aria-label')).toBe('Delete Buy milk');
  });
});
