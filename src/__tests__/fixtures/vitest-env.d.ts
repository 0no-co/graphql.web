declare module '*?raw' {
  declare const data: string;
  export default data;
}

declare module '*.json' {
  declare const data: any;
  export default data;
}
