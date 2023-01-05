import ts from "typescript";
import utils from "tsutils";
import { transformFunctionLike } from "./tags/func.js";
import { transformTypeDefTagIfExists } from "./tags/typedef.js";
import { updateClassPropsFromClassDeceleration } from "./tags/class.js";
import { updateTypeRef, updateVariableDeceleration } from "./tags/type.js";

export const getNodeKind = (node: ts.Node) => ts.SyntaxKind[node.kind];
const p = ts.createPrinter();

export const printNode = (node: ts.Node) => {
    const str = p.printNode(
        ts.EmitHint.Unspecified,
        node,
        ts.createSourceFile(
            "",
            "",
            ts.ScriptTarget.ESNext,
            true,
            ts.ScriptKind.TS
        )
    )
    return str;
};

export const removeComments = (node: ts.Node) => {
    // ts.setCommentRange(node, { pos: node.pos, end: node.pos });
    return node;
};

export const betterJsdocPlugin: ts.TransformerFactory<ts.SourceFile> = (
    context
) => {
    const visiter: ts.Visitor = (node: ts.Node) => {
        const additionalNodes = [];

        if (ts.isConstructorDeclaration(node)) {
            const { classProps, constructor } =
                updateClassPropsFromClassDeceleration(node);

            additionalNodes.push(...classProps);
            node = constructor;
        }

        if (ts.isFunctionLike(node) && !ts.isIndexSignatureDeclaration(node)) {
            node = transformFunctionLike(node);
        }

        const { node: newNode, typeAliases } =
            transformTypeDefTagIfExists(node);

        node = newNode;
        additionalNodes.push(...typeAliases);

        if (ts.isParenthesizedExpression(node)) {
            node = updateTypeRef(node);
        }

        if (ts.isVariableDeclaration(node)) {
            node = updateVariableDeceleration(node);
        }

        return [
            ...additionalNodes.map((n) =>
                ts.visitEachChild(n, visiter, context)
            ),
            ts.visitEachChild(node, visiter, context),
        ];
    };

    return (node) => {
        return ts.visitNode(node, visiter);
    };
};
