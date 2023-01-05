import { runCodeFixes } from "./code_fixes.js";
import { fixFormatting } from "./fix_formattig.js";
import { removeAllJsdoc } from "./remove_jsdoc.js";

export const cleanup = (doc: string) => {
    doc = removeAllJsdoc(doc);
    doc = fixFormatting(doc);
    doc = runCodeFixes(doc);

    return doc;
};
