/* SystemJS module definition */
declare let module: NodeModule;
interface NodeModule {
  id: string;
}
declare module '!raw-loader!*' {
  const contents: string;
  export = contents;
}

interface Window {
  define: (name: string, deps: string[], definitionFn: () => any) => void;

  System: {
    import: (path) => Promise<any>;
  };
}

export {};
