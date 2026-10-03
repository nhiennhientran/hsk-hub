/** Shared-shell base is optional; historical standalone pages keep their original URLs. */
export function courseAssetBase():string{return typeof document==='undefined'?'https://hsk.invalid/':document.querySelector<HTMLMetaElement>('meta[name="hsk1-asset-base"]')?.content??document.baseURI}
