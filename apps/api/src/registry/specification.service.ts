import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import { parse as parseYaml } from 'yaml';

export type NormalizedOperation = { name: string; method: string; path: string; operationId?: string; description?: string; parameters?: unknown; requestSchema?: unknown; responseSchema?: unknown; security?: unknown; expectedStatusCodes?: string[]; validationStatus: 'valid' | 'warning' | 'invalid'; validationMessage?: string };
export type NormalizedSpecification = { title: string; description?: string; sourceVersion: string; apiVersion: string; format: 'openapi-json' | 'openapi-yaml' | 'swagger-json' | 'swagger-yaml' | 'wsdl-xml'; baseUrl?: string; protocol: string; tags: string[]; externalReferences: string[]; operations: NormalizedOperation[]; contract: unknown; raw: string };

@Injectable()
export class SpecificationService {
  checksum(content: string) { return createHash('sha256').update(content).digest('hex'); }

  parse(filename: string, content: string): NormalizedSpecification {
    const lower = filename.toLowerCase();
    if (content.length > 5_000_000) throw new BadRequestException('Specification exceeds the 5 MB limit');
    if (lower.endsWith('.xml') || content.trimStart().startsWith('<')) return this.parseWsdl(filename, content);
    let document: Record<string, unknown>;
    try { document = (lower.endsWith('.yaml') || lower.endsWith('.yml') ? parseYaml(content) : JSON.parse(content)) as Record<string, unknown>; } catch { throw new BadRequestException('The specification is not valid JSON or YAML'); }
    if (!document || typeof document !== 'object') throw new BadRequestException('The specification must be an object');
    const sourceVersion = typeof document.openapi === 'string' ? document.openapi : typeof document.swagger === 'string' ? document.swagger : '';
    const isOpenApi = typeof document.openapi === 'string' && /^3\.(0|1)(?:\.|$)/.test(document.openapi);
    const isSwagger = typeof document.swagger === 'string' && /^2\.0(?:\.|$)/.test(document.swagger);
    if (!isOpenApi && !isSwagger) throw new BadRequestException('Only OpenAPI 3.0/3.1 and Swagger 2.0 specifications are supported');
    const info = (document.info && typeof document.info === 'object' ? document.info : {}) as Record<string, unknown>;
    const schemes = Array.isArray(document.schemes) ? document.schemes : [];
    const servers = Array.isArray(document.servers) ? document.servers : isSwagger && typeof document.host === 'string' ? [`${typeof schemes[0] === 'string' ? schemes[0] : 'https'}://${document.host}${typeof document.basePath === 'string' ? document.basePath : ''}`] : [];
    const baseUrl = typeof servers[0] === 'string' ? servers[0] : servers[0] && typeof servers[0] === 'object' && typeof (servers[0] as Record<string, unknown>).url === 'string' ? (servers[0] as Record<string, string>).url : undefined;
    const paths = document.paths && typeof document.paths === 'object' ? document.paths as Record<string, unknown> : {};
    const operations: NormalizedOperation[] = [];
    for (const [path, rawPath] of Object.entries(paths)) { if (!rawPath || typeof rawPath !== 'object') continue; for (const [method, rawOperation] of Object.entries(rawPath as Record<string, unknown>)) { if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'].includes(method.toLowerCase()) || !rawOperation || typeof rawOperation !== 'object') continue; const operation = rawOperation as Record<string, unknown>; const responses = operation.responses && typeof operation.responses === 'object' ? Object.keys(operation.responses as object) : []; operations.push({ name: typeof operation.summary === 'string' ? operation.summary : `${method.toUpperCase()} ${path}`, method: method.toUpperCase(), path, operationId: typeof operation.operationId === 'string' ? operation.operationId : undefined, description: typeof operation.description === 'string' ? operation.description : undefined, parameters: operation.parameters, requestSchema: operation.requestBody, responseSchema: operation.responses, security: operation.security || document.security, expectedStatusCodes: responses, validationStatus: 'valid' }); } }
    if (!operations.length) throw new BadRequestException('The specification contains no supported API operations');
    const externalReferences = this.findExternalReferences(document);
    const tags = Array.isArray(document.tags) ? document.tags.map((tag) => typeof tag === 'object' && tag && typeof (tag as Record<string, unknown>).name === 'string' ? String((tag as Record<string, unknown>).name) : null).filter((tag): tag is string => Boolean(tag)) : [];
    return { title: typeof info.title === 'string' ? info.title : 'Imported API', description: typeof info.description === 'string' ? info.description : undefined, sourceVersion, apiVersion: typeof info.version === 'string' ? info.version : '1.0.0', format: isOpenApi ? (lower.endsWith('.yaml') || lower.endsWith('.yml') ? 'openapi-yaml' : 'openapi-json') : (lower.endsWith('.yaml') || lower.endsWith('.yml') ? 'swagger-yaml' : 'swagger-json'), baseUrl, protocol: baseUrl?.startsWith('https') ? 'https' : 'http', tags, externalReferences, operations, contract: document, raw: content };
  }

  private parseWsdl(_filename: string, content: string): NormalizedSpecification {
    let document: Record<string, unknown>; try { document = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true }).parse(content) as Record<string, unknown>; } catch { throw new BadRequestException('The XML document is not well formed'); }
    const definitions = (document.definitions || document.description) as Record<string, unknown> | undefined;
    if (!definitions || typeof definitions !== 'object') throw new BadRequestException('The XML document is not a supported WSDL 1.1 or 2.0 definition');
    const service = Array.isArray(definitions.service) ? definitions.service[0] : definitions.service;
    const serviceName = service && typeof service === 'object' && typeof (service as Record<string, unknown>)['@_name'] === 'string' ? String((service as Record<string, unknown>)['@_name']) : typeof definitions['@_name'] === 'string' ? definitions['@_name'] : 'Imported SOAP service';
    const operations: NormalizedOperation[] = [];
    const collect = (value: unknown) => { for (const item of Array.isArray(value) ? value : [value]) { if (!item || typeof item !== 'object') continue; const op = item as Record<string, unknown>; if (typeof op['@_name'] === 'string') operations.push({ name: op['@_name'] as string, method: 'POST', path: `/${serviceName}/${op['@_name']}`, operationId: op['@_name'] as string, description: 'WSDL operation', expectedStatusCodes: ['200'], validationStatus: 'valid' }); } };
    collect(definitions.portType && typeof definitions.portType === 'object' ? (definitions.portType as Record<string, unknown>).operation : undefined); collect(definitions.interface && typeof definitions.interface === 'object' ? (definitions.interface as Record<string, unknown>).operation : undefined);
    if (!operations.length) throw new BadRequestException('The WSDL contains no service operations');
    return { title: serviceName, sourceVersion: 'WSDL 1.1/2.0', apiVersion: '1.0.0', format: 'wsdl-xml', protocol: 'soap', tags: ['soap'], externalReferences: [], operations, contract: document, raw: content };
  }

  private findExternalReferences(value: unknown, refs = new Set<string>()): string[] { if (Array.isArray(value)) value.forEach((item) => this.findExternalReferences(item, refs)); else if (value && typeof value === 'object') Object.entries(value).forEach(([key, child]) => { if ((key === '$ref' || key === 'externalDocs') && typeof child === 'string' && !child.startsWith('#')) refs.add(child); else this.findExternalReferences(child, refs); }); return [...refs]; }
}
