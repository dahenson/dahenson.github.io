// build/dev/javascript/prelude.mjs
class CustomType {
  withFields(fields) {
    let properties = Object.keys(this).map((label) => (label in fields) ? fields[label] : this[label]);
    return new this.constructor(...properties);
  }
}

class List {
  static fromArray(array, tail) {
    return toList(array, tail);
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  atLeastLength(desired) {
    let current = this;
    while (desired-- > 0 && current)
      current = current.tail;
    return current !== undefined;
  }
  hasLength(desired) {
    let current = this;
    while (desired-- > 0 && current)
      current = current.tail;
    return desired === -1 && current instanceof Empty;
  }
  countLength() {
    let current = this;
    let length = 0;
    while (current) {
      current = current.tail;
      length++;
    }
    return length - 1;
  }
}
function prepend(element, tail) {
  return new NonEmpty(element, tail);
}
function toList(elements, tail) {
  let t = tail || List$Empty$const;
  for (let i = elements.length - 1;i >= 0; --i) {
    t = new NonEmpty(elements[i], t);
  }
  return t;
}

class ListIterator {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
}

class Empty extends List {
}
var List$Empty$const = new Empty;
var List$Empty = () => List$Empty$const;
var List$isEmpty = (value) => value instanceof Empty;

class NonEmpty extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
}
var List$NonEmpty = (head, tail) => new NonEmpty(head, tail);
var List$isNonEmpty = (value) => value instanceof NonEmpty;
var List$NonEmpty$first = (value) => value.head;
var List$NonEmpty$rest = (value) => value.tail;

class BitArray {
  bitSize;
  byteSize;
  bitOffset;
  rawBuffer;
  constructor(buffer, bitSize, bitOffset) {
    if (!(buffer instanceof Uint8Array)) {
      throw globalThis.Error("BitArray can only be constructed from a Uint8Array");
    }
    this.bitSize = bitSize ?? buffer.length * 8;
    this.byteSize = Math.trunc((this.bitSize + 7) / 8);
    this.bitOffset = bitOffset ?? 0;
    if (this.bitSize < 0) {
      throw globalThis.Error(`BitArray bit size is invalid: ${this.bitSize}`);
    }
    if (this.bitOffset < 0 || this.bitOffset > 7) {
      throw globalThis.Error(`BitArray bit offset is invalid: ${this.bitOffset}`);
    }
    if (buffer.length !== Math.trunc((this.bitOffset + this.bitSize + 7) / 8)) {
      throw globalThis.Error("BitArray buffer length is invalid");
    }
    this.rawBuffer = buffer;
  }
  byteAt(index) {
    if (index < 0 || index >= this.byteSize) {
      return;
    }
    return bitArrayByteAt(this.rawBuffer, this.bitOffset, index);
  }
  equals(other) {
    if (this.bitSize !== other.bitSize) {
      return false;
    }
    const wholeByteCount = Math.trunc(this.bitSize / 8);
    if (this.bitOffset === 0 && other.bitOffset === 0) {
      for (let i = 0;i < wholeByteCount; i++) {
        if (this.rawBuffer[i] !== other.rawBuffer[i]) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (this.rawBuffer[wholeByteCount] >> unusedLowBitCount !== other.rawBuffer[wholeByteCount] >> unusedLowBitCount) {
          return false;
        }
      }
    } else {
      for (let i = 0;i < wholeByteCount; i++) {
        const a = bitArrayByteAt(this.rawBuffer, this.bitOffset, i);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, i);
        if (a !== b) {
          return false;
        }
      }
      const trailingBitsCount = this.bitSize % 8;
      if (trailingBitsCount) {
        const a = bitArrayByteAt(this.rawBuffer, this.bitOffset, wholeByteCount);
        const b = bitArrayByteAt(other.rawBuffer, other.bitOffset, wholeByteCount);
        const unusedLowBitCount = 8 - trailingBitsCount;
        if (a >> unusedLowBitCount !== b >> unusedLowBitCount) {
          return false;
        }
      }
    }
    return true;
  }
  get buffer() {
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error("BitArray.buffer does not support unaligned bit arrays");
    }
    return this.rawBuffer;
  }
  get length() {
    if (this.bitOffset !== 0 || this.bitSize % 8 !== 0) {
      throw new globalThis.Error("BitArray.length does not support unaligned bit arrays");
    }
    return this.rawBuffer.length;
  }
}
function bitArrayByteAt(buffer, bitOffset, index) {
  if (bitOffset === 0) {
    return buffer[index] ?? 0;
  } else {
    const a = buffer[index] << bitOffset & 255;
    const b = buffer[index + 1] >> 8 - bitOffset;
    return a | b;
  }
}

class UtfCodepoint {
  constructor(value) {
    this.value = value;
  }
}
class Result extends CustomType {
  static isResult(data) {
    return data instanceof Result;
  }
}

class Ok extends Result {
  constructor(value) {
    super();
    this[0] = value;
  }
  isOk() {
    return true;
  }
}
var Result$Ok = (value) => new Ok(value);
var Result$isOk = (value) => value instanceof Ok;
var Result$Ok$0 = (value) => value[0];

class Error extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  isOk() {
    return false;
  }
}
var Result$Error = (detail) => new Error(detail);
var Result$isError = (value) => value instanceof Error;
function isEqual(x, y) {
  let values = [x, y];
  while (values.length) {
    let a = values.pop();
    let b = values.pop();
    if (a === b)
      continue;
    if (!isObject(a) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b))
          continue;
        else
          return false;
      } catch {}
    }
    let [keys, get] = getters(a);
    const ka = keys(a);
    const kb = keys(b);
    if (ka.length !== kb.length)
      return false;
    for (let k of ka) {
      values.push(get(a, k), get(b, k));
    }
  }
  return true;
}
function getters(object) {
  if (object instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return !(a instanceof BitArray) && a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c))
    return false;
  return a.constructor === b.constructor;
}
function divideFloat(a, b) {
  if (b === 0) {
    return 0;
  } else {
    return a / b;
  }
}
function makeError(variant, file, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.file = file;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra)
    error[k] = extra[k];
  return error;
}
// build/dev/javascript/gleam_stdlib/gleam/order.mjs
class Lt extends CustomType {
}
var Order$Lt$const = new Lt;
var Order$Lt = () => Order$Lt$const;
class Eq extends CustomType {
}
var Order$Eq$const = new Eq;
var Order$Eq = () => Order$Eq$const;
class Gt extends CustomType {
}
var Order$Gt$const = new Gt;
var Order$Gt = () => Order$Gt$const;

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
class Some extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}
var Option$isSome = (value) => value instanceof Some;
var Option$Some$0 = (value) => value[0];

class None extends CustomType {
}
var Option$None$const = new None;

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap;
var tempDataView = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== undefined) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0;i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {}
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0;i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys = Object.keys(o);
    for (let i = 0;i < keys.length; i++) {
      const k = keys[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === undefined)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}

class Dict {
  constructor(size, root) {
    this.size = size;
    this.root = root;
  }
}
var bits = 5;
var mask = (1 << bits) - 1;
var noElementMarker = Symbol();

