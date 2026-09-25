import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TodoForm } from '../todo-form/todo-form';
import { TodoList } from '../todo-list/todo-list';
import { TodoStore } from '../todo-store';

@Component({
  selector: 'app-todo-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TodoForm, TodoList],
  templateUrl: './todo-page.html',
})
export class TodoPage implements OnInit {
  protected readonly store = inject(TodoStore);

  ngOnInit(): void {
    void this.store.load();
  }

  protected add(title: string): void {
    void this.store.add(title);
  }

  protected remove(id: string): void {
    void this.store.remove(id);
  }

  protected retry(): void {
    void this.store.load();
  }
}
