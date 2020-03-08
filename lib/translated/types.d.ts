declare interface IPGresult {
 errorFieldMap: {[key: string]: string | null};
 queryText    : string | null;
}

declare module 'wcwidth.js' {
  function wcwidth(str: string): number;
  function wcwidth(codePoint: number): number;
  export = wcwidth;
}