class Node {
  constructor(generation, datamap, nodemap, data) {
    this.datamap = datamap;
    this.nodemap = nodemap;
    this.data = data;
    this.generation = generation;
  }
  equals(other) {
    if (this === other)
      return true;
    if (!(other instanceof Node))
      return false;
    if (this.datamap !== other.datamap || this.nodemap !== other.nodemap) {
      return false;
    }
    const leftData = this.data;
    const rightData = other.data;
    if (leftData.length !== rightData.length)
      return false;
    if (this.datamap === 0 && this.nodemap === 0) {
      return this.#equalsOverflowEntries(rightData);
    }
    const edgesStart = leftData.length - popcount(this.nodemap);
    for (let i = 0;i < edgesStart; i += 2) {
      if (!isEqual(leftData[i], rightData[i]) || !isEqual(leftData[i + 1], rightData[i + 1])) {
        return false;
      }
    }
    for (let i = edgesStart;i < leftData.length; ++i) {
      if (!leftData[i].equals(rightData[i]))
        return false;
    }
    return true;
  }
  #equalsOverflowEntries(otherData) {
    const data = this.data;
    entries:
      for (let i = 0;i < data.length; i += 2) {
        for (let j = 0;j < otherData.length; j += 2) {
          if (isEqual(data[i], otherData[j])) {
            if (!isEqual(data[i + 1], otherData[j + 1]))
              return false;
            continue entries;
          }
        }
        return false;
      }
    return true;
  }
  hashCode() {
    const data = this.data;
    const edgesStart = data.length - popcount(this.nodemap);
    let hash = 0;
    for (let i = 0;i < edgesStart; i += 2) {
      hash = hash + hashMerge(getHash(data[i + 1]), getHash(data[i])) | 0;
    }
    for (let i = edgesStart;i < data.length; ++i) {
      hash = hash + data[i].hashCode() | 0;
    }
    return hash;
  }
}
var emptyNode = /* @__PURE__ */ newNode(0);
var emptyDict = /* @__PURE__ */ new Dict(0, emptyNode);
var errorNil = /* @__PURE__ */ Result$Error(undefined);
function newNode(generation) {
  return new Node(generation, 0, 0, []);
}
function copyNode(node, generation) {
  if (node.generation === generation) {
    return node;
  }
  const newData = node.data.slice(0);
  return new Node(generation, node.datamap, node.nodemap, newData);
}
function copyAndSet(node, generation, idx, val) {
  if (node.data[idx] === val) {
    return node;
  }
  node = copyNode(node, generation);
  node.data[idx] = val;
  return node;
}
function copyAndInsertPair(node, generation, bit, idx, key, val) {
  const data = node.data;
  const length = data.length;
  const newData = new Array(length + 2);
  let readIndex = 0;
  let writeIndex = 0;
  while (readIndex < idx)
    newData[writeIndex++] = data[readIndex++];
  newData[writeIndex++] = key;
  newData[writeIndex++] = val;
  while (readIndex < length)
    newData[writeIndex++] = data[readIndex++];
  return new Node(generation, node.datamap | bit, node.nodemap, newData);
}
function copyAndRemovePair(node, generation, bit, idx) {
  node = copyNode(node, generation);
  const data = node.data;
  const length = data.length;
  for (let w = idx, r = idx + 2;r < length; ++r, ++w) {
    data[w] = data[r];
  }
  data.pop();
  data.pop();
  node.datamap ^= bit;
  return node;
}
function make() {
  return emptyDict;
}
function get(dict, key) {
  const result = lookup(dict.root, key, getHash(key));
  return result !== noElementMarker ? Result$Ok(result) : errorNil;
}
function lookup(node, key, hash) {
  for (let shift = 0;shift < 32; shift += bits) {
    const data = node.data;
    const bit = hashbit(hash, shift);
    if (node.nodemap & bit) {
      node = data[data.length - 1 - index(node.nodemap, bit)];
    } else if (node.datamap & bit) {
      const dataidx = Math.imul(index(node.datamap, bit), 2);
      return isEqual(key, data[dataidx]) ? data[dataidx + 1] : noElementMarker;
    } else {
      return noElementMarker;
    }
  }
  const overflow = node.data;
  for (let i = 0;i < overflow.length; i += 2) {
    if (isEqual(key, overflow[i])) {
      return overflow[i + 1];
    }
  }
  return noElementMarker;
}
function toTransient(dict) {
  return {
    generation: nextGeneration(dict),
    root: dict.root,
    size: dict.size,
    dict
  };
}
function fromTransient(transient) {
  if (transient.root === transient.dict.root) {
    return transient.dict;
  }
  return new Dict(transient.size, transient.root);
}
function nextGeneration(dict) {
  const root = dict.root;
  if (root.generation < Number.MAX_SAFE_INTEGER) {
    return root.generation + 1;
  }
  const queue = [root];
  while (queue.length) {
    const node = queue.pop();
    node.generation = 0;
    const nodeStart = node.data.length - popcount(node.nodemap);
    for (let i = nodeStart;i < node.data.length; ++i) {
      queue.push(node.data[i]);
    }
  }
  return 1;
}
var globalTransient = /* @__PURE__ */ toTransient(emptyDict);
function insert(dict, key, value) {
  globalTransient.generation = nextGeneration(dict);
  globalTransient.size = dict.size;
  const hash = getHash(key);
  const root = insertIntoNode(globalTransient, dict.root, key, value, hash, 0);
  if (root === dict.root) {
    return dict;
  }
  return new Dict(globalTransient.size, root);
}
function insertIntoNode(transient, node, key, value, hash, shift) {
  const data = node.data;
  const generation = transient.generation;
  if (shift > 32) {
    for (let i = 0;i < data.length; i += 2) {
      if (isEqual(key, data[i])) {
        return copyAndSet(node, generation, i + 1, value);
      }
    }
    transient.size += 1;
    return copyAndInsertPair(node, generation, 0, data.length, key, value);
  }
  const bit = hashbit(hash, shift);
  if (node.nodemap & bit) {
    const nodeidx2 = data.length - 1 - index(node.nodemap, bit);
    let child2 = data[nodeidx2];
    child2 = insertIntoNode(transient, child2, key, value, hash, shift + bits);
    return copyAndSet(node, generation, nodeidx2, child2);
  }
  const dataidx = Math.imul(index(node.datamap, bit), 2);
  if ((node.datamap & bit) === 0) {
    transient.size += 1;
    return copyAndInsertPair(node, generation, bit, dataidx, key, value);
  }
  if (isEqual(key, data[dataidx])) {
    return copyAndSet(node, generation, dataidx + 1, value);
  }
  const childShift = shift + bits;
  let child = emptyNode;
  child = insertIntoNode(transient, child, key, value, hash, childShift);
  const key2 = data[dataidx];
  const value2 = data[dataidx + 1];
  const hash2 = getHash(key2);
  child = insertIntoNode(transient, child, key2, value2, hash2, childShift);
  transient.size -= 1;
  const length = data.length;
  const nodeidx = length - 1 - index(node.nodemap, bit);
  const newData = new Array(length - 1);
  let readIndex = 0;
  let writeIndex = 0;
  while (readIndex < dataidx)
    newData[writeIndex++] = data[readIndex++];
  readIndex += 2;
  while (readIndex <= nodeidx)
    newData[writeIndex++] = data[readIndex++];
  newData[writeIndex++] = child;
  while (readIndex < length)
    newData[writeIndex++] = data[readIndex++];
  return new Node(generation, node.datamap ^ bit, node.nodemap | bit, newData);
}
function destructiveTransientDelete(key, transient) {
  const hash = getHash(key);
  transient.root = deleteFromNode(transient, transient.root, key, hash, 0);
  return transient;
}
function deleteFromNode(transient, node, key, hash, shift) {
  const data = node.data;
  const generation = transient.generation;
  if (shift > 32) {
    for (let i = 0;i < data.length; i += 2) {
      if (isEqual(key, data[i])) {
        transient.size -= 1;
        return copyAndRemovePair(node, generation, 0, i);
      }
    }
    return node;
  }
  const bit = hashbit(hash, shift);
  const dataidx = Math.imul(index(node.datamap, bit), 2);
  if ((node.nodemap & bit) !== 0) {
    const nodeidx = data.length - 1 - index(node.nodemap, bit);
    let child = data[nodeidx];
    child = deleteFromNode(transient, child, key, hash, shift + bits);
    if (child.nodemap !== 0 || child.data.length > 2) {
      return copyAndSet(node, generation, nodeidx, child);
    }
    const length = data.length;
    const newData = new Array(length + 1);
    let readIndex = 0;
    let writeIndex = 0;
    while (readIndex < dataidx)
      newData[writeIndex++] = data[readIndex++];
    newData[writeIndex++] = child.data[0];
    newData[writeIndex++] = child.data[1];
    while (readIndex < nodeidx)
      newData[writeIndex++] = data[readIndex++];
    readIndex++;
    while (readIndex < length)
      newData[writeIndex++] = data[readIndex++];
    return new Node(generation, node.datamap | bit, node.nodemap ^ bit, newData);
  }
  if ((node.datamap & bit) === 0 || !isEqual(key, data[dataidx])) {
    return node;
  }
  transient.size -= 1;
  return copyAndRemovePair(node, generation, bit, dataidx);
}
function fold(dict, state, fun) {
  const queue = [dict.root];
  while (queue.length) {
    const node = queue.pop();
    const data = node.data;
    const edgesStart = data.length - popcount(node.nodemap);
    for (let i = 0;i < edgesStart; i += 2) {
      state = fun(state, data[i], data[i + 1]);
    }
    for (let i = edgesStart;i < data.length; ++i) {
      queue.push(data[i]);
    }
  }
  return state;
}
function popcount(n) {
  n -= n >>> 1 & 1431655765;
  n = (n & 858993459) + (n >>> 2 & 858993459);
  return Math.imul(n + (n >>> 4) & 252645135, 16843009) >>> 24;
}
function index(bitmap, bit) {
  return popcount(bitmap & bit - 1);
}
function hashbit(hash, shift) {
  return 1 << (hash >>> shift & mask);
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function keys(dict) {
  return fold(dict, List$Empty$const, (acc, key, _) => {
    return prepend(key, acc);
  });
}
function delete$(dict, key) {
  let _pipe = toTransient(dict);
  let _pipe$1 = ((_capture) => {
    return destructiveTransientDelete(key, _capture);
  })(_pipe);
  return fromTransient(_pipe$1);
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
class Ascending extends CustomType {
}
var Sorting$Ascending$const = new Ascending;

class Descending extends CustomType {
}
var Sorting$Descending$const = new Descending;
function length_loop(loop$list, loop$count) {
  while (true) {
    let list = loop$list;
    let count = loop$count;
    if (list instanceof Empty) {
      return count;
    } else {
      let list$1 = list.tail;
      loop$list = list$1;
      loop$count = count + 1;
    }
  }
}
function length(list) {
  return length_loop(list, 0);
}
function count_loop(loop$list, loop$predicate, loop$acc) {
  while (true) {
    let list = loop$list;
    let predicate = loop$predicate;
    let acc = loop$acc;
    if (list instanceof Empty) {
      return acc;
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let $ = predicate(first$1);
      if ($) {
        loop$list = rest$1;
        loop$predicate = predicate;
        loop$acc = acc + 1;
      } else {
        loop$list = rest$1;
        loop$predicate = predicate;
        loop$acc = acc;
      }
    }
  }
}
function count(list, predicate) {
  return count_loop(list, predicate, 0);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix instanceof Empty) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list) {
  return reverse_and_prepend(list, List$Empty$const);
}
function filter_map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let _block;
      let $ = fun(first$1);
      if ($ instanceof Ok) {
        let first$2 = $[0];
        _block = prepend(first$2, acc);
      } else {
        _block = acc;
      }
      let new_acc = _block;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter_map(list, fun) {
  return filter_map_loop(list, fun, List$Empty$const);
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map2(list, fun) {
  return map_loop(list, fun, List$Empty$const);
}
function map2_loop(loop$list1, loop$list2, loop$fun, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      return reverse(acc);
    } else if (list2 instanceof Empty) {
      return reverse(acc);
    } else {
      let a = list1.head;
      let as_ = list1.tail;
      let b = list2.head;
      let bs = list2.tail;
      loop$list1 = as_;
      loop$list2 = bs;
      loop$fun = fun;
      loop$acc = prepend(fun(a, b), acc);
    }
  }
}
function map22(list1, list2, fun) {
  return map2_loop(list1, list2, fun, List$Empty$const);
}
function index_map_loop(loop$list, loop$fun, loop$index, loop$acc) {
  while (true) {
    let list = loop$list;
    let fun = loop$fun;
    let index2 = loop$index;
    let acc = loop$acc;
    if (list instanceof Empty) {
      return reverse(acc);
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      let acc$1 = prepend(fun(first$1, index2), acc);
      loop$list = rest$1;
      loop$fun = fun;
      loop$index = index2 + 1;
      loop$acc = acc$1;
    }
  }
}
function index_map(list, fun) {
  return index_map_loop(list, fun, 0, List$Empty$const);
}
function drop(loop$list, loop$n) {
  while (true) {
    let list = loop$list;
    let n = loop$n;
    let $ = n <= 0;
    if ($) {
      return list;
    } else {
      if (list instanceof Empty) {
        return list;
      } else {
        let rest$1 = list.tail;
        loop$list = rest$1;
        loop$n = n - 1;
      }
    }
  }
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first = loop$first;
    let second = loop$second;
    if (first instanceof Empty) {
      return second;
    } else {
      let first$1 = first.head;
      let rest$1 = first.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second);
    }
  }
}
function append(first, second) {
  return append_loop(reverse(first), second);
}
function prepend2(list, item) {
  return prepend(item, list);
}
function flatten_loop(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists instanceof Empty) {
      return reverse(acc);
    } else {
      let list = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend(list, acc);
    }
  }
}
function flatten(lists) {
  return flatten_loop(lists, List$Empty$const);
}
function fold2(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list instanceof Empty) {
      return initial;
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function index_fold_loop(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc = loop$acc;
    let with$ = loop$with;
    let index2 = loop$index;
    if (over instanceof Empty) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index2);
      loop$with = with$;
      loop$index = index2 + 1;
    }
  }
}
function index_fold(list, initial, fun) {
  return index_fold_loop(list, initial, fun, 0);
}
function zip_loop(loop$one, loop$other, loop$acc) {
  while (true) {
    let one = loop$one;
    let other = loop$other;
    let acc = loop$acc;
    if (one instanceof Empty) {
      return reverse(acc);
    } else if (other instanceof Empty) {
      return reverse(acc);
    } else {
      let first_one = one.head;
      let rest_one = one.tail;
      let first_other = other.head;
      let rest_other = other.tail;
      loop$one = rest_one;
      loop$other = rest_other;
      loop$acc = prepend([first_one, first_other], acc);
    }
  }
}
function zip(list, other) {
  return zip_loop(list, other, List$Empty$const);
}
function merge_descendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let compare2 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list = list2;
      return reverse_and_prepend(list, acc);
    } else if (list2 instanceof Empty) {
      let list = list1;
      return reverse_and_prepend(list, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list2.head;
      let rest2 = list2.tail;
      let $ = compare2(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare2;
        loop$acc = prepend(first2, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare2;
        loop$acc = prepend(first1, acc);
      } else {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare2;
        loop$acc = prepend(first1, acc);
      }
    }
  }
}
function merge_descending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences = loop$sequences;
    let compare2 = loop$compare;
    let acc = loop$acc;
    if (sequences instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences.tail;
      if ($ instanceof Empty) {
        let sequence = sequences.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let descending1 = sequences.head;
        let descending2 = $.head;
        let rest$1 = $.tail;
        let ascending = merge_descendings(descending1, descending2, compare2, List$Empty$const);
        loop$sequences = rest$1;
        loop$compare = compare2;
        loop$acc = prepend(ascending, acc);
      }
    }
  }
}
function merge_ascendings(loop$list1, loop$list2, loop$compare, loop$acc) {
  while (true) {
    let list1 = loop$list1;
    let list2 = loop$list2;
    let compare2 = loop$compare;
    let acc = loop$acc;
    if (list1 instanceof Empty) {
      let list = list2;
      return reverse_and_prepend(list, acc);
    } else if (list2 instanceof Empty) {
      let list = list1;
      return reverse_and_prepend(list, acc);
    } else {
      let first1 = list1.head;
      let rest1 = list1.tail;
      let first2 = list2.head;
      let rest2 = list2.tail;
      let $ = compare2(first1, first2);
      if ($ instanceof Lt) {
        loop$list1 = rest1;
        loop$list2 = list2;
        loop$compare = compare2;
        loop$acc = prepend(first1, acc);
      } else if ($ instanceof Eq) {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare2;
        loop$acc = prepend(first2, acc);
      } else {
        loop$list1 = list1;
        loop$list2 = rest2;
        loop$compare = compare2;
        loop$acc = prepend(first2, acc);
      }
    }
  }
}
function merge_ascending_pairs(loop$sequences, loop$compare, loop$acc) {
  while (true) {
    let sequences = loop$sequences;
    let compare2 = loop$compare;
    let acc = loop$acc;
    if (sequences instanceof Empty) {
      return reverse(acc);
    } else {
      let $ = sequences.tail;
      if ($ instanceof Empty) {
        let sequence = sequences.head;
        return reverse(prepend(reverse(sequence), acc));
      } else {
        let ascending1 = sequences.head;
        let ascending2 = $.head;
        let rest$1 = $.tail;
        let descending = merge_ascendings(ascending1, ascending2, compare2, List$Empty$const);
        loop$sequences = rest$1;
        loop$compare = compare2;
        loop$acc = prepend(descending, acc);
      }
    }
  }
}
function merge_all(loop$sequences, loop$direction, loop$compare) {
  while (true) {
    let sequences = loop$sequences;
    let direction = loop$direction;
    let compare2 = loop$compare;
    if (sequences instanceof Empty) {
      return sequences;
    } else if (direction instanceof Ascending) {
      let $ = sequences.tail;
      if ($ instanceof Empty) {
        let sequence = sequences.head;
        return sequence;
      } else {
        let sequences$1 = merge_ascending_pairs(sequences, compare2, List$Empty$const);
        loop$sequences = sequences$1;
        loop$direction = Sorting$Descending$const;
        loop$compare = compare2;
      }
    } else {
      let $ = sequences.tail;
      if ($ instanceof Empty) {
        let sequence = sequences.head;
        return reverse(sequence);
      } else {
        let sequences$1 = merge_descending_pairs(sequences, compare2, List$Empty$const);
        loop$sequences = sequences$1;
        loop$direction = Sorting$Ascending$const;
        loop$compare = compare2;
      }
    }
  }
}
function sequences(loop$list, loop$compare, loop$growing, loop$direction, loop$prev, loop$acc) {
  while (true) {
    let list = loop$list;
    let compare2 = loop$compare;
    let growing = loop$growing;
    let direction = loop$direction;
    let prev = loop$prev;
    let acc = loop$acc;
    let growing$1 = prepend(prev, growing);
    if (list instanceof Empty) {
      if (direction instanceof Ascending) {
        return prepend(reverse(growing$1), acc);
      } else {
        return prepend(growing$1, acc);
      }
    } else {
      let new$1 = list.head;
      let rest$1 = list.tail;
      let $ = compare2(prev, new$1);
      if (direction instanceof Ascending) {
        if ($ instanceof Lt) {
          loop$list = rest$1;
          loop$compare = compare2;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else if ($ instanceof Eq) {
          loop$list = rest$1;
          loop$compare = compare2;
          loop$growing = growing$1;
          loop$direction = direction;
          loop$prev = new$1;
          loop$acc = acc;
        } else {
          let _block;
          if (direction instanceof Ascending) {
            _block = prepend(reverse(growing$1), acc);
          } else {
            _block = prepend(growing$1, acc);
          }
          let acc$1 = _block;
          if (rest$1 instanceof Empty) {
            return prepend(toList([new$1]), acc$1);
          } else {
            let next = rest$1.head;
            let rest$2 = rest$1.tail;
            let _block$1;
            let $1 = compare2(new$1, next);
            if ($1 instanceof Lt) {
              _block$1 = Sorting$Ascending$const;
            } else if ($1 instanceof Eq) {
              _block$1 = Sorting$Ascending$const;
            } else {
              _block$1 = Sorting$Descending$const;
            }
            let direction$1 = _block$1;
            loop$list = rest$2;
            loop$compare = compare2;
            loop$growing = toList([new$1]);
            loop$direction = direction$1;
            loop$prev = next;
            loop$acc = acc$1;
          }
        }
      } else if ($ instanceof Lt) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare2(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = Sorting$Ascending$const;
          } else if ($1 instanceof Eq) {
            _block$1 = Sorting$Ascending$const;
          } else {
            _block$1 = Sorting$Descending$const;
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare2;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else if ($ instanceof Eq) {
        let _block;
        if (direction instanceof Ascending) {
          _block = prepend(reverse(growing$1), acc);
        } else {
          _block = prepend(growing$1, acc);
        }
        let acc$1 = _block;
        if (rest$1 instanceof Empty) {
          return prepend(toList([new$1]), acc$1);
        } else {
          let next = rest$1.head;
          let rest$2 = rest$1.tail;
          let _block$1;
          let $1 = compare2(new$1, next);
          if ($1 instanceof Lt) {
            _block$1 = Sorting$Ascending$const;
          } else if ($1 instanceof Eq) {
            _block$1 = Sorting$Ascending$const;
          } else {
            _block$1 = Sorting$Descending$const;
          }
          let direction$1 = _block$1;
          loop$list = rest$2;
          loop$compare = compare2;
          loop$growing = toList([new$1]);
          loop$direction = direction$1;
          loop$prev = next;
          loop$acc = acc$1;
        }
      } else {
        loop$list = rest$1;
        loop$compare = compare2;
        loop$growing = growing$1;
        loop$direction = direction;
        loop$prev = new$1;
        loop$acc = acc;
      }
    }
  }
}
function sort(list, compare2) {
  if (list instanceof Empty) {
    return list;
  } else {
    let $ = list.tail;
    if ($ instanceof Empty) {
      return list;
    } else {
      let x = list.head;
      let y = $.head;
      let rest$1 = $.tail;
      let _block;
      let $1 = compare2(x, y);
      if ($1 instanceof Lt) {
        _block = Sorting$Ascending$const;
      } else if ($1 instanceof Eq) {
        _block = Sorting$Ascending$const;
      } else {
        _block = Sorting$Descending$const;
      }
      let direction = _block;
      let sequences$1 = sequences(rest$1, compare2, toList([x]), direction, y, List$Empty$const);
      return merge_all(sequences$1, Sorting$Ascending$const, compare2);
    }
  }
}
function each(loop$list, loop$f) {
  while (true) {
    let list = loop$list;
    let f = loop$f;
    if (list instanceof Empty) {
      return;
    } else {
      let first$1 = list.head;
      let rest$1 = list.tail;
      f(first$1);
      loop$list = rest$1;
      loop$f = f;
    }
  }
}
function window_by_2(list) {
  return zip(list, drop(list, 1));
}

// build/dev/javascript/gleam_stdlib/gleam/string_tree.mjs
class All extends CustomType {
}
var Direction$All$const = new All;

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
class Leading extends CustomType {
}
var Direction$Leading$const = new Leading;

class Trailing extends CustomType {
}
var Direction$Trailing$const = new Trailing;
function split2(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = identity(_pipe);
    let _pipe$2 = split(_pipe$1, substring);
    return map2(_pipe$2, identity);
  }
}
function concat_loop(loop$strings, loop$accumulator) {
  while (true) {
    let strings = loop$strings;
    let accumulator = loop$accumulator;
    if (strings instanceof Empty) {
      return accumulator;
    } else {
      let string = strings.head;
      let strings$1 = strings.tail;
      loop$strings = strings$1;
      loop$accumulator = accumulator + string;
    }
  }
}
function concat2(strings) {
  return concat_loop(strings, "");
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
class DecodeError extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
}
var DecodeError$DecodeError = (expected, found, path) => new DecodeError(expected, found, path);
class Decoder extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
}
var float2 = /* @__PURE__ */ new Decoder(decode_float);
var int2 = /* @__PURE__ */ new Decoder(decode_int);
var string2 = /* @__PURE__ */ new Decoder(decode_string);
function run(data, decoder) {
  let $ = decoder.function(data);
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors instanceof Empty) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function run_dynamic_function(data, name, f) {
  let $ = f(data);
  if ($ instanceof Ok) {
    let data$1 = $[0];
    return [data$1, List$Empty$const];
  } else {
    let placeholder = $[0];
    return [
      placeholder,
      toList([new DecodeError(name, classify_dynamic(data), List$Empty$const)])
    ];
  }
}
function decode_float(data) {
  return run_dynamic_function(data, "Float", float);
}
function map3(decoder, transformer) {
  return new Decoder((d) => {
    let $ = decoder.function(d);
    let data = $[0];
    let errors = $[1];
    return [transformer(data), errors];
  });
}
function decode_int(data) {
  return run_dynamic_function(data, "Int", int);
}
function decode_string(data) {
  return run_dynamic_function(data, "String", string);
}
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data = loop$data;
    let failure = loop$failure;
    let decoders = loop$decoders;
    if (decoders instanceof Empty) {
      return failure;
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder.function(data);
      let layer = $;
      let errors = $[1];
      if (errors instanceof Empty) {
        return layer;
      } else {
        loop$data = data;
        loop$failure = failure;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first, alternatives) {
  return new Decoder((dynamic_data) => {
    let $ = first.function(dynamic_data);
    let layer = $;
    let errors = $[1];
    if (errors instanceof Empty) {
      return layer;
    } else {
      return run_decoders(dynamic_data, layer, alternatives);
    }
  });
}
function path_segment_to_string(key) {
  let decoder = one_of(string2, toList([
    (() => {
      let _pipe = int2;
      return map3(_pipe, to_string);
    })(),
    (() => {
      let _pipe = float2;
      return map3(_pipe, float_to_string);
    })()
  ]));
  let $ = run(key, decoder);
  if ($ instanceof Ok) {
    let key$1 = $[0];
    return key$1;
  } else {
    return "<" + classify_dynamic(key) + ">";
  }
}
function push_path(layer, path) {
  let path$1 = map2(path, (key) => {
    let _pipe = key;
    let _pipe$1 = identity(_pipe);
    return path_segment_to_string(_pipe$1);
  });
  let errors = map2(layer[1], (error) => {
    return new DecodeError(error.expected, error.found, append(path$1, error.path));
  });
  return [layer[0], errors];
}
function list2(inner) {
  return new Decoder((data) => {
    return list(data, inner.function, (p, k) => {
      return push_path(p, toList([k]));
    }, 0, List$Empty$const);
  });
}
function index3(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data = loop$data;
    let handle_miss = loop$handle_miss;
    if (path instanceof Empty) {
      let _pipe = data;
      let _pipe$1 = inner(_pipe);
      return push_path(_pipe$1, reverse(position));
    } else {
      let key = path.head;
      let path$1 = path.tail;
      let $ = index2(data, key);
      if ($ instanceof Ok) {
        let $1 = $[0];
        if ($1 instanceof Some) {
          let data$1 = $1[0];
          loop$path = path$1;
          loop$position = prepend(key, position);
          loop$inner = inner;
          loop$data = data$1;
          loop$handle_miss = handle_miss;
        } else {
          return handle_miss(data, prepend(key, position));
        }
      } else {
        let kind = $[0];
        let $1 = inner(data);
        let default$ = $1[0];
        let _pipe = [
          default$,
          toList([
            new DecodeError(kind, classify_dynamic(data), List$Empty$const)
          ])
        ];
        return push_path(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next) {
  return new Decoder((data) => {
    let $ = index3(field_path, List$Empty$const, field_decoder.function, data, (data2, position) => {
      let $12 = field_decoder.function(data2);
      let default$ = $12[0];
      let _pipe = [
        default$,
        toList([new DecodeError("Field", "Nothing", List$Empty$const)])
      ];
      return push_path(_pipe, reverse(position));
    });
    let out = $[0];
    let errors1 = $[1];
    let $1 = next(out).function(data);
    let out$1 = $1[0];
    let errors2 = $1[1];
    return [out$1, append(errors1, errors2)];
  });
}
function success(data) {
  return new Decoder((_) => {
    return [data, List$Empty$const];
  });
}
function field(field_name, field_decoder, next) {
  return subfield(toList([field_name]), field_decoder, next);
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = undefined;
function identity(x) {
  return x;
}
function parse_int(value) {
  if (/^[-+]?(\d+)$/.test(value)) {
    return Result$Ok(parseInt(value));
  } else {
    return Result$Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
function graphemes(string3) {
  const iterator = graphemes_iterator(string3);
  if (iterator) {
    return arrayToList(Array.from(iterator).map((item) => item.segment));
  } else {
    return arrayToList(string3.match(/./gsu));
  }
}
var segmenter = undefined;
function graphemes_iterator(string3) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter;
    return segmenter.segment(string3)[Symbol.iterator]();
  }
}
function split(xs, pattern) {
  return arrayToList(xs.split(pattern));
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
var unicode_whitespaces = [
  " ",
  "\t",
  `
`,
  "\v",
  "\f",
  "\r",
  "",
  "\u2028",
  "\u2029"
].join("");
var trim_start_regex = /* @__PURE__ */ new RegExp(`^[${unicode_whitespaces}]*`);
var trim_end_regex = /* @__PURE__ */ new RegExp(`[${unicode_whitespaces}]*$`);
function round2(float3) {
  return Math.round(float3);
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (isResult(data)) {
    return "Result";
  } else if (isList(data)) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Array`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Nil";
  } else if (data === undefined) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
var MIN_I32 = -(2 ** 31);
var MAX_I32 = 2 ** 31 - 1;
var U32 = 2 ** 32;
var MAX_SAFE = Number.MAX_SAFE_INTEGER;
var MIN_SAFE = Number.MIN_SAFE_INTEGER;
function float_to_string(float3) {
  const string3 = float3.toString().replace("+", "");
  if (string3.indexOf(".") >= 0) {
    return string3;
  } else {
    const index4 = string3.indexOf("e");
    if (index4 >= 0) {
      return string3.slice(0, index4) + ".0" + string3.slice(index4);
    } else {
      return string3 + ".0";
    }
  }
}

class Inspector {
  #references = new Set;
  inspect(v) {
    const t = typeof v;
    if (v === true)
      return "True";
    if (v === false)
      return "False";
    if (v === null)
      return "//js(null)";
    if (v === undefined)
      return "Nil";
    if (t === "string")
      return this.#string(v);
    if (t === "bigint" || Number.isInteger(v))
      return v.toString();
    if (t === "number")
      return float_to_string(v);
    if (v instanceof UtfCodepoint)
      return this.#utfCodepoint(v);
    if (v instanceof BitArray)
      return this.#bit_array(v);
    if (v instanceof RegExp)
      return `//js(${v})`;
    if (v instanceof Date)
      return `//js(Date("${v.toISOString()}"))`;
    if (v instanceof globalThis.Error)
      return `//js(${v.toString()})`;
    if (v instanceof Function) {
      const args = [];
      for (const i of Array(v.length).keys())
        args.push(String.fromCharCode(i + 97));
      return `//fn(${args.join(", ")}) { ... }`;
    }
    if (this.#references.size === this.#references.add(v).size) {
      return "//js(circular reference)";
    }
    let printed;
    if (Array.isArray(v)) {
      printed = `#(${v.map((v2) => this.inspect(v2)).join(", ")})`;
    } else if (isList(v)) {
      printed = this.#list(v);
    } else if (v instanceof CustomType) {
      printed = this.#customType(v);
    } else if (v instanceof Dict) {
      printed = this.#dict(v);
    } else if (v instanceof Set) {
      return `//js(Set(${[...v].map((v2) => this.inspect(v2)).join(", ")}))`;
    } else {
      printed = this.#object(v);
    }
    this.#references.delete(v);
    return printed;
  }
  #object(v) {
    const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
    const props = [];
    for (const k of Object.keys(v)) {
      props.push(`${this.inspect(k)}: ${this.inspect(v[k])}`);
    }
    const body = props.length ? " " + props.join(", ") + " " : "";
    const head = name === "Object" ? "" : name + " ";
    return `//js(${head}{${body}})`;
  }
  #dict(map4) {
    let body = "dict.from_list([";
    let first = true;
    body = fold(map4, body, (body2, key, value) => {
      if (!first)
        body2 = body2 + ", ";
      first = false;
      return body2 + "#(" + this.inspect(key) + ", " + this.inspect(value) + ")";
    });
    return body + "])";
  }
  #customType(record) {
    const props = Object.keys(record).map((label) => {
      const value = this.inspect(record[label]);
      return isNaN(parseInt(label)) ? `${label}: ${value}` : value;
    }).join(", ");
    return props ? `${record.constructor.name}(${props})` : record.constructor.name;
  }
  #list(list3) {
    if (List$isEmpty(list3)) {
      return "[]";
    }
    let char_out = 'charlist.from_string("';
    let list_out = "[";
    let current = list3;
    while (List$isNonEmpty(current)) {
      let element = current.head;
      current = current.tail;
      if (list_out !== "[") {
        list_out += ", ";
      }
      list_out += this.inspect(element);
      if (char_out) {
        if (Number.isInteger(element) && element >= 32 && element <= 126) {
          char_out += String.fromCharCode(element);
        } else {
          char_out = null;
        }
      }
    }
    if (char_out) {
      return char_out + '")';
    } else {
      return list_out + "]";
    }
  }
  #string(str) {
    let new_str = '"';
    for (let i = 0;i < str.length; i++) {
      const char = str[i];
      switch (char) {
        case `
`:
          new_str += "\\n";
          break;
        case "\r":
          new_str += "\\r";
          break;
        case "\t":
          new_str += "\\t";
          break;
        case "\f":
          new_str += "\\f";
          break;
        case "\\":
          new_str += "\\\\";
          break;
        case '"':
          new_str += "\\\"";
          break;
        default:
          if (char < " " || char > "~" && char < " ") {
            new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
          } else {
            new_str += char;
          }
      }
    }
    new_str += '"';
    return new_str;
  }
  #utfCodepoint(codepoint2) {
    return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
  }
  #bit_array(bits2) {
    if (bits2.bitSize === 0) {
      return "<<>>";
    }
    let acc = "<<";
    for (let i = 0;i < bits2.byteSize - 1; i++) {
      acc += bits2.byteAt(i).toString();
      acc += ", ";
    }
    if (bits2.byteSize * 8 === bits2.bitSize) {
      acc += bits2.byteAt(bits2.byteSize - 1).toString();
    } else {
      const trailingBitsCount = bits2.bitSize % 8;
      acc += bits2.byteAt(bits2.byteSize - 1) >> 8 - trailingBitsCount;
      acc += `:size(${trailingBitsCount})`;
    }
    acc += ">>";
    return acc;
  }
}
function index2(data, key) {
  if (data instanceof Dict) {
    const result = get(data, key);
    return Result$Ok(result.isOk() ? new Some(result[0]) : new None);
  }
  if (data instanceof WeakMap || data instanceof Map) {
    const token = {};
    const entry = data.get(key, token);
    if (entry === token)
      return Result$Ok(new None);
    return Result$Ok(new Some(entry));
  }
  const key_is_int = Number.isInteger(key);
  if (key_is_int && key >= 0 && key < 8 && isList(data)) {
    let i = 0;
    for (const value of data) {
      if (i === key)
        return Result$Ok(new Some(value));
      i++;
    }
    return Result$Error("Indexable");
  }
  if (key_is_int && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    if (key in data)
      return Result$Ok(new Some(data[key]));
    return Result$Ok(new None);
  }
  return Result$Error(key_is_int ? "Indexable" : "Dict");
}
function list(data, decode, pushPath, index4, emptyList) {
  if (!(isList(data) || Array.isArray(data))) {
    const error = DecodeError$DecodeError("List", classify_dynamic(data), emptyList);
    return [emptyList, arrayToList([error])];
  }
  const decoded = [];
  for (const element of data) {
    const layer = decode(element);
    const [out, errors] = layer;
    if (List$isNonEmpty(errors)) {
      const [_, errors2] = pushPath(layer, index4.toString());
      return [emptyList, errors2];
    }
    decoded.push(out);
    index4++;
  }
  return [arrayToList(decoded), emptyList];
}
function float(data) {
  if (typeof data === "number")
    return Result$Ok(data);
  return Result$Error(0);
}
function int(data) {
  if (Number.isInteger(data))
    return Result$Ok(data);
  return Result$Error(0);
}
function string(data) {
  if (typeof data === "string")
    return Result$Ok(data);
  return Result$Error("");
}
function arrayToList(array) {
  let list3 = List$Empty();
  let i = array.length;
  while (i--) {
    list3 = List$NonEmpty(array[i], list3);
  }
  return list3;
}
function isList(data) {
  return List$isEmpty(data) || List$isNonEmpty(data);
}
function isResult(data) {
  return Result$isOk(data) || Result$isError(data);
}

