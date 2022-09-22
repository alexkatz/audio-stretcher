export const mergeRefs =
  (...refs: (React.Ref<any> | undefined)[]) =>
  (node: any) =>
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (typeof ref === 'object' && ref != null) {
        (ref as React.MutableRefObject<any>).current = node;
      }
    });
