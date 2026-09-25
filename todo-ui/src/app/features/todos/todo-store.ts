import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { describeHttpError } from '../../core/problem-details';
import { TodoApiService } from '../../core/todo-api.service';
import { Todo } from '../../core/todo.model';

@Injectable({ providedIn: 'root' })
export class TodoStore {
  private readonly api = inject(TodoApiService);

  private readonly itemsSignal = signal<readonly Todo[]>([]);
  private readonly loadedSignal = signal(false);
  private readonly loadingSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly items = this.itemsSignal.asReadonly();

  readonly loading = this.loadingSignal.asReadonly();

  readonly saving = this.savingSignal.asReadonly();

  readonly error = this.errorSignal.asReadonly();

  readonly count = computed(() => this.itemsSignal().length);

  readonly isEmpty = computed(
    () =>
      this.loadedSignal() &&
      !this.loadingSignal() &&
      this.errorSignal() === null &&
      this.itemsSignal().length === 0,
  );

  async load(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      this.itemsSignal.set(await firstValueFrom(this.api.getAll()));
      this.loadedSignal.set(true);
    } catch (error) {
      this.errorSignal.set(describeHttpError(error, 'Could not load your todos.'));
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async add(title: string): Promise<boolean> {
    this.savingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const created = await firstValueFrom(this.api.create({ title }));
      this.itemsSignal.update((items) => [...items, created]);
      return true;
    } catch (error) {
      this.errorSignal.set(describeHttpError(error, 'Could not add that todo.'));
      return false;
    } finally {
      this.savingSignal.set(false);
    }
  }

  async remove(id: string): Promise<void> {
    const snapshot = this.itemsSignal();
    this.itemsSignal.set(snapshot.filter((item) => item.id !== id));
    this.errorSignal.set(null);

    try {
      await firstValueFrom(this.api.delete(id));
    } catch (error) {
      this.itemsSignal.set(snapshot);
      this.errorSignal.set(describeHttpError(error, 'Could not delete that todo.'));
    }
  }
}
