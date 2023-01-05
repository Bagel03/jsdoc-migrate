export const runPreCodeFixes = (str: string) => {
    const matches = str.matchAll(/function\s*\(((?:.*,?)*)\):/gm);
    for (const match of matches) {
        console.log(match)
    }
}

const test = `
/** @type {function(number): void} */
let x = 5;
`

runPreCodeFixes(test)