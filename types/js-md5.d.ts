declare module "js-md5" {
  interface Md5 {
    (input: string | ArrayBuffer): string;
    hex(input: string | ArrayBuffer): string;
    base64(input: string | ArrayBuffer): string;
  }
  const md5: Md5;
  export default md5;
}