// build/dev/javascript/gleam_stdlib/gleam/float.mjs
function negate(x) {
  return -1 * x;
}
function round(x) {
  let $ = x >= 0;
  if ($) {
    return round2(x);
  } else {
    return 0 - round2(negate(x));
  }
}
function divide(a, b) {
  if (b === 0) {
    return new Error(undefined);
  } else {
    let b$1 = b;
    return new Ok(divideFloat(a, b$1));
  }
}
function multiply(a, b) {
  return a * b;
}
// build/dev/javascript/gleam_erlang/gleam/erlang/process.mjs
class Normal extends CustomType {
}
var ExitReason$Normal$const = new Normal;
class Killed extends CustomType {
}
var ExitReason$Killed$const = new Killed;
class Anything extends CustomType {
}
var AnythingSelectorTag$Anything$const = new Anything;

class Process extends CustomType {
}
var ProcessMonitorFlag$Process$const = new Process;
class TimerNotFound extends CustomType {
}
var Cancelled$TimerNotFound$const = new TimerNotFound;
class Kill extends CustomType {
}
var KillFlag$Kill$const = new Kill;

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map4(result, fun) {
  if (result instanceof Ok) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    return result;
  }
}
function values2(results) {
  return filter_map(results, (result) => {
    return result;
  });
}
// build/dev/javascript/gleam_otp/gleam/otp/system.mjs
class Running extends CustomType {
}
var Mode$Running$const = new Running;
class Suspended extends CustomType {
}
var Mode$Suspended$const = new Suspended;
class NoDebug extends CustomType {
}
var DebugOption$NoDebug$const = new NoDebug;

// build/dev/javascript/gleam_otp/gleam/otp/actor.mjs
class InitTimeout extends CustomType {
}
var StartError$InitTimeout$const = new InitTimeout;

// build/dev/javascript/gleam_otp/gleam/otp/supervision.mjs
class Permanent extends CustomType {
}
var Restart$Permanent$const = new Permanent;
class Transient extends CustomType {
}
var Restart$Transient$const = new Transient;
class Temporary extends CustomType {
}
var Restart$Temporary$const = new Temporary;
class Supervisor extends CustomType {
}
var ChildType$Supervisor$const = new Supervisor;

// build/dev/javascript/gleam_otp/gleam/otp/factory_supervisor.mjs
class SimpleOneForOne extends CustomType {
}
var Strategy$SimpleOneForOne$const = new SimpleOneForOne;

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/function.mjs
function identity2(x) {
  return x;
}
// build/dev/javascript/gleam_json/gleam/json.mjs
class UnexpectedEndOfInput extends CustomType {
}
var DecodeError$UnexpectedEndOfInput$const = new UnexpectedEndOfInput;
// build/dev/javascript/houdini/houdini.ffi.mjs
function escape(string3) {
  return string3.replaceAll(/[><&"']/g, (replaced) => {
    switch (replaced) {
      case ">":
        return "&gt;";
      case "<":
        return "&lt;";
      case "'":
        return "&#39;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      default:
        return replaced;
    }
  });
}

// build/dev/javascript/lustre/lustre/internals/constants.mjs
var empty_list = List$Empty$const;
var error_nil = /* @__PURE__ */ new Error(undefined);
function singleton_list(item) {
  return prepend(item, empty_list);
}

// build/dev/javascript/lustre/lustre/vdom/vattr.ffi.mjs
var GT = /* @__PURE__ */ Order$Gt();
var LT = /* @__PURE__ */ Order$Lt();
var EQ = /* @__PURE__ */ Order$Eq();
function compare2(a, b) {
  if (a.name === b.name) {
    return EQ;
  } else if (a.name < b.name) {
    return LT;
  } else {
    return GT;
  }
}

