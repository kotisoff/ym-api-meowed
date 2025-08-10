import { XMLParser } from "fast-xml-parser";

const sample = `<download-info>
  <host>example.cdn.yandex.net</host>
  <path>/get-mp3/somepath/file.mp3</path>
  <ts>1720543210</ts>
  <s>abcdef0123456789</s>
</download-info>`;

const parser = new XMLParser({ ignoreAttributes: false });
const parsed = parser.parse(sample);

if (
  !parsed?.["download-info"]?.host ||
  !parsed?.["download-info"]?.path ||
  !parsed?.["download-info"]?.ts ||
  !parsed?.["download-info"]?.s
) {
  throw new Error("XML parsing failed: required fields are missing");
}

console.log("XML parsing smoke test passed:", parsed["download-info"]);
