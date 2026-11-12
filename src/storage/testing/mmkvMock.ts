/** Native boundary only: different MMKV instances share data by instance id. */
export const mockMMKV = {
  databases: new Map<string, Map<string, string>>(),
  failInitialization: false,
  failRead: false,
  failWrite: false,
  failDelete: false,
  reset() {
    this.databases.clear();
    this.failInitialization = false;
    this.failRead = false;
    this.failWrite = false;
    this.failDelete = false;
  },
};

export class MMKV {
  private readonly id: string;

  constructor(configuration: { id: string }) {
    if (mockMMKV.failInitialization) {
      throw new Error('Native storage unavailable');
    }
    this.id = configuration.id;
  }

  private get values() {
    let values = mockMMKV.databases.get(this.id);
    if (!values) {
      values = new Map<string, string>();
      mockMMKV.databases.set(this.id, values);
    }
    return values;
  }

  getString(key: string): string | undefined {
    if (mockMMKV.failRead) {
      throw new Error('Storage read failed');
    }
    return this.values.get(key);
  }

  contains(key: string): boolean {
    return this.values.has(key);
  }

  set(key: string, value: string): void {
    if (mockMMKV.failWrite) {
      throw new Error('Storage write failed');
    }
    this.values.set(key, value);
  }

  delete(key: string): void {
    if (mockMMKV.failDelete) {
      throw new Error('Storage deletion failed');
    }
    this.values.delete(key);
  }
}
