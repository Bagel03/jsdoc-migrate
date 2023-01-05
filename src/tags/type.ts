import ts, { idText } from "typescript";
import { getNodeKind } from "../plugin.js";
import { isJSDocIndexSignature } from "./class.js";

export const getJsdocType = (node: ts.Node): ts.TypeNode | undefined => {
    if (!node) return;
    if ((node as any).type) {
        return (node as any).type;
    }

    if (!node || node.pos < 0) return undefined;

    let jsdocType = ts.getJSDocType(node);

    if (!jsdocType) return undefined;

    if (ts.isTypeReferenceNode(jsdocType) && isJSDocIndexSignature(jsdocType)) {
        const typeArguments = jsdocType.typeArguments!;

        let type: ts.TypeReferenceNode;

        if (ts.isTypeReferenceNode(typeArguments[0])) {
            type = typeArguments[0];
        } else {
            type = ts.factory.createTypeReferenceNode(
                typeArguments[0].getText()
            );
        }

        const index = ts.factory.createParameterDeclaration(
            /* modifiers */ undefined,
            /* dotDotDotToken */ undefined,
            "idx",
            /* questionToken */ undefined,
            type,
            /* initializer */ undefined
        );

        const indexSignature = ts.factory.createTypeLiteralNode([
            ts.factory.createIndexSignature(
                /* modifiers */ undefined,
                [index],
                typeArguments[1]
            ),
        ]);
        // ts.setEmitFlags(indexSignature, ts.EmitFlags.SingleLine);

        return indexSignature;
    }



    return jsdocType;
};

export const updateTypeRef = (node: ts.ParenthesizedExpression) => {
    const type = getJsdocType(node);

    if ((node as any).type) {
        return node;
    }
    if (type) {
        return ts.factory.updateParenthesizedExpression(
            node,
            ts.factory.createAsExpression(node.expression, type)
        );
    }

    return node;
};

export const updateVariableDeceleration = (node: ts.VariableDeclaration) => {
    let type = getJsdocType(node);

    if (node.type) return node;

    return ts.factory.updateVariableDeclaration(
        node,
        node.name,
        node.exclamationToken,
        type,
        node.initializer
    );
};
