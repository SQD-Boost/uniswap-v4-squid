export type Awaitable<T> = T | Promise<T>;

export type Task = () => Awaitable<void>;

export class TaskQueue {
  private tasks: Task[] = [];

  add<T>(fn: Task): void {
    this.tasks.push(fn);
  }

  async run(): Promise<void> {
    while (this.tasks.length > 0) {
      const task = this.tasks.shift()!;
      await task();
    }
  }
}
