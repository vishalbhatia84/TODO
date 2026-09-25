import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Todo } from '../../../core/todo.model';

@Component({
  selector: 'app-todo-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './todo-list.html',
})
export class TodoList {
  readonly items = input.required<readonly Todo[]>();
  readonly deleted = output<string>();
}
