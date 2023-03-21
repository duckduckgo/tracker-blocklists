# Using DuckDuckGo's Web Tracker Blocklist

The following description explains, at the high-level, how web blocklists are used for tracker blocking in DuckDuckGo apps and extensions.

For each third party asset request on the site, take the hostname of a request, including subdomains:

1. Check for a [cloaked CNAME](https://help.duckduckgo.com/duckduckgo-help-pages/privacy/web-tracking-protections/#cname-cloaking-protection) by looking for a corresponding key in the [cnames](README.md#cnames) object. Continue removing subdomains until a match is found or you no longer have a valid hostname.

    - If a match is found replace the request hostname with the matched `cnames` value. Continue to step 2 with the updated request.
    - If no match is found continue to step 2 with the unaltered request.

2. With the third party request from 1, check for a corresponding key in the [trackers](README.md#trackers) object. Continue removing subdomains until a match is found or you no longer have a valid hostname.

    - If no match is found, don't block the request
    - If a match is found, continue to step 3

3. If a match is found:

- 3a. If the entry has rules
    - Rules are ordered from most specific to least specific, and only one rule can match per request.

    - Loop through the rule list and apply regular expression, ignoring case and start/end position, with the full request URL using each rule.

        - If a rule match is found, then for the first matching rule:

            a. If the rule has `action: ignore`, do not block[^2]
	    
	      b. If there are rule `options`, do any of the domains and request types match this request?[^1]

	      - No: Continue to next rule
	      - Yes: Continue to next step (C below)

          c. If there are rule `exceptions`, do any of the domains and request types match this request?[^1]

	      - Yes: Don't block[^2]
	      - No: Block

	      d. If the rule has a `surrogate`, serve the corresponding replacement code instead of blocking

	      e. If the rule does not have an `action`, matching `exceptions`, or `surrogate`, then block the request

        - If no rule match was found go to 3b.

- 3b. If the entry does not have rules or no rules matched this request

    - If the entry has `default: ignore`, then don't block[^2]
    - If the entry has `default: block`, then block the request

[^1]: Rule options and exceptions can have both a list of domains and a list of request types. The domains in the `domains` list should match on all subdomains. For example, if `a.site.com` is in your domains list, then it should match for `b.a.site.com` but not on `site.com`.

[^2]: Other [privacy protections](https://help.duckduckgo.com/duckduckgo-help-pages/privacy/web-tracking-protections/) apply to non-blocked trackers.

See https://github.com/duckduckgo/privacy-grade/blob/master/src/classes/trackers.js for an example implementation.

---

## Examples

These are some typical blocking examples, but do not cover all possible cases. For a more comprehensive list of test cases see [privacy reference tests](https://github.com/duckduckgo/privacy-reference-tests/tree/main/tracker-radar-tests/TR-domain-matching).

### Tracker with no rules but `default: block`

This tracker doesn't have any rules and has `default: block`. We will block all third party requests from this tracker.

```json
{
    "domain": "example-tracker.com",
    "default": "block",
    "owner": {
    	"name": "Example Tracker"
    }
 }
```

|  Site | Request URL  | Request type | Block | Reason |
|---|---|---|---|---|
| abc.com | example-tracker.com/ad.js | script  |  true | default set to 'block' |

### Tracker with no rules and `default: ignore`

This tracker doesn't have any rules and has `default: ignore`. There are some trackers that can not be blocked due to breakage. In
these cases we can still identify the third-party domain as a tracker so that other privacy protections other than blocking can be used, for
example, blocking cookies.

```json
{
    "domain": "image-cdn-example.com",
    "default": "ignore",
    "owner": {
        "name": "Example LTD.",
        "displayName": "Example Site"
    }
 }
```

|  Site | Request URL  | Request type | Block | Reason |
|---|---|---|---|---|
| abc.com | abc.image-cdn-example.com/image1.jpg | image  |  false | default set to 'ignore', no matching rules |

### Tracker with rules and `default: block`

We have `default: block`, so we block all third party requests that don't match one of the rules. The first rule doesn't have any `exceptions` so we block all matching requests. It also has a surrogate[^3] listed which, if supported by the client, can be substituted in place of the request.
The second rule is limited to blocking all matching requests except for those whose type is `image`.

[^3]: Certain tracking scripts are implemented in a way that attaches function calls to page elements. When these scripts are blocked, they can cause usability issues. In order to block these requests while still maintaining site functionality, we redirect the requests to surrogate code that replaces all of their functions with no-ops.

```json
{
    "domain": "test-tracker.net",
    "default": "block",
    "rules": [
        {
            "rule": "test-tracker\\.net\\/instream\\/.*\\/ad_status\\.js",
            "surrogate": "ad_status.js"
        },
        {
            "rule": "test-tracker\\.net\\/ddm\\/",
            "exceptions": {
                "types": [
                    "image"
                ]
            }
        }
    ],
    "owner": {
        "name": "Tracking Company"
    }
 }
```

|  Site | Request URL  | Request type | Block | Reason |
|---|---|---|---|---|
| example.com | test-tracker.net/instream/1234/ad_status.js |  script |  true (surrogate) | matches rule |
| example.com | test-tracker.net/ddm/ | script  |  true | matches rule |
| example.com | test-tracker.net/ddm/ | image  |  false | matches rule and matches rule exception |
| example.com | test-tracker.net/adimage.png | image  |  true | no matching rule, default is set to 'block' |

### Rule with `exceptions` and `options`

We have `default: ignore`, so we only block requests that match a rule. 
- The first rule doesn't have any `options` or `exceptions`, so we block any matching request.
- The second rule has `options`, we will only block requests that match the rule and come from a site matching the domains list.
- The third rule has a both `exceptions` and `options`. For this rule we only block the request when it matches one of the `options` domains, and only if it doesn't also match an `exceptions` domain. 
```json
{
    "domain": "example.net",
    "default": "ignore",
    "rules": [
        {
            "rule": "connect\\.example\\.net\\/signals\\/"
        },
	{
	    "rule": "sometimes-tracking\\.example\\.net",
	    "options": {
	    	"domains": [
		    "test-site-3.com"
		]
	    }
	},
        {
            "rule": "example\\.net\\/.*\\/AudienceNetworkVPAID\\.",
	    "options": {
	    	"domains": [
		    "test-site-2.com",
		    "test-site-3.com"
		], 
		"types": [
	            "script"
		]
	    },
	    "exceptions": {
	    	"types": [
		    "script"
		],
		"domains": [
		    "test-site-2.com"
		]
	    }
        }
    ],
    "owner": {
        "name": "Example Tracker"
    }
 }
```

|  Site | Request URL  | Request type | Block | Reason |
|---|---|---|---|---|
| test-site.com | connect.example.net/signals/ |  script |  true | matches rule |
| test-site.com | example.net/tracker.js |  script |  false | default set to 'ignore' |
| test-site-3.com | sometimes-tracking.example.net/track.js | script  |  true | matches option domain |
| test-site-2.com | sometimes-tracking.example.net/track.js | script  |  false | does not match option domain |
| test-site-2.com | example.net/123/AudienceNetworkVPAID.png | script  |  false | matches option, but also matches exception type and domain |
| test-site-3.com | example.net/123/AudienceNetworkVPAID.png | image  |  false | matches option domain but not type |
| test-site-3.com | example.net/123/AudienceNetworkVPAID.png | script  |  true | matches option, does not match exception domain |
