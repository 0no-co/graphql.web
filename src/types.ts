export type Maybe<T> = T | undefined | null;

export interface Extensions {
  [extension: string]: unknown;
}

export interface Source {
  body: string;
  name: string;
  locationOffset: {
    line: number;
    column: number;
  };
}

export type Location = any;
