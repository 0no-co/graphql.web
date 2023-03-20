export type Maybe<T> = T | undefined | null;

export interface Extensions {
  [extension: string]: unknown;
}

export type Source = any | {
  body: string;
  name: string;
  locationOffset: {
    line: number;
    column: number;
  };
};

export type Location = any | {
  start: number;
  end: number;
  source: Source;
};
