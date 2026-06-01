import isObject from './isObject.js'

export default function isPromise<Value>(anything: unknown): anything is Promise<Value> {
  return (
    isObject(anything) &&
    typeof (anything as any).then === 'function'
  );
}
