import { readFile } from "fs/promises";
import ts from "typescript";
import { getNodeKind, printNode } from "../plugin.js";
import { getJsdocType } from "./type.js";
import { JSDocTypeLiteralToTypeExpression } from "./typedef.js";

const { factory, SyntaxKind } = ts;

const dts = await readFile(
    "C:\\Dev Temp\\ts\\jsdoc-migrate\\node_modules\\typescript\\lib\\typescript.d.ts",
    { encoding: "utf-8" }
);

export const getArgsForNode = (
    node: ts.SignatureDeclaration,
    params: ts.NodeArray<ts.ParameterDeclaration>,
    returnType?: ts.TypeNode
) => {
    const nodeName = ts.SyntaxKind[node.kind];
    const functionName = `update${nodeName[0].toUpperCase()}${nodeName.slice(
        1
    )}`;
    const idx = dts.indexOf(functionName);
    const start = dts.indexOf("(", idx);
    const end = dts.indexOf("):", idx);
    const paramNames = dts
        .slice(start + 1, end)
        .split(",")
        .map((str) => str.slice(0, str.indexOf(":")))
        .map((str) => str.trim());

    const args = paramNames.map((name) => {
        switch (name) {
            case "node":
                return node;
            case "type":
                return ts.isConstructSignatureDeclaration(node) ||
                    ts.isConstructorDeclaration(node)
                    ? undefined
                    : returnType;
            case "body":
                return (node as any).body;
            case "typeParameters":
                return node.typeParameters;
            case "parameters":
                return params;
            case "modifiers":
                return node.modifiers;
        }

        return (node as any)[name];
    });

    return [functionName, args];
};

export const transformFunctionLike = (node: ts.SignatureDeclaration) => {
    if (!node.parent) node;

    const newParameters: ts.ParameterDeclaration[] = [];
    node.parameters.forEach((param) => {
        let paramType = node.type ? node.type : getJsdocType(param);

        if (paramType && ts.isJSDocTypeLiteral(paramType)) {
            paramType = JSDocTypeLiteralToTypeExpression(paramType);
        }


        // let name = param.getText().split(".").at(-1)!;
        // if (param.name) {
        //     //@ts-ignore
        //     name = param.name;
        // }

        //param.name.getText().split(".").at(-1)!;
        let needAddOptional = false;
        if (paramType && printNode(paramType).endsWith("=")) {
            ts.addSyntheticTrailingComment(paramType, ts.SyntaxKind.MultiLineCommentTrivia, "--REMOVE_PREV--")
            needAddOptional = true;
        }

        if (param.initializer)
            needAddOptional = false;

        newParameters.push(
            ts.factory.updateParameterDeclaration(
                param,
                param.modifiers,
                param.dotDotDotToken,
                param.name,
                needAddOptional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : param.questionToken,
                paramType,
                param.initializer
            )
        );
    });

    const newParameterNodeArr = ts.factory.createNodeArray(newParameters);
    const returnType = node.type ? node.type : ts.getJSDocReturnType(node);

    let [func, args] = getArgsForNode(node, newParameterNodeArr, returnType);

    // if (func == "updateConstructor") func = "updateConstructorDeclaration";

    //@ts-ignore
    if (!ts.factory[func]) {
        //@ts-ignore

        if (ts.factory[func + "Declaration"]) {
            func += "Declaration";
            //@ts-ignore
        } else if (ts.factory[func + "Node"]) {
            func += "Node";
        } else {
            console.log(`unknown function`);
            console.log(
                func,
                (args as any[]).map((n) => n && getNodeKind(n))
            );
        }
        return node;
    }
    //@ts-ignore
    return ts.factory[func](...args);
};
