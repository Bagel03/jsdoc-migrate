const fixCtrSpacing = (str: string): string => {
    let constructorIdx = str.indexOf("constructor");

    while (constructorIdx > -1) {
        const newlineIndex = str.lastIndexOf("\n", constructorIdx);

        let beforeText = str.substring(0, newlineIndex);
        str = beforeText + "\n" + str.substring(newlineIndex);
        constructorIdx = str.indexOf("constructor", constructorIdx + 2);
    }

    return str;
};

export const fixFormatting = (doc: string): string => {
    doc = fixCtrSpacing(doc);

    return doc;
};
