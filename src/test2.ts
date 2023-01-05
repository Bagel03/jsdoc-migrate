import { stat } from "fs-extra";
import ts from "typescript";
import { getNodeKind } from "./plugin.js";

const block = ts.createSourceFile(
    "foo.ts",
    `
    function x() {}
    let y = function() {}
    let x = () => {}
    class A {
        constructor() {}

        foo() {}

        get bar() {}
        set biz(v) {}
    }
    `,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.TS
);

const visiter = (node: ts.Node) => {
    console.log(getNodeKind(node), ts.isCallSignatureDeclaration(node));
    ts.forEachChild(node, visiter);
};

ts.forEachChild(block, visiter);
const printer = ts.createPrinter();

console.log(
    "OUTPUT\n",
    printer.printNode(ts.EmitHint.Unspecified, block, block.getSourceFile())
);

/**
 *
 * @param {number} y
 */
function x(y): void {}
