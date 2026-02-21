// descriptive-rating-store.ts
import { createAtomicMap, createReactiveStore } from "@clinicaltoolkits/utility-functions";
import { makeUseStore } from "@clinicaltoolkits/universal-react-components";
import type { DescriptiveRatingSet } from "../types";
import { fetchDescriptiveRatingSets } from "../api";
import { subscribe } from "@clinicaltoolkits/content-blocks";

/** 
 * The reactive state held by this store.
 * - selectedIds: the set of identifiers that the atomic controller manages.
 * - byId: the cache that maps identifier -> array of DescriptiveRatingSet.
 *   (Each identifier stores a one-element array to align with the atomic controller’s V[] shape.)
 */
interface StoreState {
  selectedIds: string[];
  byId: Map<string, readonly DescriptiveRatingSet[]>;
}

/**
 * Create a descriptive ratings store.
 *
 * What this store does:
 * 1) Keeps a reactive cache of descriptive rating sets keyed by identifier.
 * 2) When you add an identifier, if it is not already cached, the atomic controller fetches it and writes it to the cache.
 * 3) When you call ensure(identifier), it returns a Promise that resolves with the set once present,
 *    or rejects if the underlying fetch fails. The store does not add any custom error tracking.
 */
export function createDescriptiveRatingStore() {
  const store = createReactiveStore<StoreState>({
    selectedIds: [],
    byId: new Map(),
  });

  // Promise waiters per identifier for ensure(): we resolve on onFetched and reject on onFetchError.
  const waiters = new Map<string, Array<(value: DescriptiveRatingSet) => void>>();
  const rejectors = new Map<string, Array<(reason?: unknown) => void>>();

  const controller = createAtomicMap<string, DescriptiveRatingSet, DescriptiveRatingSet>({
    getSelected: () => store.snapshot.selectedIds,
    getDerivedMap: () => store.snapshot.byId,
    setState: (nextSelectedIds, nextDerivedMap) => {
      store.setState({ selectedIds: nextSelectedIds, byId: nextDerivedMap });
    },

    /**
     * Batch fetch for identifiers that are not yet cached.
     * This function wires directly to your Supabase batch fetcher.
     * If any requested identifier is not returned by Supabase (not found), the Promise rejects.
     * Otherwise it returns pairs of [identifier, array of DescriptiveRatingSet].
     */
    async fetchBatch(ids) {
      // Ask Supabase for exactly these identifiers in a single round-trip.
      const results = await fetchDescriptiveRatingSets(ids);

      // Build a lookup from identifier to the returned set.
      const byId = new Map(results.map((r) => [r.id, r]));

      // If Supabase did not return every requested identifier, fail the batch.
      const missing = ids.filter((id) => !byId.has(id));
      if (missing.length > 0) {
        // Reject with a clear error; callers decide how to handle it.
        throw new Error(`Descriptive rating set(s) not found: ${missing.join(", ")}`);
      }

      // Return the atomic-shaped pairs: [id, readonly DescriptiveRatingSet[]]
      return ids.map((id) => {
        const set = byId.get(id)!;
        const arr = [set] as readonly DescriptiveRatingSet[];
        return [id, arr] as const;
      });
    },

    /**
     * When a fetched value is committed to the cache, resolve any pending ensure() Promises for that identifier.
     */
    onFetched: (id, items) => {
      if (!items.length) return;
      const set = items[0];
      const resolvers = waiters.get(id);
      if (resolvers?.length) {
        for (const resolve of resolvers) resolve(set);
        waiters.delete(id);
      }
      // Drop any queued rejectors for this identifier; a successful fetch wins.
      rejectors.delete(id);
    },

    /**
     * If a fetch fails, reject any pending ensure() Promises for those identifiers.
     * No additional error state is stored; the rejection simply mirrors the underlying error.
     */
    onFetchError: (ids, error) => {
      for (const id of ids) {
        const list = rejectors.get(id);
        if (list?.length) {
          for (const reject of list) reject(error);
          rejectors.delete(id);
        }
        // Also clear any resolvers for this identifier so a later success does not resolve an already-rejected Promise.
        waiters.delete(id);
      }
    },

    debug: false,
  });

  /** 
   * Add a single identifier to the selection. 
   * If its value is not cached, the controller schedules a fetch and will write it to the cache when it arrives.
   */
  function add(id: string): void {
    controller.add([id]);
  }

  /**
   * Add multiple identifiers to the selection in a single call.
   * Missing values will be fetched and cached.
   */
  function addMany(ids: readonly string[]): void {
    controller.add(ids);
  }

  /**
   * Replace the entire selection with the provided identifiers.
   * Missing values will be fetched and cached; removed identifiers are evicted from the cache surface.
   */
  function replace(ids: readonly string[]): void {
    controller.replace(ids);
  }

  /**
   * Remove a single identifier from the selection and drop its cached value from the derived Map.
   */
  function remove(id: string): void {
    controller.remove([id]);
  }

  /**
   * Return true if the identifier already has a cached value.
   */
  function has(id: string): boolean {
    return store.snapshot.byId.has(id);
  }

  /**
   * Return the cached descriptive rating set synchronously, or undefined if it is not present.
   */
  function get(id: string): DescriptiveRatingSet | undefined {
    return store.snapshot.byId.get(id)?.[0];
  }

  /**
   * Ensure that a descriptive rating set for the given identifier is available.
   * - If it is already cached, this resolves immediately with the cached value.
   * - If it is not cached, this schedules a fetch and resolves when it arrives.
   * - If the fetch fails, this rejects with the same error thrown by the underlying fetch.
   */
  function ensure(id: string): Promise<DescriptiveRatingSet> {
    const cached = get(id);
    if (cached) return Promise.resolve(cached);

    add(id); // schedule through the controller

    return new Promise<DescriptiveRatingSet>((resolve, reject) => {
      const rlist = waiters.get(id) ?? [];
      rlist.push(resolve);
      waiters.set(id, rlist);

      const jlist = rejectors.get(id) ?? [];
      jlist.push(reject);
      rejectors.set(id, jlist);
    });
  }

  return {
    subscribe: store.subscribe,
    get snapshot() { return store.snapshot; },
    // Write operations
    add,
    addMany,
    replace,
    remove,
    // Read operations
    has,
    get,
    ensure,
  };
}

export const descriptiveRatingStore = createDescriptiveRatingStore();
export const useDescriptiveRatingState = makeUseStore(descriptiveRatingStore);
