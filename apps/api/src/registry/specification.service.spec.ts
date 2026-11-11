import { describe, expect, it } from 'vitest';
import { SpecificationService } from './specification.service.js';

const service = new SpecificationService();

describe('SpecificationService', () => {
  it('parses OpenAPI JSON operations', () => {
    const result = service.parse('orders.json', JSON.stringify({ openapi: '3.0.3', info: { title: 'Orders', version: '2.0.0' }, paths: { '/orders': { get: { operationId: 'listOrders', responses: { '200': { description: 'ok' } } } } } }));
    expect(result.format).toBe('openapi-json'); expect(result.apiVersion).toBe('2.0.0'); expect(result.operations[0]?.operationId).toBe('listOrders');
  });
  it('parses OpenAPI YAML', () => {
    const result = service.parse('orders.yaml', 'openapi: 3.1.0\ninfo:\n  title: Orders\n  version: 1.0.0\npaths:\n  /orders:\n    post:\n      responses:\n        "201":\n          description: created\n');
    expect(result.format).toBe('openapi-yaml'); expect(result.operations[0]?.method).toBe('POST');
  });
  it('parses Swagger 2 JSON and WSDL XML', () => {
    const swagger = service.parse('legacy.json', JSON.stringify({ swagger: '2.0', info: { title: 'Legacy', version: '1.0.0' }, host: 'api.example.com', paths: { '/health': { get: { responses: { '200': {} } } } } }));
    const wsdl = service.parse('service.xml', '<definitions name="Billing"><portType name="BillingPort"><operation name="Charge"/></portType></definitions>');
    expect(swagger.format).toBe('swagger-json'); expect(wsdl.format).toBe('wsdl-xml'); expect(wsdl.operations[0]?.name).toBe('Charge');
  });
  it('rejects unsupported XML and invalid API documents', () => {
    expect(() => service.parse('data.xml', '<root><value/></root>')).toThrow('supported WSDL');
    expect(() => service.parse('data.json', '{"hello":"world"}')).toThrow('Only OpenAPI');
  });
});
