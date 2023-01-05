type removalArray = { start: number; end: number }[];
const findAllJSDocs = (str: string): removalArray => {
    const removals: removalArray = [];

    for (let i = 0; i < str.length; i++) {
        if (str.startsWith("/**", i)) {
            const end = str.indexOf("*/", i);

            if (end < 0) {
                console.error("Unfinished comment");
                continue;
            }
            removals.push({
                start: i,
                end: end + 2,
            });
            i = end;
        }
    }

    return removals;
};

const getBalancedCurlyBrace = (str: string, startingAt: number): number => {
    let ballance = 1;

    for (let i = startingAt; i < str.length; i++) {
        if (str[i] == "}") ballance--;
        else if (str[i] == "{") {
            ballance++;
        }

        if (ballance == 0) {
            return i;
        }
    }
    return -1;
};

// console.log(test)

// console.log(removeAllJsdoc(test));
console.log("hi")

const editJSDOC = (jsdoc: string) => {
    // Multiline single line ones
    if (jsdoc.indexOf("\n") == -1) {
        jsdoc = jsdoc.replace("/**", "/**\n")
        jsdoc = jsdoc.replace("*/", "\n*/")
    }


    if (jsdoc.includes("typedef")) return "";


    // Remove the types
    const typeRemovals = [] as removalArray;
    let idx = 0;
    while (idx < jsdoc.length) {
        if (jsdoc[idx] == "{") {
            let end = getBalancedCurlyBrace(jsdoc, idx + 1);
            if (end < 0) {
                throw new Error("Bad")
            }
            typeRemovals.push({ start: idx, end });
            idx = end;
        }
        idx++;
    }

    for (let i = typeRemovals.length - 1; i > -1; i--) {
        jsdoc = jsdoc.substring(0, typeRemovals[i].start) + jsdoc.slice(typeRemovals[i].end + 1)
    }


    // @type
    jsdoc = jsdoc.replaceAll("@type", "");

    // @param
    jsdoc = jsdoc.replaceAll(/@param\s+[0-9a-zA-z.]+\s*$/gm, "")

    // @returns 
    jsdoc = jsdoc.replaceAll(/@returns\s*$/gm, "")

    // empty lines
    jsdoc = jsdoc.replaceAll(/\n\s*\*\s*$/gm, "")

    // changes ones that can be single line to single line
    const lines = jsdoc.split("\r\n")
    if (lines.length <= 3) {
        console.log("Lines: ", lines);
        console.log("\n")
        jsdoc = jsdoc.replaceAll("\r\n", "")
        jsdoc = jsdoc.replace(/\/\*\*\s+\*/, "/**")

    }

    // remove double space
    jsdoc = jsdoc.replaceAll(/ +/g, " ");

    // empty jsdoc
    // /** [ | *] */
    if (jsdoc.match(/^\/\*[ *\n]*\*\/$/)) {
        return ""
    }


    return jsdoc
}

export const removeAllJsdoc = (str: string) => {
    const jsDocs = findAllJSDocs(str).map(({ start, end }) => ({ start, end, text: str.substring(start, end) }));
    const editedJSDocs = jsDocs.map(obj => ({
        ...obj,
        text: editJSDOC(obj.text),
    }));

    let newStr = str;
    for (let i = editedJSDocs.length - 1; i > -1; i--) {
        let edited = editedJSDocs[i];
        if (edited.text === "" && newStr[edited.end] == "\n")
            newStr = newStr.substring(0, edited.start) + newStr.slice(edited.end + 1)

        else
            newStr = newStr.substring(0, edited.start) + edited.text + newStr.slice(edited.end)
    }
    return newStr;
}