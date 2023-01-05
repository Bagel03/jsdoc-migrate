const fixImportTypeHints = (str: string): string => {
    const starter = "typehints:start";
    const ending = "typehints:end";
    const startIdx = str.indexOf(starter);
    const endIdx = str.indexOf(ending);

    if (!startIdx || !endIdx) {
        return str;
    }

    const beforeStr = str.substring(0, startIdx);
    const afterStr = str.substring(endIdx);
    const typeHintStr = str.substring(startIdx, endIdx);

    return (
        beforeStr + typeHintStr.replaceAll("import", "import type") + afterStr
    ).replace("/* typehints:start */\n", "")
        .replace("/* typehints:end */\n", "")
};

export const runCodeFixes = (doc: string): string => {
    doc = fixImportTypeHints(doc);

    return doc;
};
