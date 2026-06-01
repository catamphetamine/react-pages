const objectConstructor = {}.constructor

export default function isObject(object: unknown): object is object {
  return object !== undefined && object !== null && object.constructor === objectConstructor
}
