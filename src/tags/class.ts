// Adds class props from the constructor

import ts from "typescript";
import { getNodeKind, printNode } from "../plugin.js";
import { getJsdocType } from "./type.js";

export function isJSDocIndexSignature(
    node: ts.TypeReferenceNode | ts.ExpressionWithTypeArguments
) {
    return (
        ts.isTypeReferenceNode(node) &&
        ts.isIdentifier(node.typeName) &&
        node.typeName.escapedText === "Object" &&
        node.typeArguments &&
        node.typeArguments.length === 2
    );
}


export function getAllLeadingComments(node: ts.Node):
    ReadonlyArray<Readonly<ts.CommentRange & { text: string }>> {
    const allRanges: Array<Readonly<ts.CommentRange & { text: string }>> = [];
    const nodeText = node.getFullText();
    const cr = ts.getLeadingCommentRanges(nodeText, 0);
    if (cr) allRanges.push(...cr.map(c => ({ ...c, text: nodeText.substring(c.pos, c.end) })));
    const synthetic = ts.getSyntheticLeadingComments(node);
    if (synthetic) allRanges.push(...synthetic);
    return allRanges;
}

export const getAndRemoveAllPropertyAssignment = (node: ts.Block) => {
    const classProps: ts.PropertyDeclaration[] = [];
    const statements = node.statements
        .map((statement) => {
            if (ts.isExpressionStatement(statement)) {
                if (ts.isBinaryExpression(statement.expression)) {
                    const expression = statement.expression;
                    if (
                        expression.operatorToken.kind ==
                        ts.SyntaxKind.EqualsToken
                    ) {
                        if (ts.isPropertyAccessExpression(expression.left)) {
                            if (
                                expression.left.expression.kind ==
                                ts.SyntaxKind.ThisKeyword
                            ) {
                                // we have one
                                let jsonType = getJsdocType(expression);

                                // if(jsonType && isJSDocIndexSignature(jsonType)) {
                                //     jsonType = ts.factory.createIndexSignature(undefined, undefined, )
                                // }

                                const declaration =
                                    ts.factory.createPropertyDeclaration(
                                        ts.factory.createModifiersFromModifierFlags(
                                            ts.ModifierFlags.Public
                                        ),
                                        expression.left.name,
                                        undefined,
                                        jsonType,
                                        expression.right
                                    );



                                ts.setSyntheticLeadingComments(declaration, getAllLeadingComments(statement) as any)

                                classProps.push(declaration);

                                return undefined;
                            }
                        }
                    }
                } else if (
                    ts.isPropertyAccessExpression(statement.expression)
                ) {
                    //@ts-ignore
                    if (
                        statement.expression.expression.kind ==
                        ts.SyntaxKind.ThisKeyword
                    ) {
                        // we have one
                        let jsonType = getJsdocType(statement.expression);

                        // if(jsonType && isJSDocIndexSignature(jsonType)) {
                        //     jsonType = ts.factory.createIndexSignature(undefined, undefined, )
                        // }

                        const declaration =
                            ts.factory.createPropertyDeclaration(
                                ts.factory.createModifiersFromModifierFlags(
                                    ts.ModifierFlags.Public
                                ),
                                statement.expression.name,
                                undefined,
                                jsonType,
                                undefined
                            );

                        ts.setSyntheticLeadingComments(declaration, getAllLeadingComments(statement) as any)

                        classProps.push(declaration);

                        return undefined;
                    }
                }
            }
            return statement;
        })
        .filter((n): n is ts.Statement => n !== undefined);

    return { newNode: ts.factory.updateBlock(node, statements), classProps };
};

export const updateClassPropsFromClassDeceleration = (
    node: ts.ConstructorDeclaration
) => {
    const { newNode: newBody, classProps } = getAndRemoveAllPropertyAssignment(
        node.body!
    );

    const lastClassProp = classProps.at(-1);

    return {
        classProps,

        constructor: ts.factory.updateConstructorDeclaration(
            node,
            node.modifiers,
            node.parameters,
            newBody
        ),
    };
};
