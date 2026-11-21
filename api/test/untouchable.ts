// Test helper: a dependency that fails the test if it is touched at all. Used to prove that a
// service checks the caller's role before it reads the database, stores a file or writes an audit row.
export function untouchable<T>(name: string): T {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'then') return undefined; // not a thenable
        throw new Error(`${name}.${String(prop)} was used before the role check`);
      },
    },
  ) as T;
}
