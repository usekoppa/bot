import { Transformer } from "../transformer";

export const stringTransformer: Transformer<string> = {
  name: "string",
  transform(_, arg) {
    return arg as string;
  },
};
