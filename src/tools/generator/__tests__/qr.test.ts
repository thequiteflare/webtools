import { describe, it, expect } from 'vitest';
import { parseQrPayload } from '../../../lib/qrUtils';

describe('QR Code Payload Parsing', () => {
  it('correctly parses URL payloads', () => {
    const res1 = parseQrPayload('https://example.com/page?test=1');
    expect(res1.type).toBe('url');
    expect(res1.url).toBe('https://example.com/page?test=1');

    const res2 = parseQrPayload('http://localhost:3000');
    expect(res2.type).toBe('url');
    expect(res2.url).toBe('http://localhost:3000');
  });

  it('correctly parses Wi-Fi payloads', () => {
    const raw = 'WIFI:S:MyHomeNetwork;T:WPA;P:SuperSecretPass;H:false;;';
    const res = parseQrPayload(raw);
    expect(res.type).toBe('wifi');
    expect(res.wifi?.ssid).toBe('MyHomeNetwork');
    expect(res.wifi?.encryption).toBe('WPA');
    expect(res.wifi?.password).toBe('SuperSecretPass');
    expect(res.wifi?.hidden).toBe(false);
  });

  it('correctly parses mailto and MATMSG email payloads', () => {
    const mailtoRaw = 'mailto:support@webtools.app?subject=Bug%20Report&body=Hello%20World';
    const resMailto = parseQrPayload(mailtoRaw);
    expect(resMailto.type).toBe('email');
    expect(resMailto.email?.to).toBe('support@webtools.app');
    expect(resMailto.email?.subject).toBe('Bug Report');
    expect(resMailto.email?.body).toBe('Hello World');

    const matmsgRaw = 'MATMSG:TO:alice@example.com;SUB:Hello;BODY:Meeting at 3pm;;';
    const resMatmsg = parseQrPayload(matmsgRaw);
    expect(resMatmsg.type).toBe('email');
    expect(resMatmsg.email?.to).toBe('alice@example.com');
    expect(resMatmsg.email?.subject).toBe('Hello');
    expect(resMatmsg.email?.body).toBe('Meeting at 3pm');
  });

  it('correctly parses telephone payloads', () => {
    const raw = 'tel:+1234567890';
    const res = parseQrPayload(raw);
    expect(res.type).toBe('phone');
    expect(res.phone?.number).toBe('+1234567890');
  });

  it('correctly parses SMS payloads', () => {
    const raw = 'smsto:+1234567890:Hello there!';
    const res = parseQrPayload(raw);
    expect(res.type).toBe('sms');
    expect(res.sms?.number).toBe('+1234567890');
    expect(res.sms?.message).toBe('Hello there!');
  });

  it('correctly parses vCard contacts', () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Jane Doe
ORG:Acme Corp
TITLE:Software Engineer
TEL:+15551234567
EMAIL:jane@acme.com
URL:https://janedoe.com
END:VCARD`;
    const res = parseQrPayload(vcard);
    expect(res.type).toBe('vcard');
    expect(res.vcard?.fullName).toBe('Jane Doe');
    expect(res.vcard?.organization).toBe('Acme Corp');
    expect(res.vcard?.title).toBe('Software Engineer');
    expect(res.vcard?.phone).toBe('+15551234567');
    expect(res.vcard?.email).toBe('jane@acme.com');
    expect(res.vcard?.url).toBe('https://janedoe.com');
  });

  it('correctly parses Geo location payloads', () => {
    const raw = 'geo:37.7749,-122.4194';
    const res = parseQrPayload(raw);
    expect(res.type).toBe('geo');
    expect(res.geo?.latitude).toBe(37.7749);
    expect(res.geo?.longitude).toBe(-122.4194);
    expect(res.geo?.mapsUrl).toContain('37.7749,-122.4194');
  });

  it('correctly parses JSON payloads', () => {
    const jsonStr = '{"service":"webtools","version":"1.0","active":true}';
    const res = parseQrPayload(jsonStr);
    expect(res.type).toBe('json');
    expect(res.jsonFormatted).toContain('"service": "webtools"');
  });

  it('defaults to plain text for generic text', () => {
    const raw = 'Just a standard plain text note inside a QR code.';
    const res = parseQrPayload(raw);
    expect(res.type).toBe('text');
    expect(res.raw).toBe(raw);
  });

  it('correctly maps decoded payload to generator form fields', () => {
    // 1. URL payload
    const urlPayload = 'https://github.com/thequiteflare/webtools';
    const parsedUrl = parseQrPayload(urlPayload);
    expect(parsedUrl.type).toBe('url');
    expect(parsedUrl.url).toBe(urlPayload);

    // 2. Wi-Fi payload
    const wifiPayload = 'WIFI:S:WebTools_5G;T:WPA;P:Secret123;H:true;;';
    const parsedWifi = parseQrPayload(wifiPayload);
    expect(parsedWifi.type).toBe('wifi');
    expect(parsedWifi.wifi?.ssid).toBe('WebTools_5G');
    expect(parsedWifi.wifi?.password).toBe('Secret123');
    expect(parsedWifi.wifi?.encryption).toBe('WPA');
    expect(parsedWifi.wifi?.hidden).toBe(true);

    // 3. Email payload
    const emailPayload = 'mailto:contact@webtools.app?subject=Feedback&body=Great%20tool';
    const parsedEmail = parseQrPayload(emailPayload);
    expect(parsedEmail.type).toBe('email');
    expect(parsedEmail.email?.to).toBe('contact@webtools.app');
    expect(parsedEmail.email?.subject).toBe('Feedback');
    expect(parsedEmail.email?.body).toBe('Great tool');

    // 4. Phone payload
    const phonePayload = 'tel:+15559876543';
    const parsedPhone = parseQrPayload(phonePayload);
    expect(parsedPhone.type).toBe('phone');
    expect(parsedPhone.phone?.number).toBe('+15559876543');
  });
});
