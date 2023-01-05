import { readFile, writeFile, rm } from "fs/promises";
import { execSync } from "child_process"
import path from "path";
import * as url from "url";
import ts from "typescript";
import { betterJsdocPlugin, getNodeKind } from "./plugin.js";
import glob from "glob";
import { removeAllJsdoc } from "./cleanup/remove_jsdoc.js";
import { fixFormatting } from "./cleanup/fix_formattig.js";
import { cleanup } from "./cleanup/cleanup.js";
// const __filename = url.fileURLToPath(import.meta.url);
// const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

// const out = path.resolve(__dirname, "..", "test", "out");
// const test = path.resolve(__dirname, "..", "test", "src");

// await copy(test, out);

const typeDefTests = `
/**
 * @typedef {string} foo
 */

/**
 * @typedef {{hello: number}} bar
 */

/**
 * @typedef {[number, string]} biz
 */

/**
* @typedef {object} lol
* @property {string} lmao
*/

let x = 5;`;

const functionTest = `
/**
 * @param {number[]} z
 */
function x(y, ...z) {}

/**
 * @param {number=} y
 * @param {boolean=}z
 */
function x(y, z = true) {}



/**
 * @param {object} param0
 * @param {number} param0.x
 * @param {string} param0.y
 */
function y({x, y}) {}
let x = function(y) {}

let x = (y) => {}
class A {
    constructor(a) {
        /** @type {number} */(this.x).y = 5;
    }

    foo(b) {}

    foo(b);
}
`;

const classTest = `
class A {
    constructor() {
        /** @type {number} */
        this.b = 5;

        /** @type {number} */
        this.a.b = 5;

        this.signals = {
            hello: "hi"
        }

        /**
         * @type {Object<enumItemProcessorTypes, (lol: ProcessorImplementationPayload) => string>}
         */
        this.handlers = {}

        /** @type {lol} */
        this.a.b;
    }

    joe() {}
}
`;

const weirdTest = `
export class MapChunkView extends MapChunk {
    /**
     *
     * @param {GameRoot} root
     * @param {number} x
     * @param {number} y
     */
    constructor(root, x, y) {
        super(root, x, y);

        /**
         * Whenever something changes, we increase this number - so we know we need to redraw
         */
        this.renderIteration = 0;

        this.markDirty();
    }

    /**
     * Marks this chunk as dirty, rerendering all caches
     */
    markDirty() {
        ++this.renderIteration;
        this.renderKey = this.x + "/" + this.y + "@" + this.renderIteration;
        this.root.map.getAggregateForChunk(this.x, this.y, true).markDirty(this.x, this.y);
    }

`

const jsDir = "C:/Dev Temp/ts/shapez-community-edition/src/js";
const srcDir = "C:/Dev Temp/ts/shapez-community-edition/src/ts3";
const printer = ts.createPrinter();

const runOnDir = () => {
    glob(jsDir + "/**/*.js", async (err, files) => {
        console.log("Transforming ", files.length, "files");
        const promises = files.map(async (fileName) => {
            const realName = fileName.replace(".js", ".ts").replace(jsDir, srcDir);
            let fileContents = await readFile(fileName, {
                encoding: "utf-8",
            });
            fileContents = fileContents.replaceAll("\r\n", "\n");
            fileContents = fileContents.replaceAll("\n\n", "\n/*--NEWLINE--*/");

            console.log(
                `${fileName.slice(srcDir.length)} ---> ${realName.slice(
                    srcDir.length
                )}`
            );

            const file = ts.createSourceFile(
                realName.split("\\").at(-1)!,
                fileContents,
                ts.ScriptTarget.ESNext,
                true,
                ts.ScriptKind.TS
            );

            const outputNode = ts.transform(file, [betterJsdocPlugin])
                .transformed[0];

            let printed = printer.printNode(
                ts.EmitHint.SourceFile,
                outputNode,
                file
            );

            // Weird side effect of the stupid comments thing
            printed = printed.replaceAll("/*/**", "/**");
            printed = printed.replaceAll("/*/*", "/*");
            printed = printed.replaceAll("*/*/", "*/");

            printed = printed.replaceAll("/*--NEWLINE--*/", "\n")
            printed = printed.replaceAll("= /*--REMOVE_PREV--*/", "")


            let cleanedUp = cleanup(printed);

            await writeFile(realName, cleanedUp);
            // await rm(fileName);
        });

        // await Promise.all(promises);
        for await (const promise of promises) {
            try {
                promise;
            } catch (e) {
                console.log("Error");
            }
        }

        // await Promise.all(promises);
        console.log("Running prettier")
        await execSync("npx prettier --write .", { cwd: srcDir, stdio: 'inherit' })

        console.log("All done");
        process.exit(1);
    });
};

const runTests = () => {
    let fileContents = weirdTest;
    fileContents = fileContents.replaceAll("\n\n", "\n/*--NEWLINE--*/");

    const file = ts.createSourceFile(
        "test.ts",
        fileContents,
        ts.ScriptTarget.ESNext,
        true,
        ts.ScriptKind.TS
    );
    const output = ts.transform(file, [betterJsdocPlugin]);

    let printed = printer.printNode(
        ts.EmitHint.SourceFile,
        output.transformed[0],
        file
    );



    console.log(
        "\x1b[32m",
        `${"-".repeat(15)} INPUT ${"-".repeat(15)}`,
        "\x1b[0m"
    );
    console.log(fileContents)

    console.log(
        "\x1b[32m",
        `${"-".repeat(15)} CONVERTED ${"-".repeat(15)}`,
        "\x1b[0m"
    );

    console.log(printed);

    console.log(
        "\x1b[32m",
        `${"-".repeat(15)} OUTPUT ${"-".repeat(15)}`,
        "\x1b[0m"
    );

    printed.replaceAll("= /**REMOVE_PREV*/", "")

    // Weird side effect of the stupid comments thing
    printed = printed.replaceAll("/*/**", "/**");
    printed = printed.replaceAll("/*/*", "/*");
    printed = printed.replaceAll("*/*/", "*/");

    printed = printed.replaceAll("/*--NEWLINE--*/", "\n")
    let cleanedUp = cleanup(printed);
    console.log(cleanedUp);
};

runOnDir();
// runTests();
