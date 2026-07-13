import type { ComponentType } from "react";

import { UrlDefangTool } from "@/components/tools/url-defang";
import { UrlRefangTool } from "@/components/tools/url-refang";
import { Base64Tool } from "@/components/tools/base64";
import { UrlEncodeTool } from "@/components/tools/url-encode";
import { JwtTool } from "@/components/tools/jwt";
import { JsonTool } from "@/components/tools/json";
import { XmlTool } from "@/components/tools/xml";

import { HashTool } from "@/components/tools/hash";
import { FileHashTool } from "@/components/tools/file-hash";
import { HashCompareTool } from "@/components/tools/hash-compare";
import { PasswordStrengthTool } from "@/components/tools/password-strength";

import { HttpHeadersTool } from "@/components/tools/http-headers";

import { GoogleDorkTool } from "@/components/tools/google-dork";

import { RansomwareLiveTool } from "@/components/tools/ransomware-live";

export const TOOL_REGISTRY: Record<string, ComponentType> = {
  "url-defang": UrlDefangTool,
  "url-refang": UrlRefangTool,
  base64: Base64Tool,
  "url-encode": UrlEncodeTool,
  jwt: JwtTool,
  json: JsonTool,
  xml: XmlTool,

  hash: HashTool,
  "file-hash": FileHashTool,
  "hash-compare": HashCompareTool,
  "password-strength": PasswordStrengthTool,

  "http-headers": HttpHeadersTool,

  "google-dork": GoogleDorkTool,

  "ransomware-live": RansomwareLiveTool,
};
