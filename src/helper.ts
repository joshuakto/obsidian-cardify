import * as path from "path";
import {Content, LinkedBlock} from "./type";
import {Notice} from "obsidian";

/**
 * Parse the given markdown content to extract the frontmatter and the content
 *
 * @param {string} mdContent - The markdown content
 * @return {Content} A Content object containing the frontMatter if exists (otherwise this field is null) and the content
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parseMDFile(mdContent: string): Content {
	const frontMatter = mdContent.match(/^(---\s*\n[\s\S]*?\n?---)/);
	const content: string = mdContent.replace(/^(---\s*\n[\s\S]*?\n?---)/, '');
	return {frontMatter: frontMatter? frontMatter[1] : null, content: content};
}


/**
 * Extracts the comment from the given content.
 *
 * @param {string} content - The content from which to extract the comment.
 * @return {string} The extracted comment, or an empty string if no comment is found.
 */
function extractComment(content: string): string {
	const match: RegExpMatchArray | null = content.match('(?<=\n>%%COMMENT%%\n>)(.*?)(?=\n)')
	return match ? match[1] : '';
}

/**
 * Extracts the first internal link from the given content.
 *
 * @param {string} content - The content to extract the link from.
 * @return {string | null} - The extracted link or null if no link is found.
 */
function extractInternalLink(content: string): string | null {
	const match: RegExpMatchArray | null = content.match('(?<=\n\\^)(.*?)(?=\n|$)')
	return match? match[1] : null;
}

/**
 * Parses a card block and returns a LinkedBlock object.
 *
 * @param {string} cardBlock - The card block to parse.
 * @param {string} activeFilePath - The path to the active file from which the cardBlock is extracted.
 * @return {LinkedBlock} The parsed LinkedBlock object.
 */
export function parseCardBlock(cardBlock: string, activeFilePath: string): LinkedBlock {
	return {
		title: extractComment(cardBlock),
		link: '![[' + path.basename(activeFilePath) + '#^' + extractInternalLink(cardBlock) + ']]'
	};
}

/**
 * Generates a pseudorandom key of the specified length.
 *
 * @param {number} length - The desired length of the key.
 * @returns {string} The generated pseudorandom key.
 */
function generateRandomKey(length = 10): string {
  return Array.from(Array(length), () => Math.random().toString(36).charAt(2)).join('');
}

export function addMissingInternalLink(content: string, separator: string): string {
    const gSeparator = new RegExp(separator, 'g');
    const blocks: Array<string> = content.split(gSeparator);
    const internalLinkRegex = '(?<=\n\\^)(.*?)(?=\n*?$)'
    // setting the g flag for the separator so match returns all matches
	const separatorList: RegExpMatchArray | null = content.match(gSeparator);
	console.log(separatorList); // Added
	// check that the separatorList is one element less than the blocks list
	if (!separatorList && blocks.length !== 1) {
		new Notice('Cannot add missing internal link, separator not found but have >1 blocks.')
		return content
	} else if (separatorList && separatorList.length !== blocks.length - 1) {
		new Notice('Cannot add missing internal link, mismatch length between separator and linked blocks.')
		return content
	}
	// add missing internal link for each blocks
	const linkedBlocks: Array<string> = blocks.map((block: string, idx: number) => {
		if (!block.match(internalLinkRegex) && block !== '') {
			const linkAnnotation: string = block.slice(-1) === '\n' ? '^' : '\n^'
			if (separatorList && idx < separatorList.length) {
				return block + linkAnnotation + generateRandomKey() + separatorList[idx]
			} else {
				return block + linkAnnotation + generateRandomKey()
			}
		}
		if (separatorList && idx < separatorList.length) {
            return block + separatorList[idx]
        } else {
			return block
		}
	})
	console.log(separatorList)
	return linkedBlocks.join('');
}
