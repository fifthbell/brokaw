import { z } from 'zod';

const awsRegion = z.string().regex(/^[a-z]{2}(?:-gov)?-[a-z]+-\d$/);
const uuid = z.string().uuid();

export const rumConfigSchema = z
  .object({
    appMonitorId: uuid,
    applicationVersion: z.string().regex(/^[A-Za-z0-9._:/-]{1,200}$/),
    region: awsRegion,
    identityPoolId: z.string().regex(/^[a-z]{2}(?:-gov)?-[a-z]+-\d:[0-9a-fA-F-]{36}$/),
    guestRoleArn: z
      .string()
      .regex(/^arn:(?:aws|aws-us-gov|aws-cn):iam::\d{12}:role\/[A-Za-z0-9+=,.@_\/-]{1,512}$/)
  })
  .strict()
  .superRefine((config, context) => {
    if (!config.identityPoolId.startsWith(`${config.region}:`)) {
      context.addIssue({
        code: 'custom',
        path: ['identityPoolId'],
        message: 'identityPoolId region must match region'
      });
    }
  });

export type RumConfig = z.infer<typeof rumConfigSchema>;

type RumPageType =
  | 'article-page'
  | 'homepage'
  | 'category-page'
  | 'search-page'
  | '404'
  | 'live-story'
  | 'link-in-bio'
  | 'media-page';

type ContentLanguage = 'en' | 'es' | 'it';

const jsonForInlineScript = (value: string): string =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

/**
 * Produces the tenant-neutral loader shared by every public page shell.
 * Configuration values are public deployment identifiers supplied by the
 * renderer caller; no tenant-specific values are embedded in Brokaw.
 */
export function renderRumLoader(
  config: RumConfig,
  pageType: RumPageType,
  language: ContentLanguage
): string {
  const parsed = rumConfigSchema.parse(config);
  const endpoint = `https://dataplane.rum.${parsed.region}.amazonaws.com`;

  return `<script data-brokaw-rum-loader>
  (function () {
    try {
      function containsSensitiveErrorData(event) {
        var reason = event && event.reason;
        var error = event && event.error;
        var candidate = [
          event && event.message,
          event && event.filename,
          typeof reason === 'string' ? reason : reason && reason.message,
          error && error.message
        ].filter(Boolean).join(' ');
        return candidate.length > 256 || /(?:https?:\\/\\/|[?#]|authorization|bearer|credential|password|passcode|api[_-]?key|access[_-]?token|refresh[_-]?token|<[^>]+>|[{}][^{}]{8,}[{}])/i.test(candidate);
      }

      (function (namespace, appMonitorId, applicationVersion, region, source, clientConfig, client, script) {
        client = window.AwsRumClient = {
          q: [],
          n: namespace,
          i: appMonitorId,
          v: applicationVersion,
          r: region,
          c: clientConfig
        };
        window[namespace] = function (command, payload) {
          client.q.push({ c: command, p: payload });
        };
        script = document.createElement('script');
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.src = source;
        script.onerror = function () {
          client.q = [];
          window[namespace] = function () {};
        };
        document.head.appendChild(script);
      })(
        'cwr',
        ${jsonForInlineScript(parsed.appMonitorId)},
        ${jsonForInlineScript(parsed.applicationVersion)},
        ${jsonForInlineScript(parsed.region)},
        'https://client.rum.us-east-1.amazonaws.com/3.0.0/cwr.js',
        {
          identityPoolId: ${jsonForInlineScript(parsed.identityPoolId)},
          guestRoleArn: ${jsonForInlineScript(parsed.guestRoleArn)},
          sessionSampleRate: 1,
          endpoint: ${jsonForInlineScript(endpoint)},
          telemetries: [
            ['errors', { stackTraceLength: 0, ignore: containsSensitiveErrorData }],
            ['performance', {
              ignore: function (entry) { return entry && entry.entryType === 'resource'; },
              recordAllTypes: [],
              sampleTypes: []
            }]
          ],
          allowCookies: false,
          enableXRay: false,
          recordResourceUrl: false,
          pageIdFormat: 'PATH',
          disableAutoPageView: true
        }
      );

      window.cwr('recordPageView', {
        pageId: window.location.pathname,
        pageAttributes: {
          page_type: ${jsonForInlineScript(pageType)},
          content_language: ${jsonForInlineScript(language)}
        }
      });
    } catch (_rumError) {
      // Monitoring is optional and must never block rendering or navigation.
    }
  })();
</script>`;
}
