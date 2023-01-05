import ts from "typescript";
import { getNodeKind, removeComments } from "../plugin.js";
import { getAllLeadingComments } from "./class.js";

export const JSDocTypeLiteralToTypeExpression = (
    literal: ts.JSDocTypeLiteral
) => {
    return ts.factory.createTypeLiteralNode(
        literal.jsDocPropertyTags?.map((propTag) => {
            // const isParam = propTag.tagName.getText() === "param";
            // console.log(getNodeKind(propTag.name));
            let name: string = propTag.name.getText();
            name = name.split(".").at(-1)!;

            return ts.factory.createPropertySignature(
                undefined,
                name,
                undefined,
                propTag.typeExpression?.type
            );
        })
    );
};

const { factory } = ts;
export const transformTypeDefTagIfExists = (node: ts.Node) => {
    let children: ts.JSDoc[] = [];

    if (node.getSourceFile()) {
        children = node.getChildren().filter(ts.isJSDoc) as ts.JSDoc[];
    }

    const typeDefs: ts.JSDocTypedefTag[] = [];

    for (const jsdoc of children) {
        if (!jsdoc.tags) continue;
        if (jsdoc.tags?.length === 0) continue;

        typeDefs.push(...jsdoc.tags!.filter(ts.isJSDocTypedefTag));
    }

    const typeAliases = [];

    for (const tag of typeDefs) {
        let typeExpression: ts.TypeNode | undefined = undefined;

        const JSDocTypeExpression = tag.typeExpression!;

        if (ts.isJSDocTypeExpression(JSDocTypeExpression)) {
            typeExpression = JSDocTypeExpression.type;
        } else if (ts.isJSDocTypeLiteral(JSDocTypeExpression)) {
            // These are the more complicated ones
            typeExpression =
                JSDocTypeLiteralToTypeExpression(JSDocTypeExpression);
        }

        if (typeExpression) {
            let alias = factory.createTypeAliasDeclaration(
                ts.factory.createModifiersFromModifierFlags(
                    ts.ModifierFlags.Export
                ),
                tag.name!,
                undefined,
                typeExpression
            )
            ts.setSyntheticLeadingComments(alias, getAllLeadingComments(node) as any);
            typeAliases.push(
                alias
            );
        }
    }

    return {
        typeAliases,
        node: node,
    };
};