// build/dev/javascript/lustre/lustre/vdom/vattr.mjs
class Attribute extends CustomType {
  constructor(kind, name, value) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value;
  }
}
class Property extends CustomType {
  constructor(kind, name, value) {
    super();
    this.kind = kind;
    this.name = name;
    this.value = value;
  }
}
class Event2 extends CustomType {
  constructor(kind, name, handler, include, prevent_default, stop_propagation, debounce, throttle) {
    super();
    this.kind = kind;
    this.name = name;
    this.handler = handler;
    this.include = include;
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.debounce = debounce;
    this.throttle = throttle;
  }
}
class Handler extends CustomType {
  constructor(prevent_default, stop_propagation, message) {
    super();
    this.prevent_default = prevent_default;
    this.stop_propagation = stop_propagation;
    this.message = message;
  }
}
class Never extends CustomType {
  constructor(kind) {
    super();
    this.kind = kind;
  }
}
class Always extends CustomType {
  constructor(kind) {
    super();
    this.kind = kind;
  }
}
var attribute_kind = 0;
var property_kind = 1;
var event_kind = 2;
var never_kind = 0;
var never = /* @__PURE__ */ new Never(never_kind);
var always_kind = 2;
var always = /* @__PURE__ */ new Always(always_kind);
function attribute(name, value) {
  return new Attribute(attribute_kind, name, value);
}
function event(name, handler, include, prevent_default, stop_propagation, debounce, throttle) {
  return new Event2(event_kind, name, handler, include, prevent_default, stop_propagation, debounce, throttle);
}
function merge(loop$attributes, loop$merged) {
  while (true) {
    let attributes = loop$attributes;
    let merged = loop$merged;
    if (attributes instanceof Empty) {
      return merged;
    } else {
      let $ = attributes.head;
      if ($ instanceof Attribute) {
        let $1 = $.name;
        if ($1 === "") {
          let rest = attributes.tail;
          loop$attributes = rest;
          loop$merged = merged;
        } else if ($1 === "class") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute) {
                let $5 = $4.name;
                if ($5 === "class") {
                  let kind = $.kind;
                  let class1 = $2;
                  let rest = $3.tail;
                  let class2 = $4.value;
                  let value = class1 + " " + class2;
                  let attribute$1 = new Attribute(kind, "class", value);
                  loop$attributes = prepend(attribute$1, rest);
                  loop$merged = merged;
                } else {
                  let attribute$1 = $;
                  let rest = $3;
                  loop$attributes = rest;
                  loop$merged = prepend(attribute$1, merged);
                }
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else if ($1 === "style") {
          let $2 = $.value;
          if ($2 === "") {
            let rest = attributes.tail;
            loop$attributes = rest;
            loop$merged = merged;
          } else {
            let $3 = attributes.tail;
            if ($3 instanceof Empty) {
              let attribute$1 = $;
              let rest = $3;
              loop$attributes = rest;
              loop$merged = prepend(attribute$1, merged);
            } else {
              let $4 = $3.head;
              if ($4 instanceof Attribute) {
                let $5 = $4.name;
                if ($5 === "style") {
                  let kind = $.kind;
                  let style1 = $2;
                  let rest = $3.tail;
                  let style2 = $4.value;
                  let value = style1 + ";" + style2;
                  let attribute$1 = new Attribute(kind, "style", value);
                  loop$attributes = prepend(attribute$1, rest);
                  loop$merged = merged;
                } else {
                  let attribute$1 = $;
                  let rest = $3;
                  loop$attributes = rest;
                  loop$merged = prepend(attribute$1, merged);
                }
              } else {
                let attribute$1 = $;
                let rest = $3;
                loop$attributes = rest;
                loop$merged = prepend(attribute$1, merged);
              }
            }
          }
        } else {
          let attribute$1 = $;
          let rest = attributes.tail;
          loop$attributes = rest;
          loop$merged = prepend(attribute$1, merged);
        }
      } else {
        let attribute$1 = $;
        let rest = attributes.tail;
        loop$attributes = rest;
        loop$merged = prepend(attribute$1, merged);
      }
    }
  }
}
function prepare(attributes) {
  if (attributes instanceof Empty) {
    return attributes;
  } else {
    let $ = attributes.tail;
    if ($ instanceof Empty) {
      return attributes;
    } else {
      let _pipe = attributes;
      let _pipe$1 = sort(_pipe, (a, b) => {
        return compare2(b, a);
      });
      return merge(_pipe$1, empty_list);
    }
  }
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute2(name, value) {
  return attribute(name, value);
}
function class$(name) {
  return attribute2("class", name);
}
function href(url) {
  return attribute2("href", url);
}
function width(value) {
  return attribute2("width", to_string(value));
}
function height(value) {
  return attribute2("height", to_string(value));
}
function autocomplete(value) {
  return attribute2("autocomplete", value);
}
function for$(id) {
  return attribute2("for", id);
}
function name(element_name) {
  return attribute2("name", element_name);
}
function value(control_value) {
  return attribute2("value", control_value);
}

// build/dev/javascript/lustre/lustre/effect.mjs
class Effect extends CustomType {
  constructor(synchronous, before_paint, after_paint) {
    super();
    this.synchronous = synchronous;
    this.before_paint = before_paint;
    this.after_paint = after_paint;
  }
}

class Actions extends CustomType {
  constructor(dispatch, emit, select, root, provide, subscribe, unsubscribe) {
    super();
    this.dispatch = dispatch;
    this.emit = emit;
    this.select = select;
    this.root = root;
    this.provide = provide;
    this.subscribe = subscribe;
    this.unsubscribe = unsubscribe;
  }
}
var empty = /* @__PURE__ */ new Effect(empty_list, empty_list, empty_list);
function none() {
  return empty;
}
function batch(effects) {
  return fold2(effects, empty, (acc, eff) => {
    return new Effect(fold2(eff.synchronous, acc.synchronous, prepend2), fold2(eff.before_paint, acc.before_paint, prepend2), fold2(eff.after_paint, acc.after_paint, prepend2));
  });
}
function perform(effect, dispatch, emit, select, root, provide, subscribe, unsubscribe) {
  let actions = new Actions(dispatch, emit, select, root, provide, subscribe, unsubscribe);
  return each(effect.synchronous, (run2) => {
    return run2(actions);
  });
}

// build/dev/javascript/lustre/lustre/internals/mutable_map.ffi.mjs
function empty2() {
  return null;
}
function get2(map5, key) {
  return map5?.get(key);
}
function get_or_compute(map5, key, compute) {
  return map5?.get(key) ?? compute();
}
function has_key(map5, key) {
  return map5 && map5.has(key);
}
function insert2(map5, key, value2) {
  map5 ??= new Map;
  map5.set(key, value2);
  return map5;
}
function remove(map5, key) {
  map5?.delete(key);
  return map5;
}

// build/dev/javascript/lustre/lustre/internals/ref.ffi.mjs
function sameValueZero(x, y) {
  if (typeof x === "number" && typeof y === "number") {
    return x === y || x !== x && y !== y;
  }
  return x === y;
}

// build/dev/javascript/lustre/lustre/internals/ref.mjs
function equal_lists(loop$xs, loop$ys) {
  while (true) {
    let xs = loop$xs;
    let ys = loop$ys;
    if (xs instanceof Empty) {
      if (ys instanceof Empty) {
        return true;
      } else {
        return false;
      }
    } else if (ys instanceof Empty) {
      return false;
    } else {
      let x = xs.head;
      let xs$1 = xs.tail;
      let y = ys.head;
      let ys$1 = ys.tail;
      let $ = sameValueZero(x, y);
      if ($) {
        loop$xs = xs$1;
        loop$ys = ys$1;
      } else {
        return $;
      }
    }
  }
}

// build/dev/javascript/lustre/lustre/vdom/vnode.mjs
class Fragment extends CustomType {
  constructor(kind, key, children, keyed_children) {
    super();
    this.kind = kind;
    this.key = key;
    this.children = children;
    this.keyed_children = keyed_children;
  }
}
class Element extends CustomType {
  constructor(kind, key, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
    super();
    this.kind = kind;
    this.key = key;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.children = children;
    this.keyed_children = keyed_children;
    this.self_closing = self_closing;
    this.void = void$;
  }
}
class Text extends CustomType {
  constructor(kind, key, content) {
    super();
    this.kind = kind;
    this.key = key;
    this.content = content;
  }
}
class UnsafeInnerHtml extends CustomType {
  constructor(kind, key, namespace, tag, attributes, inner_html) {
    super();
    this.kind = kind;
    this.key = key;
    this.namespace = namespace;
    this.tag = tag;
    this.attributes = attributes;
    this.inner_html = inner_html;
  }
}
class Map2 extends CustomType {
  constructor(kind, key, mapper, child) {
    super();
    this.kind = kind;
    this.key = key;
    this.mapper = mapper;
    this.child = child;
  }
}
class Memo extends CustomType {
  constructor(kind, key, dependencies, view) {
    super();
    this.kind = kind;
    this.key = key;
    this.dependencies = dependencies;
    this.view = view;
  }
}
var fragment_kind = 0;
var element_kind = 1;
var text_kind = 2;
var unsafe_inner_html_kind = 3;
var map_kind = 4;
var memo_kind = 5;
function fragment(key, children, keyed_children) {
  return new Fragment(fragment_kind, key, children, keyed_children);
}
function element(key, namespace, tag, attributes, children, keyed_children, self_closing, void$) {
  return new Element(element_kind, key, namespace, tag, prepare(attributes), children, keyed_children, self_closing, void$);
}
function is_void_html_element(tag, namespace) {
  if (namespace === "") {
    if (tag === "area") {
      return true;
    } else if (tag === "base") {
      return true;
    } else if (tag === "br") {
      return true;
    } else if (tag === "col") {
      return true;
    } else if (tag === "embed") {
      return true;
    } else if (tag === "hr") {
      return true;
    } else if (tag === "img") {
      return true;
    } else if (tag === "input") {
      return true;
    } else if (tag === "link") {
      return true;
    } else if (tag === "meta") {
      return true;
    } else if (tag === "param") {
      return true;
    } else if (tag === "source") {
      return true;
    } else if (tag === "track") {
      return true;
    } else if (tag === "wbr") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
function text(key, content) {
  return new Text(text_kind, key, content);
}
function map5(element2, mapper) {
  if (element2 instanceof Map2) {
    let child_mapper = element2.mapper;
    return new Map2(map_kind, element2.key, (handler) => {
      return identity2(mapper)(child_mapper(handler));
    }, identity2(element2.child));
  } else {
    return new Map2(map_kind, element2.key, identity2(mapper), identity2(element2));
  }
}
function memo(key, dependencies, view) {
  return new Memo(memo_kind, key, dependencies, view);
}
function to_keyed(key, node) {
  if (node instanceof Fragment) {
    return new Fragment(node.kind, key, node.children, node.keyed_children);
  } else if (node instanceof Element) {
    return new Element(node.kind, key, node.namespace, node.tag, node.attributes, node.children, node.keyed_children, node.self_closing, node.void);
  } else if (node instanceof Text) {
    return new Text(node.kind, key, node.content);
  } else if (node instanceof UnsafeInnerHtml) {
    return new UnsafeInnerHtml(node.kind, key, node.namespace, node.tag, node.attributes, node.inner_html);
  } else if (node instanceof Map2) {
    let child = node.child;
    return new Map2(node.kind, key, node.mapper, to_keyed(key, child));
  } else {
    let view = node.view;
    return new Memo(node.kind, key, node.dependencies, () => {
      return to_keyed(key, view());
    });
  }
}

// build/dev/javascript/lustre/lustre/element.mjs
class Html extends CustomType {
}
var DocumentType$Html$const = new Html;

class HeadOnly extends CustomType {
}
var DocumentType$HeadOnly$const = new HeadOnly;

class BodyOnly extends CustomType {
}
var DocumentType$BodyOnly$const = new BodyOnly;

class HeadAndBody extends CustomType {
}
var DocumentType$HeadAndBody$const = new HeadAndBody;

class Other extends CustomType {
}
var DocumentType$Other$const = new Other;
function element2(tag, attributes, children) {
  return element("", "", tag, attributes, children, empty2(), false, is_void_html_element(tag, ""));
}
function namespaced(namespace, tag, attributes, children) {
  return element("", namespace, tag, attributes, children, empty2(), false, is_void_html_element(tag, namespace));
}
function text2(content) {
  return text("", content);
}
function none2() {
  return text("", "");
}
function memo2(dependencies, view) {
  return memo("", dependencies, view);
}
function ref(value2) {
  return identity2(value2);
}
function map6(element3, f) {
  return map5(element3, f);
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text3(content) {
  return text2(content);
}
function footer(attrs, children) {
  return element2("footer", attrs, children);
}
function h1(attrs, children) {
  return element2("h1", attrs, children);
}
function main(attrs, children) {
  return element2("main", attrs, children);
}
function div(attrs, children) {
  return element2("div", attrs, children);
}
function a(attrs, children) {
  return element2("a", attrs, children);
}
function svg(attrs, children) {
  return namespaced("http://www.w3.org/2000/svg", "svg", attrs, children);
}
function button(attrs, children) {
  return element2("button", attrs, children);
}
function form(attrs, children) {
  return element2("form", attrs, children);
}
function input(attrs) {
  return element2("input", attrs, empty_list);
}
function label(attrs, children) {
  return element2("label", attrs, children);
}

// build/dev/javascript/lustre/lustre/vdom/patch.mjs
class Patch extends CustomType {
  constructor(index4, path, removed, changes, children) {
    super();
    this.index = index4;
    this.path = path;
    this.removed = removed;
    this.changes = changes;
    this.children = children;
  }
}
class ReplaceText extends CustomType {
  constructor(kind, content) {
    super();
    this.kind = kind;
    this.content = content;
  }
}
class ReplaceInnerHtml extends CustomType {
  constructor(kind, inner_html) {
    super();
    this.kind = kind;
    this.inner_html = inner_html;
  }
}
class Update extends CustomType {
  constructor(kind, added, removed) {
    super();
    this.kind = kind;
    this.added = added;
    this.removed = removed;
  }
}
class Move extends CustomType {
  constructor(kind, key, before) {
    super();
    this.kind = kind;
    this.key = key;
    this.before = before;
  }
}
class Replace extends CustomType {
  constructor(kind, index4, with$) {
    super();
    this.kind = kind;
    this.index = index4;
    this.with = with$;
  }
}
class Remove extends CustomType {
  constructor(kind, index4) {
    super();
    this.kind = kind;
    this.index = index4;
  }
}
class Insert extends CustomType {
  constructor(kind, children, before) {
    super();
    this.kind = kind;
    this.children = children;
    this.before = before;
  }
}
var replace_text_kind = 0;
var replace_inner_html_kind = 1;
var update_kind = 2;
var move_kind = 3;
var remove_kind = 4;
var replace_kind = 5;
var insert_kind = 6;
function new$3(index4, removed, changes, children) {
  return new Patch(index4, empty_list, removed, changes, children);
}
function replace_text(content) {
  return new ReplaceText(replace_text_kind, content);
}
function replace_inner_html(inner_html) {
  return new ReplaceInnerHtml(replace_inner_html_kind, inner_html);
}
function update(added, removed) {
  return new Update(update_kind, added, removed);
}
function move(key, before) {
  return new Move(move_kind, key, before);
}
function remove2(index4) {
  return new Remove(remove_kind, index4);
}
function replace2(index4, with$) {
  return new Replace(replace_kind, index4, with$);
}
function insert3(children, before) {
  return new Insert(insert_kind, children, before);
}
function add_parent(child, index4) {
  return new Patch(index4, prepend(child.index, child.path), child.removed, child.changes, child.children);
}

// build/dev/javascript/lustre/lustre/runtime/transport.mjs
class Mount extends CustomType {
  constructor(kind, open_shadow_root, will_adopt_styles, observed_attributes, observed_properties, requested_contexts, provided_contexts, vdom, memos) {
    super();
    this.kind = kind;
    this.open_shadow_root = open_shadow_root;
    this.will_adopt_styles = will_adopt_styles;
    this.observed_attributes = observed_attributes;
    this.observed_properties = observed_properties;
    this.requested_contexts = requested_contexts;
    this.provided_contexts = provided_contexts;
    this.vdom = vdom;
    this.memos = memos;
  }
}
class Reconcile extends CustomType {
  constructor(kind, patch, memos) {
    super();
    this.kind = kind;
    this.patch = patch;
    this.memos = memos;
  }
}
class Emit extends CustomType {
  constructor(kind, name2, data) {
    super();
    this.kind = kind;
    this.name = name2;
    this.data = data;
  }
}
class Provide extends CustomType {
  constructor(kind, key, value2) {
    super();
    this.kind = kind;
    this.key = key;
    this.value = value2;
  }
}
class Subscribe extends CustomType {
  constructor(kind, key) {
    super();
    this.kind = kind;
    this.key = key;
  }
}
class Unsubscribe extends CustomType {
  constructor(kind, key) {
    super();
    this.kind = kind;
    this.key = key;
  }
}
class Batch extends CustomType {
  constructor(kind, messages) {
    super();
    this.kind = kind;
    this.messages = messages;
  }
}
var ServerMessage$isBatch = (value2) => value2 instanceof Batch;
class AttributeChanged extends CustomType {
  constructor(kind, name2, value2) {
    super();
    this.kind = kind;
    this.name = name2;
    this.value = value2;
  }
}
var ServerMessage$isAttributeChanged = (value2) => value2 instanceof AttributeChanged;
class PropertyChanged extends CustomType {
  constructor(kind, name2, value2) {
    super();
    this.kind = kind;
    this.name = name2;
    this.value = value2;
  }
}
var ServerMessage$isPropertyChanged = (value2) => value2 instanceof PropertyChanged;
class EventFired extends CustomType {
  constructor(kind, path, name2, event2) {
    super();
    this.kind = kind;
    this.path = path;
    this.name = name2;
    this.event = event2;
  }
}
var ServerMessage$isEventFired = (value2) => value2 instanceof EventFired;
class ContextProvided extends CustomType {
  constructor(kind, key, value2) {
    super();
    this.kind = kind;
    this.key = key;
    this.value = value2;
  }
}
var ServerMessage$isContextProvided = (value2) => value2 instanceof ContextProvided;
var mount_kind = 0;
var reconcile_kind = 1;
var emit_kind = 2;
var provide_kind = 3;
var subscribe_kind = 4;
var unsubscribe_kind = 5;
function mount(open_shadow_root, will_adopt_styles, observed_attributes, observed_properties, requested_contexts, provided_contexts, vdom, memos) {
  return new Mount(mount_kind, open_shadow_root, will_adopt_styles, observed_attributes, observed_properties, requested_contexts, provided_contexts, vdom, memos);
}
function reconcile(patch, memos) {
  return new Reconcile(reconcile_kind, patch, memos);
}
function emit(name2, data) {
  return new Emit(emit_kind, name2, data);
}
function provide(key, value2) {
  return new Provide(provide_kind, key, value2);
}
function subscribe(key) {
  return new Subscribe(subscribe_kind, key);
}
function unsubscribe(key) {
  return new Unsubscribe(unsubscribe_kind, key);
}

// build/dev/javascript/lustre/lustre/vdom/path.mjs
class Root extends CustomType {
}
var Path$Root$const = new Root;

class Key extends CustomType {
  constructor(key, parent) {
    super();
    this.key = key;
    this.parent = parent;
  }
}

class Index extends CustomType {
  constructor(index4, parent) {
    super();
    this.index = index4;
    this.parent = parent;
  }
}

class Subtree extends CustomType {
  constructor(parent) {
    super();
    this.parent = parent;
  }
}
var separator_subtree = "\r";
var separator_element = "\t";
var separator_event = `
`;
var root = Path$Root$const;
function finish_to_string(acc) {
  if (acc instanceof Empty) {
    return "";
  } else {
    let segments = acc.tail;
    return concat2(segments);
  }
}
function do_to_string(loop$full, loop$path, loop$acc) {
  while (true) {
    let full = loop$full;
    let path = loop$path;
    let acc = loop$acc;
    if (path instanceof Root) {
      return finish_to_string(acc);
    } else if (path instanceof Key) {
      let key = path.key;
      let parent = path.parent;
      loop$full = full;
      loop$path = parent;
      loop$acc = prepend(separator_element, prepend(key, acc));
    } else if (path instanceof Index) {
      let index4 = path.index;
      let parent = path.parent;
      let acc$1 = prepend(separator_element, prepend(to_string(index4), acc));
      loop$full = full;
      loop$path = parent;
      loop$acc = acc$1;
    } else if (!full) {
      return finish_to_string(acc);
    } else {
      let parent = path.parent;
      if (acc instanceof Empty) {
        loop$full = full;
        loop$path = parent;
        loop$acc = acc;
      } else {
        let acc$1 = acc.tail;
        loop$full = full;
        loop$path = parent;
        loop$acc = prepend(separator_subtree, acc$1);
      }
    }
  }
}
function to_string3(path) {
  return do_to_string(true, path, empty_list);
}
function do_matches(loop$path, loop$candidates) {
  while (true) {
    let path = loop$path;
    let candidates = loop$candidates;
    if (candidates instanceof Empty) {
      return false;
    } else {
      let candidate = candidates.head;
      let rest = candidates.tail;
      let $ = starts_with(path, candidate);
      if ($) {
        return $;
      } else {
        loop$path = path;
        loop$candidates = rest;
      }
    }
  }
}
function matches(path, candidates) {
  if (candidates instanceof Empty) {
    return false;
  } else {
    return do_matches(to_string3(path), candidates);
  }
}
function split_subtree_path(path) {
  return split2(path, separator_subtree);
}
function add2(parent, index4, key) {
  if (key === "") {
    return new Index(index4, parent);
  } else {
    return new Key(key, parent);
  }
}
function subtree(path) {
  return new Subtree(path);
}
function event2(path, event3) {
  return do_to_string(false, path, prepend(separator_event, prepend(event3, empty_list)));
}
function child(path) {
  return do_to_string(false, path, empty_list);
}

// build/dev/javascript/lustre/lustre/vdom/cache.mjs
class Cache extends CustomType {
  constructor(events, vdoms, old_vdoms, dispatched_paths, next_dispatched_paths) {
    super();
    this.events = events;
    this.vdoms = vdoms;
    this.old_vdoms = old_vdoms;
    this.dispatched_paths = dispatched_paths;
    this.next_dispatched_paths = next_dispatched_paths;
  }
}

class Events extends CustomType {
  constructor(handlers, children) {
    super();
    this.handlers = handlers;
    this.children = children;
  }
}

class Child extends CustomType {
  constructor(mapper, events) {
    super();
    this.mapper = mapper;
    this.events = events;
  }
}

class AddedChildren extends CustomType {
  constructor(handlers, children, vdoms) {
    super();
    this.handlers = handlers;
    this.children = children;
    this.vdoms = vdoms;
  }
}

class DecodedEvent extends CustomType {
  constructor(path, handler) {
    super();
    this.path = path;
    this.handler = handler;
  }
}

class DispatchedEvent extends CustomType {
  constructor(path) {
    super();
    this.path = path;
  }
}
function compose_mapper(mapper, child_mapper) {
  return (message) => {
    return mapper(child_mapper(message));
  };
}
function new_events() {
  return new Events(empty2(), empty2());
}
function new$4() {
  return new Cache(new_events(), empty2(), empty2(), empty_list, empty_list);
}
function do_add_event(handlers, path, name2, handler) {
  return insert2(handlers, event2(path, name2), handler);
}
function add_attributes(handlers, path, attributes) {
  return fold2(attributes, handlers, (events, attribute3) => {
    if (attribute3 instanceof Event2) {
      let name2 = attribute3.name;
      let handler = attribute3.handler;
      return do_add_event(events, path, name2, handler);
    } else {
      return events;
    }
  });
}
function do_add_children(loop$handlers, loop$children, loop$vdoms, loop$parent, loop$child_index, loop$nodes) {
  while (true) {
    let handlers = loop$handlers;
    let children = loop$children;
    let vdoms = loop$vdoms;
    let parent = loop$parent;
    let child_index = loop$child_index;
    let nodes = loop$nodes;
    let next = child_index + 1;
    if (nodes instanceof Empty) {
      return new AddedChildren(handlers, children, vdoms);
    } else {
      let $ = nodes.head;
      if ($ instanceof Fragment) {
        let rest = nodes.tail;
        let key = $.key;
        let nodes$1 = $.children;
        let path = add2(parent, child_index, key);
        let $1 = do_add_children(handlers, children, vdoms, path, 0, nodes$1);
        let handlers$1 = $1.handlers;
        let children$1 = $1.children;
        let vdoms$1 = $1.vdoms;
        loop$handlers = handlers$1;
        loop$children = children$1;
        loop$vdoms = vdoms$1;
        loop$parent = parent;
        loop$child_index = next;
        loop$nodes = rest;
      } else if ($ instanceof Element) {
        let rest = nodes.tail;
        let key = $.key;
        let attributes = $.attributes;
        let nodes$1 = $.children;
        let path = add2(parent, child_index, key);
        let handlers$1 = add_attributes(handlers, path, attributes);
        let $1 = do_add_children(handlers$1, children, vdoms, path, 0, nodes$1);
        let handlers$2 = $1.handlers;
        let children$1 = $1.children;
        let vdoms$1 = $1.vdoms;
        loop$handlers = handlers$2;
        loop$children = children$1;
        loop$vdoms = vdoms$1;
        loop$parent = parent;
        loop$child_index = next;
        loop$nodes = rest;
      } else if ($ instanceof Text) {
        let rest = nodes.tail;
        loop$handlers = handlers;
        loop$children = children;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$child_index = next;
        loop$nodes = rest;
      } else if ($ instanceof UnsafeInnerHtml) {
        let rest = nodes.tail;
        let key = $.key;
        let attributes = $.attributes;
        let path = add2(parent, child_index, key);
        let handlers$1 = add_attributes(handlers, path, attributes);
        loop$handlers = handlers$1;
        loop$children = children;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$child_index = next;
        loop$nodes = rest;
      } else if ($ instanceof Map2) {
        let rest = nodes.tail;
        let key = $.key;
        let mapper = $.mapper;
        let child2 = $.child;
        let path = add2(parent, child_index, key);
        let added = do_add_children(empty2(), empty2(), vdoms, subtree(path), 0, singleton_list(child2));
        let vdoms$1 = added.vdoms;
        let child_events = new Events(added.handlers, added.children);
        let child$1 = new Child(mapper, child_events);
        let children$1 = insert2(children, child(path), child$1);
        loop$handlers = handlers;
        loop$children = children$1;
        loop$vdoms = vdoms$1;
        loop$parent = parent;
        loop$child_index = next;
        loop$nodes = rest;
      } else {
        let rest = nodes.tail;
        let view = $.view;
        let child_node = view();
        let vdoms$1 = insert2(vdoms, view, child_node);
        let next$1 = child_index;
        let rest$1 = prepend(child_node, rest);
        loop$handlers = handlers;
        loop$children = children;
        loop$vdoms = vdoms$1;
        loop$parent = parent;
        loop$child_index = next$1;
        loop$nodes = rest$1;
      }
    }
  }
}
function add_children(cache, events, path, child_index, nodes) {
  let vdoms = cache.vdoms;
  let handlers = events.handlers;
  let children = events.children;
  let $ = do_add_children(handlers, children, vdoms, path, child_index, nodes);
  let handlers$1 = $.handlers;
  let children$1 = $.children;
  let vdoms$1 = $.vdoms;
  return [
    new Cache(cache.events, vdoms$1, cache.old_vdoms, cache.dispatched_paths, cache.next_dispatched_paths),
    new Events(handlers$1, children$1)
  ];
}
function add_child(cache, events, parent, index4, child2) {
  let children = singleton_list(child2);
  return add_children(cache, events, parent, index4, children);
}
function from_node(root2) {
  let cache = new$4();
  let $ = add_child(cache, cache.events, root, 0, root2);
  let cache$1 = $[0];
  let events$1 = $[1];
  return new Cache(events$1, cache$1.vdoms, cache$1.old_vdoms, cache$1.dispatched_paths, cache$1.next_dispatched_paths);
}
function tick(cache) {
  return new Cache(cache.events, empty2(), cache.vdoms, cache.next_dispatched_paths, empty_list);
}
function events(cache) {
  return cache.events;
}
function update_events(cache, events2) {
  return new Cache(events2, cache.vdoms, cache.old_vdoms, cache.dispatched_paths, cache.next_dispatched_paths);
}
function memos(cache) {
  return cache.vdoms;
}
function get_old_memo(cache, old, new$5) {
  return get_or_compute(cache.old_vdoms, old, new$5);
}
function keep_memo(cache, old, new$5) {
  let node = get_or_compute(cache.old_vdoms, old, new$5);
  let vdoms = insert2(cache.vdoms, new$5, node);
  return new Cache(cache.events, vdoms, cache.old_vdoms, cache.dispatched_paths, cache.next_dispatched_paths);
}
function add_memo(cache, new$5, node) {
  let vdoms = insert2(cache.vdoms, new$5, node);
  return new Cache(cache.events, vdoms, cache.old_vdoms, cache.dispatched_paths, cache.next_dispatched_paths);
}
function get_subtree(events2, path, old_mapper) {
  let child2 = get_or_compute(events2.children, path, () => {
    return new Child(old_mapper, new_events());
  });
  return child2.events;
}
function update_subtree(parent, path, mapper, events2) {
  let new_child = new Child(mapper, events2);
  let children = insert2(parent.children, path, new_child);
  return new Events(parent.handlers, children);
}
function add_event(events2, path, name2, handler) {
  let handlers = do_add_event(events2.handlers, path, name2, handler);
  return new Events(handlers, events2.children);
}
function do_remove_event(handlers, path, name2) {
  return remove(handlers, event2(path, name2));
}
function remove_event(events2, path, name2) {
  let handlers = do_remove_event(events2.handlers, path, name2);
  return new Events(handlers, events2.children);
}
function remove_attributes(handlers, path, attributes) {
  return fold2(attributes, handlers, (events2, attribute3) => {
    if (attribute3 instanceof Event2) {
      let name2 = attribute3.name;
      return do_remove_event(events2, path, name2);
    } else {
      return events2;
    }
  });
}
function do_remove_children(loop$handlers, loop$children, loop$vdoms, loop$parent, loop$index, loop$nodes) {
  while (true) {
    let handlers = loop$handlers;
    let children = loop$children;
    let vdoms = loop$vdoms;
    let parent = loop$parent;
    let index4 = loop$index;
    let nodes = loop$nodes;
    let next = index4 + 1;
    if (nodes instanceof Empty) {
      return new Events(handlers, children);
    } else {
      let $ = nodes.head;
      if ($ instanceof Fragment) {
        let rest = nodes.tail;
        let key = $.key;
        let nodes$1 = $.children;
        let path = add2(parent, index4, key);
        let $1 = do_remove_children(handlers, children, vdoms, path, 0, nodes$1);
        let handlers$1 = $1.handlers;
        let children$1 = $1.children;
        loop$handlers = handlers$1;
        loop$children = children$1;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next;
        loop$nodes = rest;
      } else if ($ instanceof Element) {
        let rest = nodes.tail;
        let key = $.key;
        let attributes = $.attributes;
        let nodes$1 = $.children;
        let path = add2(parent, index4, key);
        let handlers$1 = remove_attributes(handlers, path, attributes);
        let $1 = do_remove_children(handlers$1, children, vdoms, path, 0, nodes$1);
        let handlers$2 = $1.handlers;
        let children$1 = $1.children;
        loop$handlers = handlers$2;
        loop$children = children$1;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next;
        loop$nodes = rest;
      } else if ($ instanceof Text) {
        let rest = nodes.tail;
        loop$handlers = handlers;
        loop$children = children;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next;
        loop$nodes = rest;
      } else if ($ instanceof UnsafeInnerHtml) {
        let rest = nodes.tail;
        let key = $.key;
        let attributes = $.attributes;
        let path = add2(parent, index4, key);
        let handlers$1 = remove_attributes(handlers, path, attributes);
        loop$handlers = handlers$1;
        loop$children = children;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next;
        loop$nodes = rest;
      } else if ($ instanceof Map2) {
        let rest = nodes.tail;
        let key = $.key;
        let path = add2(parent, index4, key);
        let children$1 = remove(children, child(path));
        loop$handlers = handlers;
        loop$children = children$1;
        loop$vdoms = vdoms;
        loop$parent = parent;
        loop$index = next;
        loop$nodes = rest;
      } else {
        let rest = nodes.tail;
        let view = $.view;
        let $1 = has_key(vdoms, view);
        if ($1) {
          let child2 = get2(vdoms, view);
          let nodes$1 = prepend(child2, rest);
          loop$handlers = handlers;
          loop$children = children;
          loop$vdoms = vdoms;
          loop$parent = parent;
          loop$index = index4;
          loop$nodes = nodes$1;
        } else {
          loop$handlers = handlers;
          loop$children = children;
          loop$vdoms = vdoms;
          loop$parent = parent;
          loop$index = next;
          loop$nodes = rest;
        }
      }
    }
  }
}
function remove_child(cache, events2, parent, child_index, child2) {
  return do_remove_children(events2.handlers, events2.children, cache.old_vdoms, parent, child_index, singleton_list(child2));
}
function replace_child(cache, events2, parent, child_index, prev, next) {
  let events$1 = remove_child(cache, events2, parent, child_index, prev);
  return add_child(cache, events$1, parent, child_index, next);
}
function get_handler(loop$events, loop$path, loop$mapper) {
  while (true) {
    let events2 = loop$events;
    let path = loop$path;
    let mapper = loop$mapper;
    if (path instanceof Empty) {
      return error_nil;
    } else {
      let $ = path.tail;
      if ($ instanceof Empty) {
        let key = path.head;
        let $1 = has_key(events2.handlers, key);
        if ($1) {
          let handler = get2(events2.handlers, key);
          return new Ok(map3(handler, (handler2) => {
            return new Handler(handler2.prevent_default, handler2.stop_propagation, identity2(mapper)(handler2.message));
          }));
        } else {
          return error_nil;
        }
      } else {
        let key = path.head;
        let path$1 = $;
        let $1 = has_key(events2.children, key);
        if ($1) {
          let child2 = get2(events2.children, key);
          let mapper$1 = compose_mapper(mapper, child2.mapper);
          loop$events = child2.events;
          loop$path = path$1;
          loop$mapper = mapper$1;
        } else {
          return error_nil;
        }
      }
    }
  }
}
function decode2(cache, path, name2, event3) {
  let parts = split_subtree_path(path + separator_event + name2);
  let $ = get_handler(cache.events, parts, identity2);
  if ($ instanceof Ok) {
    let handler = $[0];
    let $1 = run(event3, handler);
    if ($1 instanceof Ok) {
      let handler$1 = $1[0];
      return new DecodedEvent(path, handler$1);
    } else {
      return new DispatchedEvent(path);
    }
  } else {
    return new DispatchedEvent(path);
  }
}
function dispatch(cache, event3) {
  let next_dispatched_paths = prepend(event3.path, cache.next_dispatched_paths);
  let cache$1 = new Cache(cache.events, cache.vdoms, cache.old_vdoms, cache.dispatched_paths, next_dispatched_paths);
  if (event3 instanceof DecodedEvent) {
    let handler = event3.handler;
    return [cache$1, new Ok(handler)];
  } else {
    return [cache$1, error_nil];
  }
}
function handle(cache, path, name2, event3) {
  let _pipe = decode2(cache, path, name2, event3);
  return ((_capture) => {
    return dispatch(cache, _capture);
  })(_pipe);
}
function has_dispatched_events(cache, path) {
  return matches(path, cache.dispatched_paths);
}

// build/dev/javascript/lustre/lustre/runtime/server/runtime.mjs
class ClientDispatchedMessage extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
}
var Message$isClientDispatchedMessage = (value2) => value2 instanceof ClientDispatchedMessage;
class ClientRegisteredCallback extends CustomType {
  constructor(callback) {
    super();
    this.callback = callback;
  }
}
var Message$isClientRegisteredCallback = (value2) => value2 instanceof ClientRegisteredCallback;
class ClientDeregisteredCallback extends CustomType {
  constructor(callback) {
    super();
    this.callback = callback;
  }
}
var Message$isClientDeregisteredCallback = (value2) => value2 instanceof ClientDeregisteredCallback;
class EffectDispatchedMessage extends CustomType {
  constructor(message) {
    super();
    this.message = message;
  }
}
var Message$EffectDispatchedMessage = (message) => new EffectDispatchedMessage(message);
var Message$isEffectDispatchedMessage = (value2) => value2 instanceof EffectDispatchedMessage;
class EffectEmitEvent extends CustomType {
  constructor(name2, data) {
    super();
    this.name = name2;
    this.data = data;
  }
}
var Message$EffectEmitEvent = (name2, data) => new EffectEmitEvent(name2, data);
var Message$isEffectEmitEvent = (value2) => value2 instanceof EffectEmitEvent;
class EffectProvidedValue extends CustomType {
  constructor(key, value2) {
    super();
    this.key = key;
    this.value = value2;
  }
}
var Message$EffectProvidedValue = (key, value2) => new EffectProvidedValue(key, value2);
var Message$isEffectProvidedValue = (value2) => value2 instanceof EffectProvidedValue;
class EffectRequestedContextSubscription extends CustomType {
  constructor(key, decoder) {
    super();
    this.key = key;
    this.decoder = decoder;
  }
}
var Message$EffectRequestedContextSubscription = (key, decoder) => new EffectRequestedContextSubscription(key, decoder);
var Message$isEffectRequestedContextSubscription = (value2) => value2 instanceof EffectRequestedContextSubscription;
class EffectRemovedContextSubscription extends CustomType {
  constructor(key) {
    super();
    this.key = key;
  }
}
var Message$EffectRemovedContextSubscription = (key) => new EffectRemovedContextSubscription(key);
var Message$isEffectRemovedContextSubscription = (value2) => value2 instanceof EffectRemovedContextSubscription;
class SystemRequestedShutdown extends CustomType {
}
var Message$SystemRequestedShutdown$const = new SystemRequestedShutdown;
var Message$isSystemRequestedShutdown = (value2) => value2 instanceof SystemRequestedShutdown;

// build/dev/javascript/lustre/lustre/runtime/app.mjs
class App extends CustomType {
  constructor(name2, init, update2, view, config) {
    super();
    this.name = name2;
    this.init = init;
    this.update = update2;
    this.view = view;
    this.config = config;
  }
}
class Config2 extends CustomType {
  constructor(open_shadow_root, adopt_styles, delegates_focus, attributes, properties, contexts, is_form_associated, on_form_autofill, on_form_reset, on_form_restore, on_form_disabled, on_connect, on_adopt, on_disconnect) {
    super();
    this.open_shadow_root = open_shadow_root;
    this.adopt_styles = adopt_styles;
    this.delegates_focus = delegates_focus;
    this.attributes = attributes;
    this.properties = properties;
    this.contexts = contexts;
    this.is_form_associated = is_form_associated;
    this.on_form_autofill = on_form_autofill;
    this.on_form_reset = on_form_reset;
    this.on_form_restore = on_form_restore;
    this.on_form_disabled = on_form_disabled;
    this.on_connect = on_connect;
    this.on_adopt = on_adopt;
    this.on_disconnect = on_disconnect;
  }
}
var default_config = /* @__PURE__ */ new Config2(true, true, false, empty_list, empty_list, empty_list, false, Option$None$const, Option$None$const, Option$None$const, Option$None$const, Option$None$const, Option$None$const, Option$None$const);

// build/dev/javascript/lustre/lustre/internals/equals.ffi.mjs
var isEqual2 = (a2, b) => {
  if (a2 === b) {
    return true;
  }
  if (a2 == null || b == null) {
    return false;
  }
  const type = typeof a2;
  if (type !== typeof b) {
    return false;
  }
  if (type !== "object") {
    return false;
  }
  const ctor = a2.constructor;
  if (ctor !== b.constructor) {
    return false;
  }
  if (Array.isArray(a2)) {
    return areArraysEqual(a2, b);
  }
  return areObjectsEqual(a2, b);
};
var areArraysEqual = (a2, b) => {
  let index4 = a2.length;
  if (index4 !== b.length) {
    return false;
  }
  while (index4--) {
    if (!isEqual2(a2[index4], b[index4])) {
      return false;
    }
  }
  return true;
};
var areObjectsEqual = (a2, b) => {
  const properties = Object.keys(a2);
  let index4 = properties.length;
  if (Object.keys(b).length !== index4) {
    return false;
  }
  while (index4--) {
    const property3 = properties[index4];
    if (!Object.hasOwn(b, property3)) {
      return false;
    }
    if (!isEqual2(a2[property3], b[property3])) {
      return false;
    }
  }
  return true;
};

// build/dev/javascript/lustre/lustre/vdom/diff.mjs
class Diff extends CustomType {
  constructor(patch, cache) {
    super();
    this.patch = patch;
    this.cache = cache;
  }
}
class PartialDiff extends CustomType {
  constructor(patch, cache, events2) {
    super();
    this.patch = patch;
    this.cache = cache;
    this.events = events2;
  }
}

class AttributeChange extends CustomType {
  constructor(added, removed, events2) {
    super();
    this.added = added;
    this.removed = removed;
    this.events = events2;
  }
}
function diff_attributes(loop$controlled, loop$path, loop$events, loop$old, loop$new, loop$added, loop$removed) {
  while (true) {
    let controlled = loop$controlled;
    let path = loop$path;
    let events2 = loop$events;
    let old = loop$old;
    let new$5 = loop$new;
    let added = loop$added;
    let removed = loop$removed;
    if (old instanceof Empty) {
      if (new$5 instanceof Empty) {
        return new AttributeChange(added, removed, events2);
      } else {
        let $ = new$5.head;
        if ($ instanceof Event2) {
          let next = $;
          let new$1 = new$5.tail;
          let name2 = $.name;
          let handler = $.handler;
          let events$1 = add_event(events2, path, name2, handler);
          let added$1 = prepend(next, added);
          loop$controlled = controlled;
          loop$path = path;
          loop$events = events$1;
          loop$old = old;
          loop$new = new$1;
          loop$added = added$1;
          loop$removed = removed;
        } else {
          let next = $;
          let new$1 = new$5.tail;
          let added$1 = prepend(next, added);
          loop$controlled = controlled;
          loop$path = path;
          loop$events = events2;
          loop$old = old;
          loop$new = new$1;
          loop$added = added$1;
          loop$removed = removed;
        }
      }
    } else if (new$5 instanceof Empty) {
      let $ = old.head;
      if ($ instanceof Event2) {
        let prev = $;
        let old$1 = old.tail;
        let name2 = $.name;
        let events$1 = remove_event(events2, path, name2);
        let removed$1 = prepend(prev, removed);
        loop$controlled = controlled;
        loop$path = path;
        loop$events = events$1;
        loop$old = old$1;
        loop$new = new$5;
        loop$added = added;
        loop$removed = removed$1;
      } else {
        let prev = $;
        let old$1 = old.tail;
        let removed$1 = prepend(prev, removed);
        loop$controlled = controlled;
        loop$path = path;
        loop$events = events2;
        loop$old = old$1;
        loop$new = new$5;
        loop$added = added;
        loop$removed = removed$1;
      }
    } else {
      let prev = old.head;
      let remaining_old = old.tail;
      let next = new$5.head;
      let remaining_new = new$5.tail;
      let $ = compare2(prev, next);
      if ($ instanceof Lt) {
        if (prev instanceof Event2) {
          let name2 = prev.name;
          loop$controlled = controlled;
          loop$path = path;
          loop$events = remove_event(events2, path, name2);
          loop$old = remaining_old;
          loop$new = new$5;
          loop$added = added;
          loop$removed = prepend(prev, removed);
        } else {
          loop$controlled = controlled;
          loop$path = path;
          loop$events = events2;
          loop$old = remaining_old;
          loop$new = new$5;
          loop$added = added;
          loop$removed = prepend(prev, removed);
        }
      } else if ($ instanceof Eq) {
        if (prev instanceof Attribute) {
          if (next instanceof Attribute) {
            let _block;
            let $1 = next.name;
            if ($1 === "value") {
              _block = controlled || prev.value !== next.value;
            } else if ($1 === "checked") {
              _block = controlled || prev.value !== next.value;
            } else if ($1 === "selected") {
              _block = controlled || prev.value !== next.value;
            } else {
              _block = prev.value !== next.value;
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$events = events2;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (next instanceof Event2) {
            let name2 = next.name;
            let handler = next.handler;
            loop$controlled = controlled;
            loop$path = path;
            loop$events = add_event(events2, path, name2, handler);
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = prepend(next, added);
            loop$removed = prepend(prev, removed);
          } else {
            loop$controlled = controlled;
            loop$path = path;
            loop$events = events2;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = prepend(next, added);
            loop$removed = prepend(prev, removed);
          }
        } else if (prev instanceof Property) {
          if (next instanceof Property) {
            let _block;
            let $1 = next.name;
            if ($1 === "scrollLeft") {
              _block = true;
            } else if ($1 === "scrollRight") {
              _block = true;
            } else if ($1 === "value") {
              _block = controlled || !isEqual2(prev.value, next.value);
            } else if ($1 === "checked") {
              _block = controlled || !isEqual2(prev.value, next.value);
            } else if ($1 === "selected") {
              _block = controlled || !isEqual2(prev.value, next.value);
            } else {
              _block = !isEqual2(prev.value, next.value);
            }
            let has_changes = _block;
            let _block$1;
            if (has_changes) {
              _block$1 = prepend(next, added);
            } else {
              _block$1 = added;
            }
            let added$1 = _block$1;
            loop$controlled = controlled;
            loop$path = path;
            loop$events = events2;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = added$1;
            loop$removed = removed;
          } else if (next instanceof Event2) {
            let name2 = next.name;
            let handler = next.handler;
            loop$controlled = controlled;
            loop$path = path;
            loop$events = add_event(events2, path, name2, handler);
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = prepend(next, added);
            loop$removed = prepend(prev, removed);
          } else {
            loop$controlled = controlled;
            loop$path = path;
            loop$events = events2;
            loop$old = remaining_old;
            loop$new = remaining_new;
            loop$added = prepend(next, added);
            loop$removed = prepend(prev, removed);
          }
        } else if (next instanceof Event2) {
          let name2 = next.name;
          let handler = next.handler;
          let has_changes = prev.prevent_default.kind !== next.prevent_default.kind || prev.stop_propagation.kind !== next.stop_propagation.kind || prev.debounce !== next.debounce || prev.throttle !== next.throttle;
          let _block;
          if (has_changes) {
            _block = prepend(next, added);
          } else {
            _block = added;
          }
          let added$1 = _block;
          loop$controlled = controlled;
          loop$path = path;
          loop$events = add_event(events2, path, name2, handler);
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = added$1;
          loop$removed = removed;
        } else {
          let name2 = prev.name;
          loop$controlled = controlled;
          loop$path = path;
          loop$events = remove_event(events2, path, name2);
          loop$old = remaining_old;
          loop$new = remaining_new;
          loop$added = prepend(next, added);
          loop$removed = prepend(prev, removed);
        }
      } else if (next instanceof Event2) {
        let name2 = next.name;
        let handler = next.handler;
        loop$controlled = controlled;
        loop$path = path;
        loop$events = add_event(events2, path, name2, handler);
        loop$old = old;
        loop$new = remaining_new;
        loop$added = prepend(next, added);
        loop$removed = removed;
      } else {
        loop$controlled = controlled;
        loop$path = path;
        loop$events = events2;
        loop$old = old;
        loop$new = remaining_new;
        loop$added = prepend(next, added);
        loop$removed = removed;
      }
    }
  }
}
function is_controlled(cache, namespace, tag, path) {
  if (tag === "input" && namespace === "") {
    return has_dispatched_events(cache, path);
  } else if (tag === "select" && namespace === "") {
    return has_dispatched_events(cache, path);
  } else if (tag === "textarea" && namespace === "") {
    return has_dispatched_events(cache, path);
  } else {
    return false;
  }
}
function do_diff(loop$old, loop$old_keyed, loop$new, loop$new_keyed, loop$moved, loop$moved_offset, loop$removed, loop$node_index, loop$patch_index, loop$changes, loop$children, loop$path, loop$cache, loop$events) {
  while (true) {
    let old = loop$old;
    let old_keyed = loop$old_keyed;
    let new$5 = loop$new;
    let new_keyed = loop$new_keyed;
    let moved = loop$moved;
    let moved_offset = loop$moved_offset;
    let removed = loop$removed;
    let node_index = loop$node_index;
    let patch_index = loop$patch_index;
    let changes = loop$changes;
    let children = loop$children;
    let path = loop$path;
    let cache = loop$cache;
    let events2 = loop$events;
    if (old instanceof Empty) {
      if (new$5 instanceof Empty) {
        let _block;
        let $ = is_browser();
        if (changes instanceof Empty) {
          if (children instanceof Empty) {
            _block = new$3(patch_index, removed, changes, children);
          } else if (!$) {
            let $1 = children.tail;
            if ($1 instanceof Empty && removed === 0) {
              let child2 = children.head;
              _block = add_parent(child2, patch_index);
            } else {
              _block = new$3(patch_index, removed, changes, children);
            }
          } else {
            _block = new$3(patch_index, removed, changes, children);
          }
        } else {
          _block = new$3(patch_index, removed, changes, children);
        }
        let patch = _block;
        return new PartialDiff(patch, cache, events2);
      } else {
        let $ = add_children(cache, events2, path, node_index, new$5);
        let cache$1 = $[0];
        let events$1 = $[1];
        let insert4 = insert3(new$5, node_index - moved_offset);
        let changes$1 = prepend(insert4, changes);
        let patch = new$3(patch_index, removed, changes$1, children);
        return new PartialDiff(patch, cache$1, events$1);
      }
    } else if (new$5 instanceof Empty) {
      let prev = old.head;
      let old$1 = old.tail;
      let $ = prev.key === "" || !has_key(moved, prev.key);
      if ($) {
        let events$1 = remove_child(cache, events2, path, node_index, prev);
        loop$old = old$1;
        loop$old_keyed = old_keyed;
        loop$new = new$5;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset;
        loop$removed = removed + 1;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$changes = changes;
        loop$children = children;
        loop$path = path;
        loop$cache = cache;
        loop$events = events$1;
      } else {
        loop$old = old$1;
        loop$old_keyed = old_keyed;
        loop$new = new$5;
        loop$new_keyed = new_keyed;
        loop$moved = moved;
        loop$moved_offset = moved_offset;
        loop$removed = removed;
        loop$node_index = node_index;
        loop$patch_index = patch_index;
        loop$changes = changes;
        loop$children = children;
        loop$path = path;
        loop$cache = cache;
        loop$events = events2;
      }
    } else {
      let prev = old.head;
      let next = new$5.head;
      if (prev.key !== next.key) {
        let old_remaining = old.tail;
        let new_remaining = new$5.tail;
        let next_did_exist = has_key(old_keyed, next.key);
        let prev_does_exist = has_key(new_keyed, prev.key);
        if (prev_does_exist) {
          if (next_did_exist) {
            let $ = has_key(moved, prev.key);
            if ($) {
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new$5;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset - 1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children;
              loop$path = path;
              loop$cache = cache;
              loop$events = events2;
            } else {
              let match = get2(old_keyed, next.key);
              let before = node_index - moved_offset;
              let changes$1 = prepend(move(next.key, before), changes);
              let moved$1 = insert2(moved, next.key, undefined);
              loop$old = prepend(match, old);
              loop$old_keyed = old_keyed;
              loop$new = new$5;
              loop$new_keyed = new_keyed;
              loop$moved = moved$1;
              loop$moved_offset = moved_offset + 1;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$changes = changes$1;
              loop$children = children;
              loop$path = path;
              loop$cache = cache;
              loop$events = events2;
            }
          } else {
            let before = node_index - moved_offset;
            let $ = add_child(cache, events2, path, node_index, next);
            let cache$1 = $[0];
            let events$1 = $[1];
            let insert4 = insert3(singleton_list(next), before);
            let changes$1 = prepend(insert4, changes);
            loop$old = old;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset + 1;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = changes$1;
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if (next_did_exist) {
          let index4 = node_index - moved_offset;
          let changes$1 = prepend(remove2(index4), changes);
          let events$1 = remove_child(cache, events2, path, node_index, prev);
          loop$old = old_remaining;
          loop$old_keyed = old_keyed;
          loop$new = new$5;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset - 1;
          loop$removed = removed;
          loop$node_index = node_index;
          loop$patch_index = patch_index;
          loop$changes = changes$1;
          loop$children = children;
          loop$path = path;
          loop$cache = cache;
          loop$events = events$1;
        } else {
          let change = replace2(node_index - moved_offset, next);
          let $ = replace_child(cache, events2, path, node_index, prev, next);
          let cache$1 = $[0];
          let events$1 = $[1];
          loop$old = old_remaining;
          loop$old_keyed = old_keyed;
          loop$new = new_remaining;
          loop$new_keyed = new_keyed;
          loop$moved = moved;
          loop$moved_offset = moved_offset;
          loop$removed = removed;
          loop$node_index = node_index + 1;
          loop$patch_index = patch_index;
          loop$changes = prepend(change, changes);
          loop$children = children;
          loop$path = path;
          loop$cache = cache$1;
          loop$events = events$1;
        }
      } else {
        let $ = old.head;
        if ($ instanceof Fragment) {
          let $1 = new$5.head;
          if ($1 instanceof Fragment) {
            let prev2 = $;
            let old$1 = old.tail;
            let next2 = $1;
            let new$1 = new$5.tail;
            let $2 = do_diff(prev2.children, prev2.keyed_children, next2.children, next2.keyed_children, empty2(), 0, 0, 0, node_index, empty_list, empty_list, add2(path, node_index, next2.key), cache, events2);
            let patch = $2.patch;
            let cache$1 = $2.cache;
            let events$1 = $2.events;
            let _block;
            let $3 = patch.changes;
            if ($3 instanceof Empty) {
              let $4 = patch.children;
              if ($4 instanceof Empty) {
                let $5 = patch.removed;
                if ($5 === 0) {
                  _block = children;
                } else {
                  _block = prepend(patch, children);
                }
              } else {
                _block = prepend(patch, children);
              }
            } else {
              _block = prepend(patch, children);
            }
            let children$1 = _block;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = changes;
            loop$children = children$1;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          } else {
            let prev2 = $;
            let old_remaining = old.tail;
            let next2 = $1;
            let new_remaining = new$5.tail;
            let change = replace2(node_index - moved_offset, next2);
            let $2 = replace_child(cache, events2, path, node_index, prev2, next2);
            let cache$1 = $2[0];
            let events$1 = $2[1];
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if ($ instanceof Element) {
          let $1 = new$5.head;
          if ($1 instanceof Element) {
            let prev2 = $;
            let next2 = $1;
            if (prev2.namespace === next2.namespace && prev2.tag === next2.tag) {
              let old$1 = old.tail;
              let new$1 = new$5.tail;
              let child_path = add2(path, node_index, next2.key);
              let controlled = is_controlled(cache, next2.namespace, next2.tag, child_path);
              let $2 = diff_attributes(controlled, child_path, events2, prev2.attributes, next2.attributes, empty_list, empty_list);
              let added_attrs = $2.added;
              let removed_attrs = $2.removed;
              let events$1 = $2.events;
              let _block;
              if (added_attrs instanceof Empty && removed_attrs instanceof Empty) {
                _block = empty_list;
              } else {
                _block = singleton_list(update(added_attrs, removed_attrs));
              }
              let initial_child_changes = _block;
              let $3 = do_diff(prev2.children, prev2.keyed_children, next2.children, next2.keyed_children, empty2(), 0, 0, 0, node_index, initial_child_changes, empty_list, child_path, cache, events$1);
              let patch = $3.patch;
              let cache$1 = $3.cache;
              let events$2 = $3.events;
              let _block$1;
              let $4 = patch.changes;
              if ($4 instanceof Empty) {
                let $5 = patch.children;
                if ($5 instanceof Empty) {
                  let $6 = patch.removed;
                  if ($6 === 0) {
                    _block$1 = children;
                  } else {
                    _block$1 = prepend(patch, children);
                  }
                } else {
                  _block$1 = prepend(patch, children);
                }
              } else {
                _block$1 = prepend(patch, children);
              }
              let children$1 = _block$1;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children$1;
              loop$path = path;
              loop$cache = cache$1;
              loop$events = events$2;
            } else {
              let prev3 = $;
              let old_remaining = old.tail;
              let next3 = $1;
              let new_remaining = new$5.tail;
              let change = replace2(node_index - moved_offset, next3);
              let $2 = replace_child(cache, events2, path, node_index, prev3, next3);
              let cache$1 = $2[0];
              let events$1 = $2[1];
              loop$old = old_remaining;
              loop$old_keyed = old_keyed;
              loop$new = new_remaining;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = prepend(change, changes);
              loop$children = children;
              loop$path = path;
              loop$cache = cache$1;
              loop$events = events$1;
            }
          } else {
            let prev2 = $;
            let old_remaining = old.tail;
            let next2 = $1;
            let new_remaining = new$5.tail;
            let change = replace2(node_index - moved_offset, next2);
            let $2 = replace_child(cache, events2, path, node_index, prev2, next2);
            let cache$1 = $2[0];
            let events$1 = $2[1];
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if ($ instanceof Text) {
          let $1 = new$5.head;
          if ($1 instanceof Text) {
            let prev2 = $;
            let next2 = $1;
            if (prev2.content === next2.content) {
              let old$1 = old.tail;
              let new$1 = new$5.tail;
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children;
              loop$path = path;
              loop$cache = cache;
              loop$events = events2;
            } else {
              let old$1 = old.tail;
              let next3 = $1;
              let new$1 = new$5.tail;
              let child2 = new$3(node_index, 0, singleton_list(replace_text(next3.content)), empty_list);
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = prepend(child2, children);
              loop$path = path;
              loop$cache = cache;
              loop$events = events2;
            }
          } else {
            let prev2 = $;
            let old_remaining = old.tail;
            let next2 = $1;
            let new_remaining = new$5.tail;
            let change = replace2(node_index - moved_offset, next2);
            let $2 = replace_child(cache, events2, path, node_index, prev2, next2);
            let cache$1 = $2[0];
            let events$1 = $2[1];
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if ($ instanceof UnsafeInnerHtml) {
          let $1 = new$5.head;
          if ($1 instanceof UnsafeInnerHtml) {
            let prev2 = $;
            let old$1 = old.tail;
            let next2 = $1;
            let new$1 = new$5.tail;
            let child_path = add2(path, node_index, next2.key);
            let $2 = diff_attributes(false, child_path, events2, prev2.attributes, next2.attributes, empty_list, empty_list);
            let added_attrs = $2.added;
            let removed_attrs = $2.removed;
            let events$1 = $2.events;
            let _block;
            if (added_attrs instanceof Empty && removed_attrs instanceof Empty) {
              _block = empty_list;
            } else {
              _block = singleton_list(update(added_attrs, removed_attrs));
            }
            let child_changes = _block;
            let _block$1;
            let $3 = prev2.inner_html === next2.inner_html;
            if ($3) {
              _block$1 = child_changes;
            } else {
              _block$1 = prepend(replace_inner_html(next2.inner_html), child_changes);
            }
            let child_changes$1 = _block$1;
            let _block$2;
            if (child_changes$1 instanceof Empty) {
              _block$2 = children;
            } else {
              _block$2 = prepend(new$3(node_index, 0, child_changes$1, empty_list), children);
            }
            let children$1 = _block$2;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = changes;
            loop$children = children$1;
            loop$path = path;
            loop$cache = cache;
            loop$events = events$1;
          } else {
            let prev2 = $;
            let old_remaining = old.tail;
            let next2 = $1;
            let new_remaining = new$5.tail;
            let change = replace2(node_index - moved_offset, next2);
            let $2 = replace_child(cache, events2, path, node_index, prev2, next2);
            let cache$1 = $2[0];
            let events$1 = $2[1];
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else if ($ instanceof Map2) {
          let $1 = new$5.head;
          if ($1 instanceof Map2) {
            let prev2 = $;
            let old$1 = old.tail;
            let next2 = $1;
            let new$1 = new$5.tail;
            let child_path = add2(path, node_index, next2.key);
            let child_key = child(child_path);
            let $2 = do_diff(singleton_list(prev2.child), empty2(), singleton_list(next2.child), empty2(), empty2(), 0, 0, 0, node_index, empty_list, empty_list, subtree(child_path), cache, get_subtree(events2, child_key, prev2.mapper));
            let patch = $2.patch;
            let cache$1 = $2.cache;
            let child_events = $2.events;
            let events$1 = update_subtree(events2, child_key, next2.mapper, child_events);
            let _block;
            let $3 = patch.changes;
            if ($3 instanceof Empty) {
              let $4 = patch.children;
              if ($4 instanceof Empty) {
                let $5 = patch.removed;
                if ($5 === 0) {
                  _block = children;
                } else {
                  _block = prepend(patch, children);
                }
              } else {
                _block = prepend(patch, children);
              }
            } else {
              _block = prepend(patch, children);
            }
            let children$1 = _block;
            loop$old = old$1;
            loop$old_keyed = old_keyed;
            loop$new = new$1;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = changes;
            loop$children = children$1;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          } else {
            let prev2 = $;
            let old_remaining = old.tail;
            let next2 = $1;
            let new_remaining = new$5.tail;
            let change = replace2(node_index - moved_offset, next2);
            let $2 = replace_child(cache, events2, path, node_index, prev2, next2);
            let cache$1 = $2[0];
            let events$1 = $2[1];
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        } else {
          let $1 = new$5.head;
          if ($1 instanceof Memo) {
            let prev2 = $;
            let old$1 = old.tail;
            let next2 = $1;
            let new$1 = new$5.tail;
            let $2 = equal_lists(prev2.dependencies, next2.dependencies);
            if ($2) {
              let cache$1 = keep_memo(cache, prev2.view, next2.view);
              loop$old = old$1;
              loop$old_keyed = old_keyed;
              loop$new = new$1;
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index + 1;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children;
              loop$path = path;
              loop$cache = cache$1;
              loop$events = events2;
            } else {
              let prev_node = get_old_memo(cache, prev2.view, prev2.view);
              let next_node = next2.view();
              let cache$1 = add_memo(cache, next2.view, next_node);
              loop$old = prepend(prev_node, old$1);
              loop$old_keyed = old_keyed;
              loop$new = prepend(next_node, new$1);
              loop$new_keyed = new_keyed;
              loop$moved = moved;
              loop$moved_offset = moved_offset;
              loop$removed = removed;
              loop$node_index = node_index;
              loop$patch_index = patch_index;
              loop$changes = changes;
              loop$children = children;
              loop$path = path;
              loop$cache = cache$1;
              loop$events = events2;
            }
          } else {
            let prev2 = $;
            let old_remaining = old.tail;
            let next2 = $1;
            let new_remaining = new$5.tail;
            let change = replace2(node_index - moved_offset, next2);
            let $2 = replace_child(cache, events2, path, node_index, prev2, next2);
            let cache$1 = $2[0];
            let events$1 = $2[1];
            loop$old = old_remaining;
            loop$old_keyed = old_keyed;
            loop$new = new_remaining;
            loop$new_keyed = new_keyed;
            loop$moved = moved;
            loop$moved_offset = moved_offset;
            loop$removed = removed;
            loop$node_index = node_index + 1;
            loop$patch_index = patch_index;
            loop$changes = prepend(change, changes);
            loop$children = children;
            loop$path = path;
            loop$cache = cache$1;
            loop$events = events$1;
          }
        }
      }
    }
  }
}
function diff(cache, old, new$5) {
  let cache$1 = tick(cache);
  let $ = do_diff(singleton_list(old), empty2(), singleton_list(new$5), empty2(), empty2(), 0, 0, 0, 0, empty_list, empty_list, root, cache$1, events(cache$1));
  let patch = $.patch;
  let cache$2 = $.cache;
  let events2 = $.events;
  return new Diff(patch, update_events(cache$2, events2));
}

// build/dev/javascript/lustre/lustre/internals/list.ffi.mjs
var toList2 = (arr) => arr.reduceRight((xs, x) => List$NonEmpty(x, xs), empty_list);
var iterate = (list4, callback) => {
  if (Array.isArray(list4)) {
    for (let i = 0;i < list4.length; i++) {
      callback(list4[i]);
    }
  } else if (list4) {
    for (list4;List$NonEmpty$rest(list4); list4 = List$NonEmpty$rest(list4)) {
      callback(List$NonEmpty$first(list4));
    }
  }
};
var append4 = (a2, b) => {
  if (!List$NonEmpty$rest(a2)) {
    return b;
  } else if (!List$NonEmpty$rest(b)) {
    return a2;
  } else {
    return append(a2, b);
  }
};

// build/dev/javascript/lustre/lustre/internals/constants.ffi.mjs
var NAMESPACE_HTML = "http://www.w3.org/1999/xhtml";
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var COMMENT_NODE = 8;
var SUPPORTS_MOVE_BEFORE = !!globalThis.HTMLElement?.prototype?.moveBefore;

// build/dev/javascript/lustre/lustre/vdom/reconciler.ffi.mjs
var setTimeout = globalThis.setTimeout;
var clearTimeout = globalThis.clearTimeout;
var createElementNS = (ns, name2) => globalThis.document.createElementNS(ns, name2);
var createTextNode = (data) => globalThis.document.createTextNode(data);
var createComment = (data) => globalThis.document.createComment(data);
var createDocumentFragment = () => globalThis.document.createDocumentFragment();
var insertBefore = (parent, node, reference) => parent.insertBefore(node, reference);
var moveBefore = SUPPORTS_MOVE_BEFORE ? (parent, node, reference) => parent.moveBefore(node, reference) : insertBefore;
var removeChild = (parent, child2) => parent.removeChild(child2);
var getAttribute = (node, name2) => node.getAttribute(name2);
var setAttribute = (node, name2, value2) => node.setAttribute(name2, value2);
var removeAttribute = (node, name2) => node.removeAttribute(name2);
var addEventListener = (node, name2, handler, options) => node.addEventListener(name2, handler, options);
var removeEventListener = (node, name2, handler) => node.removeEventListener(name2, handler);
var setInnerHtml = (node, innerHtml) => node.innerHTML = innerHtml;
var setData = (node, data) => node.data = data;
var meta = Symbol("lustre");

class MetadataNode {
  constructor(kind, parent, node, key) {
    this.kind = kind;
    this.key = key;
    this.parent = parent;
    this.children = [];
    this.node = node;
    this.endNode = null;
    this.handlers = new Map;
    this.throttles = new Map;
    this.debouncers = new Map;
  }
  get isVirtual() {
    return this.kind === fragment_kind || this.kind === map_kind;
  }
  get parentNode() {
    return this.isVirtual ? this.node.parentNode : this.node;
  }
}
var insertMetadataChild = (kind, parent, node, index4, key) => {
  const child2 = new MetadataNode(kind, parent, node, key);
  node[meta] = child2;
  parent?.children.splice(index4, 0, child2);
  return child2;
};
var getPath = (node) => {
  let path = "";
  for (let current = node[meta];current.parent; current = current.parent) {
    const separator = current.parent && current.parent.kind === map_kind ? separator_subtree : separator_element;
    if (current.key) {
      path = `${separator}${current.key}${path}`;
    } else {
      const index4 = current.parent.children.indexOf(current);
      path = `${separator}${index4}${path}`;
    }
  }
  return path.slice(1);
};

class Reconciler {
  #root = null;
  #decodeEvent;
  #dispatch;
  #debug = false;
  constructor(root2, decodeEvent, dispatch2, { debug = false } = {}) {
    this.#root = root2;
    this.#decodeEvent = decodeEvent;
    this.#dispatch = dispatch2;
    this.#debug = debug;
  }
  mount(vdom) {
    insertMetadataChild(element_kind, null, this.#root, 0, null);
    this.#insertChild(this.#root, null, this.#root[meta], 0, vdom);
  }
  push(patch, memos2 = null) {
    this.#memos = memos2;
    this.#stack.push({ node: this.#root[meta], patch });
    this.#reconcile();
  }
  #memos;
  #stack = [];
  #reconcile() {
    const stack = this.#stack;
    while (stack.length) {
      let { node, patch } = stack.pop();
      const { path, changes, removed, children: childPatches } = patch;
      iterate(path, (index4) => {
        node = node.children[index4];
      });
      const { children: childNodes } = node;
      iterate(changes, (change) => this.#patch(node, change));
      if (removed) {
        this.#removeChildren(node, childNodes.length - removed, removed);
      }
      iterate(childPatches, (childPatch) => {
        const child2 = childNodes[childPatch.index | 0];
        this.#stack.push({ node: child2, patch: childPatch });
      });
    }
  }
  #patch(node, change) {
    switch (change.kind) {
      case replace_text_kind:
        this.#replaceText(node, change);
        break;
      case replace_inner_html_kind:
        this.#replaceInnerHtml(node, change);
        break;
      case update_kind:
        this.#update(node, change);
        break;
      case move_kind:
        this.#move(node, change);
        break;
      case remove_kind:
        this.#remove(node, change);
        break;
      case replace_kind:
        this.#replace(node, change);
        break;
      case insert_kind:
        this.#insert(node, change);
        break;
    }
  }
  #insert(parent, { children, before }) {
    const fragment2 = createDocumentFragment();
    const beforeEl = this.#getReference(parent, before);
    this.#insertChildren(fragment2, null, parent, before | 0, children);
    insertBefore(parent.parentNode, fragment2, beforeEl);
  }
  #replace(parent, { index: index4, with: child2 }) {
    this.#removeChildren(parent, index4 | 0, 1);
    const beforeEl = this.#getReference(parent, index4);
    this.#insertChild(parent.parentNode, beforeEl, parent, index4 | 0, child2);
  }
  #getReference(node, index4) {
    index4 = index4 | 0;
    const { children } = node;
    const childCount = children.length;
    if (index4 < childCount)
      return children[index4].node;
    if (node.endNode)
      return node.endNode;
    if (!node.isVirtual)
      return null;
    while (node.isVirtual && node.children.length) {
      if (node.endNode)
        return node.endNode.nextSibling;
      node = node.children[node.children.length - 1];
    }
    return node.node.nextSibling;
  }
  #move(parent, { key, before }) {
    before = before | 0;
    const { children, parentNode } = parent;
    const beforeEl = children[before].node;
    let prev = children[before];
    for (let i = before + 1;i < children.length; ++i) {
      const next = children[i];
      children[i] = prev;
      prev = next;
      if (next.key === key) {
        children[before] = next;
        break;
      }
    }
    this.#moveChild(parentNode, prev, beforeEl);
  }
  #moveChildren(domParent, children, beforeEl) {
    for (let i = 0;i < children.length; ++i) {
      this.#moveChild(domParent, children[i], beforeEl);
    }
  }
  #moveChild(domParent, child2, beforeEl) {
    moveBefore(domParent, child2.node, beforeEl);
    if (child2.isVirtual) {
      this.#moveChildren(domParent, child2.children, beforeEl);
    }
    if (child2.endNode) {
      moveBefore(domParent, child2.endNode, beforeEl);
    }
  }
  #remove(parent, { index: index4 }) {
    this.#removeChildren(parent, index4, 1);
  }
  #removeChildren(parent, index4, count2) {
    const { children, parentNode } = parent;
    const deleted = children.splice(index4, count2);
    for (let i = 0;i < deleted.length; ++i) {
      const child2 = deleted[i];
      const { node, endNode, isVirtual, children: nestedChildren } = child2;
      removeChild(parentNode, node);
      if (endNode) {
        removeChild(parentNode, endNode);
      }
      this.#removeDebouncers(child2);
      if (isVirtual) {
        deleted.push(...nestedChildren);
      }
    }
  }
  #removeDebouncers(node) {
    const { debouncers, children } = node;
    for (const { timeout } of debouncers.values()) {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
    debouncers.clear();
    iterate(children, (child2) => this.#removeDebouncers(child2));
  }
  #update({ node, handlers, throttles, debouncers }, { added, removed }) {
    iterate(removed, ({ name: name2 }) => {
      if (handlers.delete(name2)) {
        removeEventListener(node, name2, handleEvent);
        this.#updateDebounceThrottle(throttles, name2, 0);
        this.#updateDebounceThrottle(debouncers, name2, 0);
      } else {
        removeAttribute(node, name2);
        SYNCED_ATTRIBUTES[name2]?.removed?.(node, name2);
      }
    });
    iterate(added, (attribute3) => this.#createAttribute(node, attribute3));
  }
  #replaceText({ node }, { content }) {
    setData(node, content ?? "");
  }
  #replaceInnerHtml({ node }, { inner_html }) {
    setInnerHtml(node, inner_html ?? "");
  }
  #insertChildren(domParent, beforeEl, metaParent, index4, children) {
    iterate(children, (child2) => this.#insertChild(domParent, beforeEl, metaParent, index4++, child2));
  }
  #insertChild(domParent, beforeEl, metaParent, index4, vnode) {
    switch (vnode.kind) {
      case element_kind: {
        const node = this.#createElement(metaParent, index4, vnode);
        this.#insertChildren(node, null, node[meta], 0, vnode.children);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case text_kind: {
        const node = this.#createTextNode(metaParent, index4, vnode);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case fragment_kind: {
        const marker = "lustre:fragment";
        const head = this.#createHead(marker, metaParent, index4, vnode);
        insertBefore(domParent, head, beforeEl);
        this.#insertChildren(domParent, beforeEl, head[meta], 0, vnode.children);
        if (this.#debug) {
          head[meta].endNode = createComment(` /${marker} `);
          insertBefore(domParent, head[meta].endNode, beforeEl);
        }
        break;
      }
      case unsafe_inner_html_kind: {
        const node = this.#createElement(metaParent, index4, vnode);
        this.#replaceInnerHtml({ node }, vnode);
        insertBefore(domParent, node, beforeEl);
        break;
      }
      case map_kind: {
        const head = this.#createHead("lustre:map", metaParent, index4, vnode);
        insertBefore(domParent, head, beforeEl);
        this.#insertChild(domParent, beforeEl, head[meta], 0, vnode.child);
        break;
      }
      case memo_kind: {
        const child2 = this.#memos?.get(vnode.view) ?? vnode.view();
        this.#insertChild(domParent, beforeEl, metaParent, index4, child2);
        break;
      }
    }
  }
  #createElement(parent, index4, { kind, key, tag, namespace, attributes }) {
    const node = createElementNS(namespace || NAMESPACE_HTML, tag);
    insertMetadataChild(kind, parent, node, index4, key);
    if (this.#debug && key) {
      setAttribute(node, "data-lustre-key", key);
    }
    iterate(attributes, (attribute3) => this.#createAttribute(node, attribute3));
    return node;
  }
  #createTextNode(parent, index4, { kind, key, content }) {
    const node = createTextNode(content ?? "");
    insertMetadataChild(kind, parent, node, index4, key);
    return node;
  }
  #createHead(marker, parent, index4, { kind, key }) {
    const node = this.#debug ? createComment(markerComment(marker, key)) : createTextNode("");
    insertMetadataChild(kind, parent, node, index4, key);
    return node;
  }
  #createAttribute(node, attribute3) {
    const { debouncers, handlers, throttles } = node[meta];
    const {
      kind,
      name: name2,
      value: value2,
      prevent_default: prevent,
      debounce: debounceDelay,
      throttle: throttleDelay
    } = attribute3;
    switch (kind) {
      case attribute_kind: {
        const valueOrDefault = value2 ?? "";
        if (name2 === "virtual:defaultValue") {
          node.defaultValue = valueOrDefault;
          return;
        } else if (name2 === "virtual:defaultChecked") {
          node.defaultChecked = true;
          return;
        } else if (name2 === "virtual:defaultSelected") {
          node.defaultSelected = true;
          return;
        }
        if (valueOrDefault !== getAttribute(node, name2)) {
          setAttribute(node, name2, valueOrDefault);
        }
        SYNCED_ATTRIBUTES[name2]?.added?.(node, valueOrDefault);
        break;
      }
      case property_kind:
        node[name2] = value2;
        break;
      case event_kind: {
        if (handlers.has(name2)) {
          removeEventListener(node, name2, handleEvent);
        }
        const passive = prevent.kind === never_kind;
        addEventListener(node, name2, handleEvent, { passive });
        this.#updateDebounceThrottle(throttles, name2, throttleDelay);
        this.#updateDebounceThrottle(debouncers, name2, debounceDelay);
        handlers.set(name2, (event3) => this.#handleEvent(attribute3, event3));
        break;
      }
    }
  }
  #updateDebounceThrottle(map7, name2, delay) {
    const debounceOrThrottle = map7.get(name2);
    if (delay > 0) {
      if (debounceOrThrottle) {
        debounceOrThrottle.delay = delay;
      } else {
        map7.set(name2, { delay });
      }
    } else if (debounceOrThrottle) {
      const { timeout } = debounceOrThrottle;
      if (timeout) {
        clearTimeout(timeout);
      }
      map7.delete(name2);
    }
  }
  #handleEvent(attribute3, event3) {
    const { currentTarget, type } = event3;
    const { debouncers, throttles } = currentTarget[meta];
    const path = getPath(currentTarget);
    const {
      prevent_default: prevent,
      stop_propagation: stop,
      include
    } = attribute3;
    if (prevent.kind === always_kind)
      event3.preventDefault();
    if (stop.kind === always_kind)
      event3.stopPropagation();
    if (type === "submit") {
      event3.detail ??= {};
      event3.detail.formData = [
        ...new FormData(event3.target, event3.submitter).entries()
      ];
    }
    const data = this.#decodeEvent(event3, path, type, include);
    const throttle = throttles.get(type);
    if (throttle) {
      const now = Date.now();
      const last = throttle.last || 0;
      if (now > last + throttle.delay) {
        throttle.last = now;
        throttle.lastEvent = event3;
        this.#dispatch(event3, data);
      }
    }
    const debounce = debouncers.get(type);
    if (debounce) {
      clearTimeout(debounce.timeout);
      debounce.timeout = setTimeout(() => {
        if (event3 === throttles.get(type)?.lastEvent)
          return;
        this.#dispatch(event3, data);
      }, debounce.delay);
    }
    if (!throttle && !debounce) {
      this.#dispatch(event3, data);
    }
  }
}
var markerComment = (marker, key) => {
  if (key) {
    return ` ${marker} key="${escape(key)}" `;
  } else {
    return ` ${marker} `;
  }
};
var handleEvent = (event3) => {
  const { currentTarget, type } = event3;
  const handler = currentTarget[meta].handlers.get(type);
  handler(event3);
};
var syncedBooleanAttribute = (name2) => {
  return {
    added(node) {
      node[name2] = true;
    },
    removed(node) {
      node[name2] = false;
    }
  };
};
var syncedAttribute = (name2) => {
  return {
    added(node, value2) {
      node[name2] = value2;
    }
  };
};
var SYNCED_ATTRIBUTES = {
  checked: syncedBooleanAttribute("checked"),
  selected: syncedBooleanAttribute("selected"),
  value: syncedAttribute("value"),
  autofocus: {
    added(node) {
      queueMicrotask(() => {
        node.focus?.();
      });
    }
  },
  autoplay: {
    added(node) {
      try {
        node.play?.();
      } catch (e) {
        console.error(e);
      }
    }
  }
};

// build/dev/javascript/lustre/lustre/element/keyed.mjs
function do_extract_keyed_children(loop$key_children_pairs, loop$keyed_children, loop$children) {
  while (true) {
    let key_children_pairs = loop$key_children_pairs;
    let keyed_children = loop$keyed_children;
    let children = loop$children;
    if (key_children_pairs instanceof Empty) {
      return [keyed_children, reverse(children)];
    } else {
      let rest = key_children_pairs.tail;
      let key = key_children_pairs.head[0];
      let element$1 = key_children_pairs.head[1];
      let keyed_element = to_keyed(key, element$1);
      let _block;
      if (key === "") {
        _block = keyed_children;
      } else {
        _block = insert2(keyed_children, key, keyed_element);
      }
      let keyed_children$1 = _block;
      let children$1 = prepend(keyed_element, children);
      loop$key_children_pairs = rest;
      loop$keyed_children = keyed_children$1;
      loop$children = children$1;
    }
  }
}
function extract_keyed_children(children) {
  return do_extract_keyed_children(children, empty2(), empty_list);
}
function element3(tag, attributes, children) {
  let $ = extract_keyed_children(children);
  let keyed_children = $[0];
  let children$1 = $[1];
  return element("", "", tag, attributes, children$1, keyed_children, false, is_void_html_element(tag, ""));
}
function namespaced2(namespace, tag, attributes, children) {
  let $ = extract_keyed_children(children);
  let keyed_children = $[0];
  let children$1 = $[1];
  return element("", namespace, tag, attributes, children$1, keyed_children, false, is_void_html_element(tag, namespace));
}
function fragment2(children) {
  let $ = extract_keyed_children(children);
  let keyed_children = $[0];
  let children$1 = $[1];
  return fragment("", children$1, keyed_children);
}

// build/dev/javascript/lustre/lustre/vdom/virtualise.ffi.mjs
var virtualise = (root2) => {
  const rootMeta = insertMetadataChild(element_kind, null, root2, 0, null);
  const { children } = virtualiseChildren(rootMeta, root2, root2.firstChild);
  if (children.length > 1) {
    const rootNodeMeta = insertMetadataChild(element_kind, null, root2, 0, null);
    rootMeta.kind = fragment_kind;
    rootMeta.node = globalThis.document.createTextNode("");
    rootMeta.parent = rootNodeMeta;
    rootNodeMeta.children.push(rootMeta);
    root2.insertBefore(rootMeta.node, root2.firstChild);
    return fragment2(toList3(children));
  }
  if (children.length === 1) {
    return children[0][1];
  }
  const placeholder = globalThis.document.createTextNode("");
  insertMetadataChild(text_kind, rootMeta, placeholder, 0, null);
  root2.insertBefore(placeholder, root2.firstChild);
  return none2();
};
var virtualiseChild = (meta2, domParent, child2, index4) => {
  if (child2.nodeType === COMMENT_NODE) {
    const data = child2.data.trim();
    if (data.startsWith("lustre:fragment")) {
      return virtualiseFragment(meta2, domParent, child2, index4);
    }
    if (data.startsWith("lustre:map")) {
      return virtualiseMap(meta2, domParent, child2, index4);
    }
    if (data.startsWith("lustre:memo")) {
      return virtualiseMemo(meta2, domParent, child2, index4);
    }
    return null;
  }
  if (child2.nodeType === ELEMENT_NODE) {
    return virtualiseElement(meta2, child2, index4);
  }
  if (child2.nodeType === TEXT_NODE) {
    return virtualiseText(meta2, child2, index4);
  }
  return null;
};
var virtualiseElement = (metaParent, node, index4) => {
  const key = node.getAttribute("data-lustre-key") ?? "";
  if (key) {
    node.removeAttribute("data-lustre-key");
  }
  const meta2 = insertMetadataChild(element_kind, metaParent, node, index4, key);
  const tag = node.localName;
  const namespace = node.namespaceURI;
  const isHtmlElement = !namespace || namespace === NAMESPACE_HTML;
  if (isHtmlElement && INPUT_ELEMENTS.includes(tag)) {
    virtualiseInputEvents(tag, node);
  }
  const attributes = virtualiseAttributes(node);
  const { children } = virtualiseChildren(meta2, node, node.firstChild);
  const vnode = isHtmlElement ? element3(tag, attributes, toList3(children)) : namespaced2(namespace, tag, attributes, toList3(children));
  return childResult(key, vnode, node.nextSibling);
};
var virtualiseChildren = (meta2, domParent, childNode) => {
  const children = [];
  while (childNode && (childNode.nodeType !== COMMENT_NODE || childNode.data.trim() !== "/lustre:fragment")) {
    const child2 = virtualiseChild(meta2, domParent, childNode, children.length);
    if (child2) {
      children.push([child2.key, child2.vnode]);
      childNode = child2.next;
    } else {
      childNode = childNode.nextSibling;
    }
  }
  return { children, end: childNode };
};
var virtualiseText = (meta2, node, index4) => {
  insertMetadataChild(text_kind, meta2, node, index4, null);
  return childResult("", text2(node.data), node.nextSibling);
};
var virtualiseFragment = (metaParent, domParent, node, index4) => {
  const key = parseKey(node.data);
  const meta2 = insertMetadataChild(fragment_kind, metaParent, node, index4, key);
  const { children, end } = virtualiseChildren(meta2, domParent, node.nextSibling);
  meta2.endNode = end;
  const vnode = fragment2(toList3(children));
  return childResult(key, vnode, end?.nextSibling);
};
var virtualiseMap = (metaParent, domParent, node, index4) => {
  const key = parseKey(node.data);
  const meta2 = insertMetadataChild(map_kind, metaParent, node, index4, key);
  const child2 = virtualiseNextChild(meta2, domParent, node, 0);
  if (!child2)
    return null;
  const vnode = map6(child2.vnode, (x) => x);
  return childResult(key, vnode, child2.next);
};
var virtualiseMemo = (meta2, domParent, node, index4) => {
  const key = parseKey(node.data);
  const child2 = virtualiseNextChild(meta2, domParent, node, index4);
  if (!child2)
    return null;
  domParent.removeChild(node);
  const vnode = memo2(toList3([ref({})]), () => child2.vnode);
  return childResult(key, vnode, child2.next);
};
var virtualiseNextChild = (meta2, domParent, node, index4) => {
  while (true) {
    node = node.nextSibling;
    if (!node)
      return null;
    const child2 = virtualiseChild(meta2, domParent, node, index4);
    if (child2)
      return child2;
  }
};
var childResult = (key, vnode, next) => {
  return { key, vnode, next };
};
var virtualiseAttributes = (node) => {
  const attributes = [];
  for (let i = 0;i < node.attributes.length; i++) {
    const attr = node.attributes[i];
    if (attr.name !== "xmlns") {
      attributes.push(attribute2(attr.localName, attr.value));
    }
  }
  return toList3(attributes);
};
var INPUT_ELEMENTS = ["input", "select", "textarea"];
var virtualiseInputEvents = (tag, node) => {
  const value2 = node.value;
  const checked = node.checked;
  if (tag === "input" && node.type === "checkbox" && !checked)
    return;
  if (tag === "input" && node.type === "radio" && !checked)
    return;
  if (node.type !== "checkbox" && node.type !== "radio" && !value2)
    return;
  queueMicrotask(() => {
    node.value = value2;
    node.checked = checked;
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
    if (globalThis.document.activeElement !== node) {
      node.dispatchEvent(new Event("blur", { bubbles: true }));
    }
  });
};
var parseKey = (data) => {
  const keyMatch = data.match(/key="([^"]*)"/);
  if (!keyMatch)
    return "";
  return unescapeKey(keyMatch[1]);
};
var unescapeKey = (key) => {
  return key.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'");
};
var toList3 = (arr) => arr.reduceRight((xs, x) => List$NonEmpty(x, xs), empty_list);

// build/dev/javascript/lustre/lustre/runtime/client/runtime.ffi.mjs
var is_browser = () => !!globalThis.document;
class Runtime {
  constructor(root2, [model, effects], view, update2, options) {
    this.root = root2;
    this.#model = model;
    this.#view = view;
    this.#update = update2;
    this.root.addEventListener("context-request", (event3) => {
      if (!(event3.context && event3.callback))
        return;
      if (!this.#contexts.has(event3.context))
        return;
      event3.stopImmediatePropagation();
      const context = this.#contexts.get(event3.context);
      if (event3.subscribe) {
        const unsubscribe2 = () => {
          context.subscribers = context.subscribers.filter((subscriber) => subscriber !== event3.callback);
        };
        context.subscribers.push([event3.callback, unsubscribe2]);
        event3.callback(context.value, unsubscribe2);
      } else {
        event3.callback(context.value);
      }
    });
    const decodeEvent = (event3, path, name2) => decode2(this.#cache, path, name2, event3);
    const dispatch2 = (event3, data) => {
      const [cache, result] = dispatch(this.#cache, data);
      this.#cache = cache;
      if (Result$isOk(result)) {
        const handler = Result$Ok$0(result);
        if (handler.stop_propagation)
          event3.stopPropagation();
        if (handler.prevent_default)
          event3.preventDefault();
        this.dispatch(handler.message, false);
      }
    };
    this.#reconciler = new Reconciler(this.root, decodeEvent, dispatch2, options);
    this.#vdom = virtualise(this.root);
    this.#cache = new$4();
    this.#handleEffects(effects);
    this.#render();
  }
  root = null;
  dispatch(message, shouldFlush = false) {
    if (this.#shouldQueue) {
      this.#queue.push(message);
    } else {
      const [model, effects] = this.#update(this.#model, message);
      this.#model = model;
      this.#scheduleRender(shouldFlush);
      this.#handleEffects(effects);
    }
  }
  emit(event3, data) {
    const target = this.root.host ?? this.root;
    target.dispatchEvent(new LustreEvent(event3, data));
  }
  provide(key, value2) {
    if (!this.#contexts.has(key)) {
      this.#contexts.set(key, { value: value2, subscribers: [] });
    } else {
      const context = this.#contexts.get(key);
      if (isEqual2(context.value, value2)) {
        return;
      }
      context.value = value2;
      for (let i = context.subscribers.length - 1;i >= 0; i--) {
        const [subscriber, unsubscribe2] = context.subscribers[i];
        if (!subscriber) {
          context.subscribers.splice(i, 1);
          continue;
        }
        subscriber(value2, unsubscribe2);
      }
    }
  }
  subscribe(key, decoder) {
    if (!key)
      return;
    this.#contextSubscriptions.get(key)?.();
    const target = this.root.host ?? this.root;
    target.dispatchEvent(new ContextRequestEvent(key, (value2, unsubscribe2) => {
      const previousUnsubscribe = this.#contextSubscriptions.get(key);
      if (previousUnsubscribe !== unsubscribe2) {
        previousUnsubscribe?.();
      }
      const decoded = run(value2, decoder);
      this.#contextSubscriptions.set(key, unsubscribe2);
      if (Result$isOk(decoded)) {
        this.dispatch(Result$Ok$0(decoded), true);
      }
    }, true));
  }
  unsubscribe(key) {
    const unsubscribe2 = this.#contextSubscriptions.get(key);
    if (unsubscribe2) {
      unsubscribe2();
      this.#contextSubscriptions.delete(key);
    }
  }
  unsubscribeAll() {
    for (const [_, unsubscribe2] of this.#contextSubscriptions) {
      unsubscribe2?.();
    }
    this.#contextSubscriptions.clear();
  }
  #model;
  #view;
  #update;
  #vdom;
  #cache;
  #reconciler;
  #contexts = new Map;
  #contextSubscriptions = new Map;
  #shouldQueue = false;
  #queue = [];
  #beforePaint = empty_list;
  #afterPaint = empty_list;
  #renderTimer = null;
  #actions = {
    dispatch: (message) => this.dispatch(message),
    emit: (event3, data) => this.emit(event3, data),
    select: () => {},
    root: () => this.root,
    provide: (key, value2) => this.provide(key, value2),
    subscribe: (key, decoder) => this.subscribe(key, decoder),
    unsubscribe: (key) => this.unsubscribe(key)
  };
  #scheduleRender(shouldFlush = false) {
    if (this.#renderTimer)
      return;
    if (shouldFlush) {
      this.#renderTimer = "sync";
      queueMicrotask(() => this.#render());
    } else {
      this.#renderTimer = window.requestAnimationFrame(() => this.#render());
    }
  }
  #handleEffects(effects) {
    this.#shouldQueue = true;
    let updateCalledDuringEffects = false;
    while (true) {
      iterate(effects.synchronous, (effect) => effect(this.#actions));
      this.#beforePaint = append4(this.#beforePaint, effects.before_paint);
      this.#afterPaint = append4(this.#afterPaint, effects.after_paint);
      if (!this.#queue.length)
        break;
      const message = this.#queue.shift();
      [this.#model, effects] = this.#update(this.#model, message);
      updateCalledDuringEffects = true;
    }
    this.#shouldQueue = false;
    return updateCalledDuringEffects;
  }
  #handleAsyncEffects(effects) {
    if (this.#handleEffects(effects)) {
      this.#scheduleRender(true);
    }
  }
  #render() {
    this.#renderTimer = null;
    const next = this.#view(this.#model);
    const { patch, cache } = diff(this.#cache, this.#vdom, next);
    this.#cache = cache;
    this.#vdom = next;
    this.#reconciler.push(patch, memos(cache));
    if (List$isNonEmpty(this.#beforePaint)) {
      const effects = makeEffect(this.#beforePaint);
      this.#beforePaint = empty_list;
      queueMicrotask(() => this.#handleAsyncEffects(effects));
    }
    if (List$isNonEmpty(this.#afterPaint)) {
      const effects = makeEffect(this.#afterPaint);
      this.#afterPaint = empty_list;
      window.requestAnimationFrame(() => this.#handleAsyncEffects(effects));
    }
  }
}
function makeEffect(synchronous) {
  return {
    synchronous,
    after_paint: empty_list,
    before_paint: empty_list
  };
}
var copiedStyleSheets = new WeakMap;
class ContextRequestEvent extends Event {
  constructor(context, callback, subscribe2) {
    super("context-request", { bubbles: true, composed: true });
    this.context = context;
    this.callback = callback;
    this.subscribe = subscribe2;
  }
}

class LustreEvent extends CustomEvent {
  isLustreEvent = true;
  constructor(name2, detail) {
    super(name2, { detail, bubbles: true, composed: true });
  }
}

// build/dev/javascript/lustre/lustre/runtime/client/spa.ffi.mjs
class Spa {
  #runtime;
  constructor(root2, [init, effects], update2, view) {
    this.#runtime = new Runtime(root2, [init, effects], view, update2);
  }
  send(message) {
    if (Message$isEffectDispatchedMessage(message)) {
      this.dispatch(message.message, false);
    } else if (Message$isEffectEmitEvent(message)) {
      this.emit(message.name, message.data);
    } else if (Message$isSystemRequestedShutdown(message)) {}
  }
  dispatch(message) {
    this.#runtime.dispatch(message);
  }
  emit(event3, data) {
    this.#runtime.emit(event3, data);
  }
}
var start = ({ init, update: update2, view }, selector, flags) => {
  if (!is_browser())
    return Result$Error(Error$NotABrowser());
  const root2 = selector instanceof HTMLElement ? selector : globalThis.document.querySelector(selector);
  if (!root2)
    return Result$Error(Error$ElementNotFound(selector));
  return Result$Ok(new Spa(root2, init(flags), update2, view));
};

// build/dev/javascript/lustre/lustre/runtime/server/runtime.ffi.mjs
class Runtime2 {
  #model;
  #update;
  #view;
  #config;
  #vdom;
  #cache;
  #providers = make();
  #callbacks = /* @__PURE__ */ new Set;
  constructor(_, init, update2, view, config, start_arguments) {
    const [model, effects] = init(start_arguments);
    this.#model = model;
    this.#update = update2;
    this.#view = view;
    this.#config = config;
    this.#vdom = this.#view(this.#model);
    this.#cache = from_node(this.#vdom);
    this.#handle_effect(effects);
  }
  send(message) {
    if (Message$isClientDispatchedMessage(message)) {
      const { message: message2 } = message2;
      const next = this.#handle_client_message(message2);
      const diff2 = diff(this.#cache, this.#vdom, next);
      this.#vdom = next;
      this.#cache = diff2.cache;
      this.broadcast(reconcile(diff2.patch, memos(diff2.cache)));
    } else if (Message$isClientRegisteredCallback(message)) {
      const { callback } = message;
      this.#callbacks.add(callback);
      callback(mount(this.#config.open_shadow_root, this.#config.adopt_styles, keys(this.#config.attributes), keys(this.#config.properties), keys(this.#config.contexts), this.#providers, this.#vdom, memos(this.#cache)));
      if (Option$isSome(this.#config.on_connect)) {
        this.#dispatch(Option$Some$0(this.#config.on_connect));
      }
    } else if (Message$isClientDeregisteredCallback(message)) {
      const { callback } = message;
      this.#callbacks.delete(callback);
      if (Option$isSome(this.#config.on_disconnect)) {
        this.#dispatch(Option$Some$0(this.#config.on_disconnect));
      }
    } else if (Message$isEffectDispatchedMessage(message)) {
      const { message: message2 } = message2;
      const [model, effect] = this.#update(this.#model, message2);
      const next = this.#view(model);
      const diff2 = diff(this.#cache, this.#vdom, next);
      this.#handle_effect(effect);
      this.#model = model;
      this.#vdom = next;
      this.#cache = diff2.cache;
      this.broadcast(reconcile(diff2.patch, memos(diff2.cache)));
    } else if (Message$isEffectEmitEvent(message)) {
      const { name: name2, data } = message;
      this.broadcast(emit(name2, data));
    } else if (Message$isEffectProvidedValue(message)) {
      const { key, value: value2 } = message;
      const existing = get(this.#providers, key);
      if (Result$isOk(existing) && isEqual2(Result$Ok$0(existing), value2)) {
        return;
      }
      this.#providers = insert(this.#providers, key, value2);
      this.broadcast(provide(key, value2));
    } else if (Message$isEffectRequestedContextSubscription(message)) {
      const { key, decoder } = message;
      this.broadcast(subscribe(key));
      this.#config.contexts = insert(this.#config.contexts, key, decoder);
    } else if (Message$isEffectRemovedContextSubscription(message)) {
      const { key } = message;
      this.broadcast(unsubscribe(key));
      this.#config.contexts = delete$(this.#config.contexts, key);
    } else if (Message$isSystemRequestedShutdown(message)) {
      this.#model = null;
      this.#update = null;
      this.#view = null;
      this.#config = null;
      this.#vdom = null;
      this.#cache = null;
      this.#providers = null;
      this.#callbacks.clear();
    }
  }
  broadcast(message) {
    for (const callback of this.#callbacks) {
      callback(message);
    }
  }
  #handle_client_message(message) {
    if (ServerMessage$isBatch(message)) {
      const { messages } = message;
      let model = this.#model;
      let effect = none();
      for (let list4 = messages;List$NonEmpty$rest(list4); list4 = List$NonEmpty$rest(list4)) {
        const result = this.#handle_client_message(List$NonEmpty$first(list4));
        if (Result$isOk(result)) {
          model = Result$Ok$0(result)[0];
          effect = batch(toList2([effect, Result$Ok$0(result)[1]]));
          break;
        }
      }
      this.#handle_effect(effect);
      this.#model = model;
      return this.#view(model);
    } else if (ServerMessage$isAttributeChanged(message)) {
      const { name: name2, value: value2 } = message;
      const result = this.#handle_attribute_change(name2, value2);
      if (!Result$isOk(result)) {
        return this.#vdom;
      }
      return this.#dispatch(Result$Ok$0(result));
    } else if (ServerMessage$isPropertyChanged(message)) {
      const { name: name2, value: value2 } = message;
      const result = this.#handle_properties_change(name2, value2);
      if (!Result$isOk(result)) {
        return this.#vdom;
      }
      return this.#dispatch(Result$Ok$0(result));
    } else if (ServerMessage$isEventFired(message)) {
      const { path, name: name2, event: event3 } = message2;
      const [cache, result] = handle(this.#cache, path, name2, event3);
      this.#cache = cache;
      if (!Result$isOk(result)) {
        return this.#vdom;
      }
      const { message: message2 } = Result$Ok$0(result);
      return this.#dispatch(message2);
    } else if (ServerMessage$isContextProvided(message)) {
      const { key, value: value2 } = message;
      let result = get(this.#config.contexts, key);
      if (!Result$isOk(result)) {
        return this.#vdom;
      }
      result = run(value2, Result$Ok$0(result));
      if (!Result$isOk(result)) {
        return this.#vdom;
      }
      return this.#dispatch(Result$Ok$0(result));
    }
  }
  #dispatch(message) {
    const [model, effects] = this.#update(this.#model, message);
    this.#handle_effect(effects);
    this.#model = model;
    return this.#view(this.#model);
  }
  #handle_attribute_change(name2, value2) {
    const result = get(this.#config.attributes, name2);
    if (!Result$isOk(result)) {
      return result;
    }
    return Result$Ok$0(result)(value2);
  }
  #handle_properties_change(name2, value2) {
    const result = get(this.#config.properties, name2);
    if (!Result$isOk(result)) {
      return result;
    }
    return Result$Ok$0(result)(value2);
  }
  #handle_effect(effect) {
    const dispatch2 = (message) => this.send(Message$EffectDispatchedMessage(message));
    const emit2 = (name2, data) => this.send(Message$EffectEmitEvent(name2, data));
    const select = () => {
      return;
    };
    const internals = () => {
      return;
    };
    const provide2 = (key, value2) => this.send(Message$EffectProvidedValue(key, value2));
    const subscribe2 = (key, decoder) => this.send(Message$EffectRequestedContextSubscription(key, decoder));
    const unsubscribe2 = (key) => this.send(Message$EffectRemovedContextSubscription(key));
    globalThis.queueMicrotask(() => {
      perform(effect, dispatch2, emit2, select, internals, provide2, subscribe2, unsubscribe2);
    });
  }
}

// build/dev/javascript/lustre/lustre.mjs
class ElementNotFound extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
}
var Error$ElementNotFound = (selector) => new ElementNotFound(selector);
class NotABrowser extends CustomType {
}
var Error$NotABrowser$const = new NotABrowser;
var Error$NotABrowser = () => Error$NotABrowser$const;
function application(init, update2, view) {
  return new App(Option$None$const, init, update2, view, default_config);
}
function simple(init, update2, view) {
  let init$1 = (arguments$) => {
    return [init(arguments$), none()];
  };
  let update$1 = (model, message) => {
    return [update2(model, message), none()];
  };
  return application(init$1, update$1, view);
}
function start4(app, selector, arguments$) {
  return guard(!is_browser(), new Error(Error$NotABrowser$const), () => {
    return start(app, selector, arguments$);
  });
}

// build/dev/javascript/lustre/lustre/element/svg.mjs
var namespace = "http://www.w3.org/2000/svg";
function line(attrs) {
  return namespaced(namespace, "line", attrs, empty_list);
}
function rect(attrs) {
  return namespaced(namespace, "rect", attrs, empty_list);
}
function g(attrs, children) {
  return namespaced(namespace, "g", attrs, children);
}

// build/dev/javascript/gleam_stdlib/gleam/pair.mjs
function new$5(first, second) {
  return [first, second];
}

// build/dev/javascript/lustre/lustre/event.mjs
function on(name2, handler) {
  return event(name2, map3(handler, (message) => {
    return new Handler(false, false, message);
  }), empty_list, never, never, 0, 0);
}
function prevent_default(event4) {
  if (event4 instanceof Event2) {
    return new Event2(event4.kind, event4.name, event4.handler, event4.include, always, event4.stop_propagation, event4.debounce, event4.throttle);
  } else {
    return event4;
  }
}
function on_click(message) {
  return on("click", success(message));
}
function formdata_decoder() {
  let string_value_decoder = field(0, string2, (key) => {
    return field(1, one_of(map3(string2, (var0) => {
      return new Ok(var0);
    }), toList([success(error_nil)])), (value2) => {
      let _pipe2 = value2;
      let _pipe$12 = map4(_pipe2, (_capture) => {
        return new$5(key, _capture);
      });
      return success(_pipe$12);
    });
  });
  let _pipe = string_value_decoder;
  let _pipe$1 = list2(_pipe);
  return map3(_pipe$1, values2);
}
function on_submit(message) {
  let _pipe = on("submit", subfield(toList(["detail", "formData"]), formdata_decoder(), (formdata) => {
    let _pipe2 = formdata;
    let _pipe$1 = message(_pipe2);
    return success(_pipe$1);
  }));
  return prevent_default(_pipe);
}
// build/dev/javascript/granny_life/granny_life/square.mjs
class Alive extends CustomType {
}
var Cell$Alive$const = new Alive;
class Dormant extends CustomType {
}
var Cell$Dormant$const = new Dormant;
var granny_life_gen_0 = /* @__PURE__ */ toList([
  /* @__PURE__ */ toList([Cell$Alive$const]),
  /* @__PURE__ */ toList([Cell$Dormant$const, Cell$Dormant$const]),
  /* @__PURE__ */ toList([
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const
  ]),
  /* @__PURE__ */ toList([
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const
  ]),
  /* @__PURE__ */ toList([
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const
  ]),
  /* @__PURE__ */ toList([
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const
  ]),
  /* @__PURE__ */ toList([
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const
  ]),
  /* @__PURE__ */ toList([
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const
  ]),
  /* @__PURE__ */ toList([
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const
  ]),
  /* @__PURE__ */ toList([
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const
  ]),
  /* @__PURE__ */ toList([
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const
  ]),
  /* @__PURE__ */ toList([
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const,
    Cell$Dormant$const
  ]),
  /* @__PURE__ */ toList([
    Cell$Alive$const,
    Cell$Alive$const,
    Cell$Alive$const,
    Cell$Alive$const,
    Cell$Alive$const,
    Cell$Alive$const,
    Cell$Alive$const,
    Cell$Alive$const,
    Cell$Alive$const,
    Cell$Alive$const,
    Cell$Alive$const,
    Cell$Alive$const,
    Cell$Alive$const
  ])
]);
function alive_percentage(quadrant) {
  let flattened_rows = flatten(quadrant);
  let total_cells = length(flattened_rows);
  let _block;
  let _pipe = flattened_rows;
  let _pipe$1 = count(_pipe, (cell) => {
    return cell instanceof Alive;
  });
  let _pipe$2 = identity(_pipe$1);
  _block = divide(_pipe$2, identity(total_cells));
  let percentage = _block;
  if (percentage instanceof Ok) {
    let result = percentage[0];
    return multiply(result, 100);
  } else {
    return 0;
  }
}
function sum_row_color_changes(loop$row, loop$acc) {
  while (true) {
    let row = loop$row;
    let acc = loop$acc;
    if (row instanceof Empty) {
      return acc;
    } else {
      let $ = row.tail;
      if ($ instanceof Empty) {
        return acc;
      } else {
        let $1 = row.head;
        if ($1 instanceof Alive) {
          let $2 = $.head;
          if ($2 instanceof Alive) {
            let cell = $2;
            let rest = $.tail;
            loop$row = prepend(cell, rest);
            loop$acc = acc;
          } else {
            let cell = $2;
            let rest = $.tail;
            loop$row = prepend(cell, rest);
            loop$acc = acc + 1;
          }
        } else {
          let $2 = $.head;
          if ($2 instanceof Alive) {
            let cell = $2;
            let rest = $.tail;
            loop$row = prepend(cell, rest);
            loop$acc = acc + 1;
          } else {
            let cell = $2;
            let rest = $.tail;
            loop$row = prepend(cell, rest);
            loop$acc = acc;
          }
        }
      }
    }
  }
}
function sum_color_changes(loop$quadrant, loop$acc) {
  while (true) {
    let quadrant = loop$quadrant;
    let acc = loop$acc;
    if (quadrant instanceof Empty) {
      return acc;
    } else {
      let $ = quadrant.tail;
      if ($ instanceof Empty) {
        return acc;
      } else {
        let $1 = quadrant.head;
        if ($1 instanceof Empty) {
          return acc;
        } else {
          let $2 = $.head;
          if ($2 instanceof Empty) {
            return acc;
          } else {
            let first_row = $1;
            let second_row = $2;
            let rest = $.tail;
            let first_cell = $1.head;
            let second_cell = $2.head;
            let row_changes = sum_row_color_changes(first_row, 0) * 4;
            let between_change = sum_row_color_changes(toList([first_cell, second_cell]), 0);
            loop$quadrant = prepend(second_row, rest);
            loop$acc = row_changes + between_change + acc;
          }
        }
      }
    }
  }
}
function color_changes(quadrant) {
  return sum_color_changes(quadrant, 0);
}
function number_of_neighbors(neighbors) {
  let $ = neighbors[0];
  if ($ instanceof Alive) {
    let $1 = neighbors[1];
    if ($1 instanceof Alive) {
      return 2;
    } else {
      return 1;
    }
  } else {
    let $1 = neighbors[1];
    if ($1 instanceof Dormant) {
      return 0;
    } else {
      return 1;
    }
  }
}
function expand_first_row(first, second) {
  if (second instanceof Empty) {
    return List$Empty$const;
  } else {
    let $ = second.tail;
    if ($ instanceof Empty) {
      let cell = second.head;
      return toList([cell, cell]);
    } else {
      let cell = second.head;
      let _pipe = first;
      let _pipe$1 = append(_pipe, toList([cell]));
      return prepend2(_pipe$1, cell);
    }
  }
}
function next_gen_row(first, second, third) {
  let _block;
  let _pipe = first;
  let _pipe$1 = expand_first_row(_pipe, second);
  let _pipe$2 = window_by_2(_pipe$1);
  _block = map2(_pipe$2, (x) => {
    return number_of_neighbors(x);
  });
  let first_row_neighbor_count = _block;
  let _block$1;
  let _pipe$3 = third;
  let _pipe$4 = window_by_2(_pipe$3);
  _block$1 = map2(_pipe$4, (x) => {
    return number_of_neighbors(x);
  });
  let third_row_neighbor_count = _block$1;
  let _pipe$5 = first_row_neighbor_count;
  let _pipe$6 = map22(_pipe$5, third_row_neighbor_count, (a2, b) => {
    return a2 + b;
  });
  return map22(_pipe$6, second, (cell, neighbors) => {
    if (neighbors instanceof Alive) {
      if (cell === 0) {
        return neighbors;
      } else {
        return Cell$Dormant$const;
      }
    } else if (cell === 1) {
      return Cell$Alive$const;
    } else {
      return Cell$Dormant$const;
    }
  });
}
function create_next_gen(loop$current_quadrant, loop$next_quadrant) {
  while (true) {
    let current_quadrant = loop$current_quadrant;
    let next_quadrant = loop$next_quadrant;
    if (current_quadrant instanceof Empty) {
      return reverse(next_quadrant);
    } else {
      let $ = current_quadrant.tail;
      if ($ instanceof Empty) {
        return reverse(next_quadrant);
      } else {
        let $1 = $.tail;
        if ($1 instanceof Empty) {
          return reverse(next_quadrant);
        } else {
          let $2 = $1.tail;
          if ($2 instanceof Empty) {
            let first = current_quadrant.head;
            let second = $.head;
            let last = $1.head;
            loop$current_quadrant = List$Empty$const;
            loop$next_quadrant = prepend(last, prepend(next_gen_row(first, second, last), next_quadrant));
          } else {
            let $3 = current_quadrant.head;
            if ($3 instanceof Empty) {
              let first = $3;
              let second = $.head;
              let third = $1.head;
              let rest = $2;
              loop$current_quadrant = prepend(second, prepend(third, rest));
              loop$next_quadrant = prepend(next_gen_row(first, second, third), next_quadrant);
            } else {
              let $4 = $3.tail;
              if ($4 instanceof Empty) {
                let first = $3;
                let second = $.head;
                let third = $1.head;
                let rest = $2;
                loop$current_quadrant = prepend(second, prepend(third, rest));
                loop$next_quadrant = prepend(next_gen_row(first, second, third), prepend(next_gen_row(List$Empty$const, first, second), next_quadrant));
              } else {
                let first = $3;
                let second = $.head;
                let third = $1.head;
                let rest = $2;
                loop$current_quadrant = prepend(second, prepend(third, rest));
                loop$next_quadrant = prepend(next_gen_row(first, second, third), next_quadrant);
              }
            }
          }
        }
      }
    }
  }
}
function next_generation(quadrant) {
  return create_next_gen(quadrant, List$Empty$const);
}
function nth_generation(loop$current_gen, loop$n) {
  while (true) {
    let current_gen = loop$current_gen;
    let n = loop$n;
    let n$1 = n;
    if (n$1 <= 0) {
      return current_gen;
    } else {
      let n$12 = n;
      let _pipe = current_gen;
      let _pipe$1 = next_generation(_pipe);
      loop$current_gen = _pipe$1;
      loop$n = n$12 - 1;
    }
  }
}

// build/dev/javascript/granny_life/granny_life.mjs
var FILEPATH = "src/granny_life.gleam";

class Model extends CustomType {
  constructor(generation, quadrant, color) {
    super();
    this.generation = generation;
    this.quadrant = quadrant;
    this.color = color;
  }
}

class UserClickedNextGen extends CustomType {
}
var Message$UserClickedNextGen$const = new UserClickedNextGen;

class UserClickedPreviousGen extends CustomType {
}
var Message$UserClickedPreviousGen$const = new UserClickedPreviousGen;

class UserClickedResetGen extends CustomType {
}
var Message$UserClickedResetGen$const = new UserClickedResetGen;

class UserRequestedInvalidGen extends CustomType {
}
var Message$UserRequestedInvalidGen$const = new UserRequestedInvalidGen;

class UserRequestedNewGen extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}

class UserSelectedColor extends CustomType {
  constructor($0) {
    super();
    this[0] = $0;
  }
}

class Red extends CustomType {
}
var Color$Red$const = new Red;

class Orange extends CustomType {
}
var Color$Orange$const = new Orange;

class Yellow extends CustomType {
}
var Color$Yellow$const = new Yellow;

class Green extends CustomType {
}
var Color$Green$const = new Green;

class Blue extends CustomType {
}
var Color$Blue$const = new Blue;

class Indigo extends CustomType {
}
var Color$Indigo$const = new Indigo;

class Violet extends CustomType {
}
var Color$Violet$const = new Violet;

class Pink extends CustomType {
}
var Color$Pink$const = new Pink;

class North extends CustomType {
}
var CellDirection$North$const = new North;

class South extends CustomType {
}
var CellDirection$South$const = new South;

class East extends CustomType {
}
var CellDirection$East$const = new East;

class West extends CustomType {
}
var CellDirection$West$const = new West;
var cell_height = 20;
var cell_width = 10;
var half_cell_width = 5;
function process_generation_form(loop$fields) {
  while (true) {
    let fields = loop$fields;
    if (fields instanceof Empty) {
      return Message$UserRequestedInvalidGen$const;
    } else {
      let $ = fields.head[0];
      if ($ === "generation") {
        let generation = fields.head[1];
        let $1 = parse_int(generation);
        if ($1 instanceof Ok) {
          let gen = $1[0];
          return new UserRequestedNewGen(gen);
        } else {
          return Message$UserRequestedInvalidGen$const;
        }
      } else {
        let rest = fields.tail;
        loop$fields = rest;
      }
    }
  }
}
function button2(text4, message) {
  return button(toList([
    class$("flex-1 p-2 m-2 border-2 rounded-sm bg-sky-500 border-sky-400"),
    on_click(message)
  ]), toList([text3(text4)]));
}
function color_class(color) {
  if (color instanceof Red) {
    return class$("red");
  } else if (color instanceof Orange) {
    return class$("orange");
  } else if (color instanceof Yellow) {
    return class$("yellow");
  } else if (color instanceof Green) {
    return class$("green");
  } else if (color instanceof Blue) {
    return class$("blue");
  } else if (color instanceof Indigo) {
    return class$("indigo");
  } else if (color instanceof Violet) {
    return class$("violet");
  } else {
    return class$("pink");
  }
}
function color_select_button(color) {
  return button(toList([
    class$("color-select-button"),
    on_click(new UserSelectedColor(color)),
    color_class(color)
  ]), List$Empty$const);
}
function cell_rect(cell, x, y, direction) {
  return g(toList([
    (() => {
      if (direction instanceof North) {
        return attribute2("transform", "rotate(180)");
      } else if (direction instanceof South) {
        return attribute2("transform", "");
      } else if (direction instanceof East) {
        return attribute2("transform", "rotate(270)");
      } else {
        return attribute2("transform", "rotate(90)");
      }
    })()
  ]), toList([
    rect(toList([
      attribute2("x", to_string(x)),
      attribute2("y", to_string(y)),
      attribute2("rx", "4"),
      attribute2("ry", "4"),
      width(cell_width),
      height(cell_height),
      (() => {
        if (cell instanceof Alive) {
          return class$("cell alive fill-slate-200");
        } else {
          return class$("cell dormant fill-red-900");
        }
      })()
    ])),
    line(toList([
      attribute2("x1", to_string(x - cell_width + 3)),
      attribute2("y1", to_string(y + cell_height - 3)),
      attribute2("x2", to_string(x + cell_width * 2 - 3)),
      attribute2("y2", to_string(y + cell_height - 3)),
      attribute2("stroke-width", "6"),
      attribute2("stroke-linecap", "round"),
      (() => {
        if (cell instanceof Alive) {
          return class$("cell alive stroke-slate-100");
        } else {
          return class$("cell dormant stroke-red-800");
        }
      })()
    ]))
  ]));
}
function prepend_cell_rects(cell, cell_index, row_index, acc) {
  let x = cell_index * cell_height - row_index * cell_width - half_cell_width;
  let y = row_index * cell_width;
  return prepend(cell_rect(cell, x, y, CellDirection$South$const), prepend(cell_rect(cell, x, y, CellDirection$West$const), prepend(cell_rect(cell, x, y, CellDirection$East$const), prepend(cell_rect(cell, x, y, CellDirection$North$const), acc))));
}
function square(row, row_index) {
  return g(toList([class$("round-" + to_string(row_index))]), index_fold(row, List$Empty$const, (acc, cell, cell_index) => {
    return prepend_cell_rects(cell, cell_index, row_index, acc);
  }));
}
function granny_square(model) {
  return svg(toList([
    class$("granny_square"),
    attribute2("viewBox", "-140 -140 280 280"),
    color_class(model.color)
  ]), index_map(model.quadrant, square));
}
function stat_box(title, content) {
  return div(toList([class$("stat-box")]), prepend(div(toList([class$("title")]), toList([text3(title)])), content));
}
function view(model) {
  let generation = to_string(model.generation);
  let _block;
  let _pipe = model.quadrant;
  let _pipe$1 = alive_percentage(_pipe);
  let _pipe$2 = round(_pipe$1);
  _block = to_string(_pipe$2);
  let alive_percent = _block;
  let _block$1;
  let _pipe$3 = model.quadrant;
  let _pipe$4 = color_changes(_pipe$3);
  _block$1 = to_string(_pipe$4);
  let color_changes2 = _block$1;
  return main(List$Empty$const, toList([
    h1(List$Empty$const, toList([text3("Granny Life Motif")])),
    div(toList([class$("stats")]), toList([
      stat_box("Generation", toList([
        div(toList([class$("content")]), toList([text3(generation)]))
      ])),
      stat_box("Percent alive", toList([
        div(toList([class$("content")]), toList([text3(alive_percent + "%")]))
      ])),
      stat_box("Color changes", toList([
        div(toList([class$("content")]), toList([text3(color_changes2)]))
      ]))
    ])),
    div(List$Empty$const, toList([granny_square(model)])),
    div(toList([class$("color-button-container")]), toList([
      color_select_button(Color$Red$const),
      color_select_button(Color$Orange$const),
      color_select_button(Color$Yellow$const),
      color_select_button(Color$Green$const),
      color_select_button(Color$Blue$const),
      color_select_button(Color$Indigo$const),
      color_select_button(Color$Violet$const),
      color_select_button(Color$Pink$const)
    ])),
    div(toList([class$("generation-nav")]), toList([
      button2("Previous", Message$UserClickedPreviousGen$const),
      button2("Reset", Message$UserClickedResetGen$const),
      button2("Next", Message$UserClickedNextGen$const)
    ])),
    form(toList([
      on_submit(process_generation_form),
      class$("generation-jump-form"),
      autocomplete("off")
    ]), toList([
      label(toList([for$("generation")]), toList([text3("Jump to generation:")])),
      input(toList([name("generation"), value("")])),
      button(List$Empty$const, toList([text3("Go")]))
    ])),
    footer(toList([class$("p-2 m-2 text-center text-slate-500")]), toList([
      text3("Carefully crafted by "),
      a(toList([href("https://brainofdane.com")]), toList([text3("Dane")]))
    ]))
  ]));
}
function jump_to_generation(model, generation) {
  let _block;
  let $ = generation - model.generation;
  {
    let nth_gen = $;
    if (nth_gen >= 0) {
      _block = nth_generation(model.quadrant, nth_gen);
    } else {
      _block = nth_generation(granny_life_gen_0, generation);
    }
  }
  let quadrant = _block;
  return new Model(generation, quadrant, model.color);
}
function create_previous_generation(model) {
  let generation = model.generation - 1;
  let quadrant = nth_generation(granny_life_gen_0, generation);
  return new Model(generation, quadrant, model.color);
}
function previous_generation(model) {
  let $ = model.generation;
  let gen = $;
  if (gen > 0) {
    return create_previous_generation(model);
  } else {
    return model;
  }
}
function next_generation2(model) {
  let generation = model.generation + 1;
  let quadrant = next_generation(model.quadrant);
  return new Model(generation, quadrant, model.color);
}
function update2(model, message) {
  if (message instanceof UserClickedNextGen) {
    return next_generation2(model);
  } else if (message instanceof UserClickedPreviousGen) {
    return previous_generation(model);
  } else if (message instanceof UserClickedResetGen) {
    return new Model(0, granny_life_gen_0, model.color);
  } else if (message instanceof UserRequestedInvalidGen) {
    return model;
  } else if (message instanceof UserRequestedNewGen) {
    let generation = message[0];
    return jump_to_generation(model, generation);
  } else {
    let color = message[0];
    return new Model(model.generation, model.quadrant, color);
  }
}
function init(_) {
  return new Model(0, granny_life_gen_0, Color$Blue$const);
}
function main2() {
  let app = simple(init, update2, view);
  let $ = start4(app, "#app", undefined);
  if (!($ instanceof Ok)) {
    throw makeError("let_assert", FILEPATH, "granny_life", 20, "main", "Pattern match failed, no pattern matched the value.", { value: $, start: 427, end: 476, pattern_start: 438, pattern_end: 443 });
  }
  return;
}

// .lustre/build/granny_life.mjs
main2();
