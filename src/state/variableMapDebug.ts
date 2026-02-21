import { Variable, isVariable } from "../types";

// Can be used in lieu of a normal VariableMap to help debug places where
// Variables are being converted to plain objects (POJOs) by mistake.
export function instrumentVariableMap(map: Map<string, Variable>, label: string) {
  const isVar = (v: unknown): v is Variable => !!v && typeof v === "object" && isVariable(v as any);

  const origSet = map.set.bind(map);
  const origGet = map.get.bind(map);
  const origValues = map.values.bind(map);
  const origEntries = map.entries.bind(map);

  Object.defineProperty(map, "set", {
    configurable: true, writable: true, enumerable: false,
    value(key: string, value: Variable) {
      if (!isVar(value)) {
        console.groupCollapsed(`❌ ${label}.set("${key}") with NON-Variable`);
        console.log("keys:", value && typeof value === "object" ? Object.keys(value as any) : value);
        console.trace("Stack where POJO inserted");
        console.groupEnd();
      }
      return origSet(key, value);
    },
  });

  Object.defineProperty(map, "get", {
    configurable: true, writable: true, enumerable: false,
    value(key: string) {
      const out = origGet(key);
      if (out && !isVar(out)) {
        console.groupCollapsed(`⚠️ ${label}.get("${key}") returned NON-Variable`);
        console.log("keys:", Object.keys(out as any));
        console.trace("Stack of GET (value already POJO in map)");
        console.groupEnd();
      }
      return out;
    },
  });

  Object.defineProperty(map, "values", {
    configurable: true, writable: true, enumerable: false,
    value() {
      const it = origValues();
      return {
        [Symbol.iterator]() { return this; },
        next() {
          const n = it.next();
          if (!n.done) {
            const v = n.value;
            if (v && !isVar(v)) {
              console.groupCollapsed(`⚠️ ${label}.values() yielded NON-Variable`);
              console.log("keys:", Object.keys(v as any));
              console.trace("Stack of ITERATION over POJO");
              console.groupEnd();
            }
          }
          return n;
        },
      };
    },
  });

  Object.defineProperty(map, "entries", {
    configurable: true, writable: true, enumerable: false,
    value() {
      const it = origEntries();
      return {
        [Symbol.iterator]() { return this; },
        next() {
          const n = it.next();
          if (!n.done) {
            const [, v] = n.value;
            if (v && !isVar(v)) {
              console.groupCollapsed(`⚠️ ${label}.entries() yielded NON-Variable`);
              console.log("keys:", Object.keys(v as any));
              console.trace("Stack of ITERATION over POJO");
              console.groupEnd();
            }
          }
          return n;
        },
      };
    },
  });

  return map;
}